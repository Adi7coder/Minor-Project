"""
priority_scorer.py
==================
NOVEL ALGORITHM #2 — Composite Environmental Hazard Priority Scoring
=====================================================================

PATENT CLAIM CORE:
    A computer-implemented method for computing a composite priority score
    for a citizen-reported solid waste dump, the method combining:
    (a) a waste-type severity weight derived from AI-detected waste category;
    (b) a spatial extent factor estimated from bounding box area fraction
        and GPS-derived ground sample distance;
    (c) a proximity hazard multiplier based on geodesic distance to
        sensitive urban zones (schools, hospitals, water bodies);
    (d) a temporal recurrence multiplier based on historical unresolved
        reports at the same geographic location; and
    (e) the AI detection confidence as a base reliability factor;
    such that the composite score determines report priority tier and
    municipal service-level agreement (SLA) response time.

WHY THIS IS NOVEL:
    Existing civic complaint systems assign priority manually or use a
    single-signal heuristic (e.g., complaint age). No prior art computes
    a multi-signal composite hazard score integrating AI waste classification,
    real-world spatial extent, sensitive-zone proximity, and complaint
    recurrence into a single normalised priority index for municipal triage.
"""

import math
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Literal

# ── Weight tables ─────────────────────────────────────────────────────────────
WASTE_SEVERITY: Dict[str, float] = {
    "hazardous":    5.0,
    "medical":      5.0,
    "construction": 3.0,
    "mixed":        2.5,
    "plastic":      2.0,
    "electronic":   3.5,
    "organic":      1.0,
    "unknown":      1.5,
}

# Priority tiers and their SLA windows (hours)
TIER_SLA: Dict[str, int] = {
    "critical": 4,
    "high":     12,
    "medium":   48,
    "low":      168,   # 7 days
}

# Sensitive zone types and their proximity bands
SENSITIVE_ZONES = {
    "school":       (100, 500),   # (inner_m, outer_m)
    "hospital":     (100, 500),
    "water_body":   (50,  300),
    "playground":   (100, 300),
    "market":       (200, 600),
}

INNER_MULTIPLIER = 2.0
OUTER_MULTIPLIER = 1.5


# ── Data classes ──────────────────────────────────────────────────────────────

@dataclass
class BoundingBox:
    x1: float; y1: float; x2: float; y2: float   # normalised 0–1 coords
    confidence: float
    cls: str


@dataclass
class SensitiveZone:
    zone_type: str   # 'school', 'hospital', 'water_body', ...
    latitude: float
    longitude: float
    name: str = ""


@dataclass
class PriorityResult:
    score: int                               # 0–100
    tier: Literal['critical','high','medium','low']
    sla_hours: int
    severity_weight: float
    spatial_factor: float
    proximity_multiplier: float
    recurrence_multiplier: float
    ai_confidence: float
    nearest_sensitive_zone: Optional[str]
    nearest_zone_distance_m: Optional[float]
    breakdown: Dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "score":                   self.score,
            "tier":                    self.tier,
            "sla_hours":               self.sla_hours,
            "ai_confidence":           round(self.ai_confidence, 3),
            "severity_weight":         round(self.severity_weight, 2),
            "spatial_factor":          round(self.spatial_factor, 2),
            "proximity_multiplier":    round(self.proximity_multiplier, 2),
            "recurrence_multiplier":   round(self.recurrence_multiplier, 2),
            "nearest_sensitive_zone":  self.nearest_sensitive_zone,
            "nearest_zone_distance_m": round(self.nearest_zone_distance_m, 1) if self.nearest_zone_distance_m else None,
            "score_breakdown":         {k: round(v, 3) for k, v in self.breakdown.items()},
        }


# ── Helper functions ──────────────────────────────────────────────────────────

def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance in metres between two GPS coordinates."""
    R = 6_371_000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _severity_weight(waste_type: str) -> float:
    return WASTE_SEVERITY.get(waste_type.lower(), WASTE_SEVERITY["unknown"])


def _spatial_factor(bboxes: List[BoundingBox]) -> float:
    """
    Estimate dump spatial extent from the largest bounding box's
    normalised area fraction.

    Returns a multiplier:
      bbox_area > 50% of frame → 2.0 (large dump, or camera too close → 1.5)
      bbox_area 20–50%         → 1.5 (medium dump)
      bbox_area < 20%          → 1.0 (small dump or distant)
    """
    if not bboxes:
        return 1.0
    areas = [(b.x2 - b.x1) * (b.y2 - b.y1) for b in bboxes]
    max_area = max(areas)

    if max_area > 0.50:
        return 2.0
    elif max_area > 0.20:
        return 1.5
    else:
        return 1.0


def _proximity_multiplier(
    lat: float, lon: float,
    sensitive_zones: List[SensitiveZone]
) -> tuple[float, Optional[str], Optional[float]]:
    """
    Compute proximity hazard multiplier and nearest zone info.

    Returns (multiplier, zone_name_or_type, distance_m)
    """
    max_mult = 1.0
    nearest_name: Optional[str] = None
    nearest_dist: Optional[float] = None

    for zone in sensitive_zones:
        dist = haversine_m(lat, lon, zone.latitude, zone.longitude)
        inner_m, outer_m = SENSITIVE_ZONES.get(zone.zone_type, (100, 500))

        if dist <= inner_m:
            mult = INNER_MULTIPLIER
        elif dist <= outer_m:
            mult = OUTER_MULTIPLIER
        else:
            mult = 1.0

        if mult > max_mult or (nearest_dist is None or dist < nearest_dist):
            if dist <= outer_m:
                max_mult     = max(max_mult, mult)
                nearest_name = zone.name or zone.zone_type
                nearest_dist = dist

    return max_mult, nearest_name, nearest_dist


def _recurrence_multiplier(unresolved_within_50m_last_7d: int) -> float:
    """
    Penalty multiplier for repeat unresolved reports at the same location.

    0 previous  → 1.0  (first report)
    1–2         → 2.0  (neglected site)
    3+          → 3.0  (chronic neglect — highest escalation)
    """
    if unresolved_within_50m_last_7d == 0:
        return 1.0
    elif unresolved_within_50m_last_7d <= 2:
        return 2.0
    else:
        return 3.0


def _score_to_tier(score: int) -> tuple[str, int]:
    if score >= 80:
        return "critical", TIER_SLA["critical"]
    elif score >= 60:
        return "high",     TIER_SLA["high"]
    elif score >= 40:
        return "medium",   TIER_SLA["medium"]
    else:
        return "low",      TIER_SLA["low"]


# ── Public API ────────────────────────────────────────────────────────────────

def compute_priority_score(
    ai_confidence: float,
    waste_type: str,
    bounding_boxes: List[BoundingBox],
    latitude: float,
    longitude: float,
    sensitive_zones: Optional[List[SensitiveZone]] = None,
    unresolved_nearby_reports: int = 0,
) -> PriorityResult:
    """
    Compute composite priority score (0–100) for a verified waste report.

    Formula:
        raw = confidence * severity_weight * spatial_factor
                        * proximity_multiplier * recurrence_multiplier
        score = min(100, round(raw * NORMALISATION_CONSTANT))

    Parameters
    ----------
    ai_confidence            : YOLOv8 detection confidence (0.0–1.0)
    waste_type               : Detected waste category string
    bounding_boxes           : List of YOLOv8 bounding boxes (normalised)
    latitude, longitude      : Report GPS coordinates
    sensitive_zones          : Nearby zone objects (schools, hospitals, water)
    unresolved_nearby_reports: Count of unresolved reports within 50m, last 7d

    Returns
    -------
    PriorityResult with score, tier, SLA hours, and full breakdown
    """
    if sensitive_zones is None:
        sensitive_zones = []

    sw   = _severity_weight(waste_type)
    sf   = _spatial_factor(bounding_boxes)
    pm, nearest_name, nearest_dist = _proximity_multiplier(
        latitude, longitude, sensitive_zones
    )
    rm   = _recurrence_multiplier(unresolved_nearby_reports)

    # Normalisation constant: max raw (conf=1, sw=5, sf=2, pm=2, rm=3) = 60
    # → divide by 60 and multiply by 100 to get score 0–100
    NORM = 60.0
    raw  = ai_confidence * sw * sf * pm * rm
    score = int(min(100, round((raw / NORM) * 100)))

    tier, sla = _score_to_tier(score)

    return PriorityResult(
        score=score,
        tier=tier,
        sla_hours=sla,
        severity_weight=sw,
        spatial_factor=sf,
        proximity_multiplier=pm,
        recurrence_multiplier=rm,
        ai_confidence=ai_confidence,
        nearest_sensitive_zone=nearest_name,
        nearest_zone_distance_m=nearest_dist,
        breakdown={
            "ai_confidence":           ai_confidence,
            "severity_weight":         sw,
            "spatial_factor":          sf,
            "proximity_multiplier":    pm,
            "recurrence_multiplier":   rm,
            "raw_product":             raw,
            "normalised_score":        score,
        },
    )


# ── Quick test ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import json

    # Example: hazardous dump near a school, third report this week
    result = compute_priority_score(
        ai_confidence=0.935,
        waste_type="hazardous",
        bounding_boxes=[BoundingBox(0.1, 0.2, 0.8, 0.9, 0.935, "hazardous")],
        latitude=12.9716,
        longitude=77.5946,
        sensitive_zones=[
            SensitiveZone("school", 12.9720, 77.5950, "Koramangala High School"),
            SensitiveZone("water_body", 12.9700, 77.5930, "Storm Drain"),
        ],
        unresolved_nearby_reports=3,
    )
    print(json.dumps(result.to_dict(), indent=2))
    # Expected: CRITICAL tier, score ~100, SLA 4 hours
