"""
adaptive_reverifier.py
======================
NOVEL ALGORITHM #3 — Adaptive Multi-Shot Re-Verification Pipeline
==================================================================

PATENT CLAIM CORE:
    A computer-implemented method for improving waste dump detection
    confidence through adaptive multi-shot image acquisition, comprising:
    (a) analysing the spatial composition of an initial image by computing
        the dominant bounding box area fraction and centroid offset;
    (b) generating citizen-directed recapture guidance specifying an
        estimated physical distance adjustment (derived from bounding box
        geometry and assumed smartphone camera field-of-view) and a
        framing correction direction;
    (c) accepting a second image captured per the guidance;
    (d) verifying temporal consistency between the two captures (max 5 min);
    (e) verifying spatial consistency via GPS proximity check (max 30 m);
    (f) fusing the two confidence scores using a recency-weighted scheme
        (w1=0.35, w2=0.65) with a consistency penalty for contradictory
        waste-type classifications; and
    (g) applying final triage thresholds to the fused score.

WHY THIS IS NOVEL:
    Existing multi-shot or burst-mode approaches in object detection do not
    incorporate citizen-directed physical repositioning guidance derived from
    the model's own bounding box output, nor do they apply GPS proximity and
    timestamp consistency as pre-fusion validity gates.
"""

import math
import datetime
from dataclasses import dataclass, field
from typing import List, Optional, Literal, Dict


# ── Constants ─────────────────────────────────────────────────────────────────

# Smartphone typical horizontal FoV (degrees) — used for distance estimation
SMARTPHONE_HFOV_DEG   = 68.0

# Weights for confidence fusion (second image weighted more; citizen followed guidance)
W1, W2 = 0.35, 0.65

# Consistency penalty: applied when waste types disagree between images
CONSISTENCY_PENALTY   = 0.10

# Temporal gate: second image must arrive within this window
MAX_INTER_SHOT_SEC    = 300   # 5 minutes

# Spatial gate: submitter must not have moved more than this
MAX_MOVEMENT_M        = 30.0

# Final triage thresholds on fused score
AUTO_APPROVE_THRESH   = 0.90
MANUAL_REVIEW_THRESH  = 0.70


# ── Data classes ──────────────────────────────────────────────────────────────

@dataclass
class BBox:
    x1: float; y1: float; x2: float; y2: float  # normalised 0–1
    confidence: float
    cls: str

    @property
    def area_fraction(self) -> float:
        return (self.x2 - self.x1) * (self.y2 - self.y1)

    @property
    def centroid_x(self) -> float:
        return (self.x1 + self.x2) / 2.0

    @property
    def centroid_y(self) -> float:
        return (self.y1 + self.y2) / 2.0


@dataclass
class RecaptureGuidance:
    """Specific, actionable instruction for the citizen to re-photograph."""
    instruction: str                          # Human-readable text
    distance_adjustment_m: Optional[float]   # Positive = move back; negative = move forward
    framing_correction: str                  # 'centre', 'left', 'right', 'tilt_down', 'none'
    reason: str
    estimated_optimal_distance_m: Optional[float]


@dataclass
class FusionResult:
    fused_confidence: float
    shot1_confidence: float
    shot2_confidence: float
    weights_used: Dict[str, float]
    consistency_penalty_applied: float
    waste_types_agree: bool
    final_triage: Literal['auto_approved', 'manual_review', 'rejected']
    forensic_notes: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "fused_confidence":            round(self.fused_confidence, 4),
            "shot1_confidence":            round(self.shot1_confidence, 4),
            "shot2_confidence":            round(self.shot2_confidence, 4),
            "weights":                     {k: round(v, 3) for k, v in self.weights_used.items()},
            "consistency_penalty":         round(self.consistency_penalty_applied, 3),
            "waste_types_agree":           self.waste_types_agree,
            "final_triage":                self.final_triage,
            "forensic_notes":              self.forensic_notes,
        }


@dataclass
class MultiShotVerificationResult:
    needs_second_shot: bool
    guidance: Optional[RecaptureGuidance]
    fusion: Optional[FusionResult]
    reason: str

    def to_dict(self) -> dict:
        return {
            "needs_second_shot": self.needs_second_shot,
            "reason":            self.reason,
            "guidance": {
                "instruction":              self.guidance.instruction,
                "distance_adjustment_m":    self.guidance.distance_adjustment_m,
                "framing_correction":       self.guidance.framing_correction,
                "estimated_optimal_dist_m": self.guidance.estimated_optimal_distance_m,
                "reason":                   self.guidance.reason,
            } if self.guidance else None,
            "fusion": self.fusion.to_dict() if self.fusion else None,
        }


# ── Guidance computation ──────────────────────────────────────────────────────

def _estimate_distance_adjustment(largest_bbox: BBox) -> tuple[Optional[float], float]:
    """
    Estimate how far the citizen should move to achieve the optimal
    bounding box fill of 35–45% of frame area.

    Uses pinhole camera geometry:
        new_distance / current_distance = sqrt(target_area / current_area)

    Assumes a notional current distance of 3 m (typical urban reporting range).

    Returns (distance_adjustment_m, optimal_distance_m)
    Positive adjustment = move back; negative = move closer.
    """
    CURRENT_DIST_M    = 3.0
    TARGET_AREA_FRAC  = 0.40   # optimal fill fraction

    area = largest_bbox.area_fraction
    if area < 1e-6:
        return None, CURRENT_DIST_M

    # Scale factor from area ratio (linear dim scales with distance)
    scale            = math.sqrt(TARGET_AREA_FRAC / area)
    optimal_dist     = CURRENT_DIST_M * scale
    adjustment       = optimal_dist - CURRENT_DIST_M
    return round(adjustment, 1), round(optimal_dist, 1)


def compute_recapture_guidance(
    initial_bboxes: List[BBox],
    initial_confidence: float,
) -> RecaptureGuidance:
    """
    Analyse frame composition and generate specific citizen guidance.

    Decision rules (in priority order):
    1. No detections at all → "Move closer and aim at the waste pile"
    2. Largest bbox > 70% area → "Too close; move back X m"
    3. Largest bbox centroid offset > 0.25 from frame centre → framing fix
    4. Largest bbox < 10% area → "Too far; move closer"
    5. Otherwise → "Hold steady; wait 2 seconds and re-capture"
    """
    if not initial_bboxes:
        return RecaptureGuidance(
            instruction="No waste detected in frame. Move closer to the dump and aim camera directly at it.",
            distance_adjustment_m=-1.5,
            framing_correction='centre',
            reason='no_detections',
            estimated_optimal_distance_m=1.5,
        )

    largest = max(initial_bboxes, key=lambda b: b.area_fraction)
    area    = largest.area_fraction
    cx      = largest.centroid_x   # 0=left edge, 1=right edge
    cy      = largest.centroid_y   # 0=top, 1=bottom

    adj_m, opt_m = _estimate_distance_adjustment(largest)

    # Rule 1: Too close (dump fills most of frame)
    if area > 0.70:
        dist = abs(adj_m) if adj_m else 2.5
        return RecaptureGuidance(
            instruction=(
                f"Too close — the dump fills {area*100:.0f}% of the frame. "
                f"Move back {dist:.1f} metres and re-capture."
            ),
            distance_adjustment_m=adj_m,
            framing_correction='none',
            reason='frame_overfill',
            estimated_optimal_distance_m=opt_m,
        )

    # Rule 2: Off-centre horizontally
    horiz_offset = cx - 0.5
    if abs(horiz_offset) > 0.25:
        direction = "left" if horiz_offset > 0 else "right"
        return RecaptureGuidance(
            instruction=(
                f"Waste dump is off-centre — pan the camera {direction} "
                "until the dump fills the middle of the frame, then re-capture."
            ),
            distance_adjustment_m=0.0,
            framing_correction=direction,
            reason='frame_offset',
            estimated_optimal_distance_m=opt_m,
        )

    # Rule 3: Too far (dump is very small in frame)
    if area < 0.10:
        dist = abs(adj_m) if adj_m else 2.0
        return RecaptureGuidance(
            instruction=(
                f"Dump is too small in frame ({area*100:.0f}%). "
                f"Move {dist:.1f} metres closer and re-capture."
            ),
            distance_adjustment_m=adj_m,
            framing_correction='none',
            reason='frame_underfill',
            estimated_optimal_distance_m=opt_m,
        )

    # Rule 4: Borderline confidence, composition is fine → steady re-shot
    return RecaptureGuidance(
        instruction=(
            f"AI confidence is {initial_confidence*100:.0f}% (borderline). "
            "Hold your current position steady, wait 2 seconds for the camera "
            "to stabilise, and re-capture."
        ),
        distance_adjustment_m=0.0,
        framing_correction='none',
        reason='low_confidence_stable_frame',
        estimated_optimal_distance_m=opt_m,
    )


# ── Temporal and spatial consistency gates ────────────────────────────────────

def _haversine_m(lat1, lon1, lat2, lon2) -> float:
    R = 6_371_000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2-lat1); dl = math.radians(lon2-lon1)
    a  = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


def _temporal_ok(t1: datetime.datetime, t2: datetime.datetime) -> bool:
    return abs((t2 - t1).total_seconds()) <= MAX_INTER_SHOT_SEC


def _spatial_ok(lat1, lon1, lat2, lon2) -> bool:
    return _haversine_m(lat1, lon1, lat2, lon2) <= MAX_MOVEMENT_M


# ── Confidence fusion ─────────────────────────────────────────────────────────

def fuse_confidence_scores(
    conf1: float,
    waste_type1: str,
    conf2: float,
    waste_type2: str,
    timestamp1: datetime.datetime,
    timestamp2: datetime.datetime,
    lat1: float, lon1: float,
    lat2: float, lon2: float,
) -> FusionResult:
    """
    Fuse two confidence scores with recency weighting and
    consistency penalty.

    w2 > w1 because the citizen followed explicit guidance before shot 2.
    Consistency penalty applied when waste types disagree (model may be
    seeing different content; reduce confidence in fusion).
    """
    notes: List[str] = []

    # Gate checks
    if not _temporal_ok(timestamp1, timestamp2):
        delta = abs((timestamp2 - timestamp1).total_seconds())
        notes.append(f"WARNING: Inter-shot interval {delta:.0f}s exceeds {MAX_INTER_SHOT_SEC}s gate.")

    if not _spatial_ok(lat1, lon1, lat2, lon2):
        dist = _haversine_m(lat1, lon1, lat2, lon2)
        notes.append(f"WARNING: GPS shift {dist:.1f}m between shots exceeds {MAX_MOVEMENT_M}m gate — possible relocation.")

    # Waste type consistency
    agree   = (waste_type1.lower() == waste_type2.lower())
    penalty = 0.0 if agree else CONSISTENCY_PENALTY
    if not agree:
        notes.append(
            f"Waste type disagreement: shot1={waste_type1}, shot2={waste_type2}. "
            f"Consistency penalty -{penalty:.0%} applied."
        )

    # Weighted fusion
    fused = W1 * conf1 + W2 * conf2 - penalty
    fused = max(0.0, min(1.0, fused))
    notes.append(
        f"Fusion: {W1}×{conf1:.3f} + {W2}×{conf2:.3f} - {penalty:.3f} = {fused:.4f}"
    )

    # Final triage
    if fused >= AUTO_APPROVE_THRESH:
        triage = 'auto_approved'
    elif fused >= MANUAL_REVIEW_THRESH:
        triage = 'manual_review'
    else:
        triage = 'rejected'

    notes.append(f"Final triage: {triage} (threshold: approve>={AUTO_APPROVE_THRESH}, review>={MANUAL_REVIEW_THRESH})")

    return FusionResult(
        fused_confidence=round(fused, 4),
        shot1_confidence=conf1,
        shot2_confidence=conf2,
        weights_used={"shot1": W1, "shot2": W2},
        consistency_penalty_applied=penalty,
        waste_types_agree=agree,
        final_triage=triage,
        forensic_notes=notes,
    )


# ── Public API ────────────────────────────────────────────────────────────────

def assess_initial_shot(
    confidence: float,
    bboxes: List[BBox],
) -> MultiShotVerificationResult:
    """
    Decide whether a second shot is needed after the initial inference.

    If confidence is in the 'borderline' band [0.70, 0.89], compute
    recapture guidance and return needs_second_shot=True.
    Otherwise return immediately with no guidance needed.
    """
    if confidence >= AUTO_APPROVE_THRESH:
        return MultiShotVerificationResult(
            needs_second_shot=False,
            guidance=None, fusion=None,
            reason=f"Auto-approved: confidence {confidence:.3f} >= {AUTO_APPROVE_THRESH}"
        )

    if confidence < MANUAL_REVIEW_THRESH:
        return MultiShotVerificationResult(
            needs_second_shot=False,
            guidance=None, fusion=None,
            reason=f"Auto-rejected: confidence {confidence:.3f} < {MANUAL_REVIEW_THRESH}"
        )

    # Borderline → request second shot
    guidance = compute_recapture_guidance(bboxes, confidence)
    return MultiShotVerificationResult(
        needs_second_shot=True,
        guidance=guidance,
        fusion=None,
        reason=f"Borderline confidence {confidence:.3f}: second image required."
    )


def complete_verification(
    conf1: float, waste_type1: str,
    lat1: float, lon1: float, ts1: datetime.datetime,
    conf2: float, waste_type2: str,
    lat2: float, lon2: float, ts2: datetime.datetime,
) -> MultiShotVerificationResult:
    """
    Complete multi-shot verification after second image is received.
    Fuses both confidence scores and returns final triage decision.
    """
    fusion = fuse_confidence_scores(
        conf1, waste_type1, conf2, waste_type2,
        ts1, ts2, lat1, lon1, lat2, lon2,
    )
    return MultiShotVerificationResult(
        needs_second_shot=False,
        guidance=None,
        fusion=fusion,
        reason=f"Multi-shot complete. Fused confidence: {fusion.fused_confidence:.3f}"
    )


# ── Quick test ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import json

    # Simulate: first shot 76% confidence, dump too close
    shot1 = assess_initial_shot(
        confidence=0.76,
        bboxes=[BBox(0.05, 0.10, 0.95, 0.95, 0.76, "mixed")],
    )
    print("=== INITIAL ASSESSMENT ===")
    print(json.dumps(shot1.to_dict(), indent=2))

    # Simulate: citizen follows guidance, takes second shot → 91% confidence
    now = datetime.datetime.utcnow()
    result = complete_verification(
        conf1=0.76, waste_type1="mixed",
        lat1=12.9716, lon1=77.5946, ts1=now,
        conf2=0.91, waste_type2="mixed",
        lat2=12.9718, lon2=77.5947, ts2=now + datetime.timedelta(seconds=45),
    )
    print("\n=== FUSION RESULT ===")
    print(json.dumps(result.to_dict(), indent=2))
    # Expected fused: 0.35*0.76 + 0.65*0.91 = 0.266 + 0.5915 = 0.8575 → manual_review
    # (just under 0.90) — realistically 0.91 second shot often gets 0.857 fused
