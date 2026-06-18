"""
backend_main.py  — CleanBLR FastAPI Backend
============================================
Integrates all three novel algorithms in the full report-submission pipeline:

  POST /api/reports
    1. GPS bounds validation
    2. Solar authenticity check (Algorithm 1)
    3. If rejected → immediate fraud rejection
    4. YOLOv8 inference (stub — plug in your .pt file)
    5. Confidence triage:
       a. >= 0.90 → auto-approve
       b. 0.70-0.89 → multi-shot guidance (Algorithm 3)
       c. < 0.70 → auto-reject
    6. Priority score (Algorithm 2)
    7. Persist to DB (stub)
    8. Return full result

  POST /api/reports/{id}/second-shot
    Complete multi-shot verification (Algorithm 3 fusion)

  GET  /api/reports           — list with filters
  GET  /api/reports/{id}      — single report detail
  PATCH /api/reports/{id}/status
  GET  /api/stats
  POST /api/auth/login
"""

import datetime
import uuid
import sys
import os
from pathlib import Path
from typing import List, Optional, Literal, Dict, Any

from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

# ── Add algorithms to path ────────────────────────────────────────────────────
sys.path.insert(0, str(Path(__file__).parent.parent / "algorithms"))

from solar_validator    import validate_image_authenticity
from priority_scorer    import (compute_priority_score, BoundingBox as ScorerBBox,
                                SensitiveZone)
from adaptive_reverifier import (assess_initial_shot, complete_verification,
                                 BBox as ReverifierBBox)

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="CleanBLR API",
    version="1.0.0",
    description=(
        "Production API for the CleanBLR illegal waste dump detection platform. "
        "Integrates three novel patented algorithms: solar-position image "
        "authentication, composite priority scoring, and adaptive multi-shot "
        "re-verification."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174",
                   "https://cleanblr.com", "https://admin.cleanblr.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Configuration ─────────────────────────────────────────────────────────────
UPLOAD_DIR = Path("/tmp/cleanblr_uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

BANGALORE_BOUNDS = {
    "lat_min": 12.7, "lat_max": 13.3,
    "lon_min": 77.3, "lon_max": 78.0,
}

# ── YOLOv8 Integration (plug in your model here) ──────────────────────────────
_MODEL = None

def get_yolo_model():
    global _MODEL
    if _MODEL is None:
        try:
            from ultralytics import YOLO
            model_path = os.getenv("YOLO_MODEL_PATH", "best.pt")
            _MODEL = YOLO(model_path)
        except Exception:
            _MODEL = "STUB"   # graceful degradation
    return _MODEL


def run_yolo_inference(image_path: str) -> dict:
    """
    Run YOLOv8 detection. Falls back to stub data when model not loaded.
    Replace the stub section with your Roboflow-trained model.

    Returns dict with keys: confidence, waste_type, bounding_boxes, raw_results
    """
    model = get_yolo_model()

    if model == "STUB":
        # ── STUB: Replace this block with your real model ──────────────────
        # This stub simulates a 76% confidence borderline detection to
        # demonstrate the multi-shot pipeline during development.
        return {
            "confidence": 0.76,
            "waste_type": "mixed",
            "bounding_boxes": [
                {"x1": 0.05, "y1": 0.10, "x2": 0.88, "y2": 0.92,
                 "confidence": 0.76, "cls": "mixed"},
            ],
            "raw_results": None,
            "model_version": "stub-v0",
        }
        # ── END STUB ────────────────────────────────────────────────────────

    # ── Real YOLOv8 inference ─────────────────────────────────────────────────
    results = model(image_path, verbose=False)
    r       = results[0]

    if len(r.boxes) == 0:
        return {
            "confidence": 0.0, "waste_type": "none",
            "bounding_boxes": [], "raw_results": None,
            "model_version": str(model.model_name),
        }

    img_h, img_w = r.orig_shape
    bboxes = []
    for box in r.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        bboxes.append({
            "x1": x1 / img_w, "y1": y1 / img_h,
            "x2": x2 / img_w, "y2": y2 / img_h,
            "confidence": float(box.conf[0]),
            "cls": r.names[int(box.cls[0])],
        })

    top_box   = max(bboxes, key=lambda b: b["confidence"])
    return {
        "confidence":    top_box["confidence"],
        "waste_type":    top_box["cls"],
        "bounding_boxes": bboxes,
        "raw_results":   None,
        "model_version": str(model.model_name),
    }


# ── In-memory DB stub (replace with PostgreSQL + PostGIS) ─────────────────────
_REPORTS: Dict[str, dict] = {}
_REPORT_COUNTER = 0

def _next_tracking_code() -> str:
    global _REPORT_COUNTER
    _REPORT_COUNTER += 1
    today = datetime.date.today().strftime("%Y%m%d")
    return f"GD-{today}-{_REPORT_COUNTER:05d}"

def _save_report(report: dict) -> None:
    """Stub. Replace body with: session.add(ReportModel(**report)); session.commit()"""
    _REPORTS[report["report_id"]] = report

def _get_report(report_id: str) -> Optional[dict]:
    return _REPORTS.get(report_id)

def _count_nearby_unresolved(lat: float, lon: float) -> int:
    """
    Stub. Replace with PostGIS query:
        SELECT COUNT(*) FROM reports
        WHERE ST_DWithin(location_point, ST_MakePoint(:lon,:lat)::geography, 50)
        AND status NOT IN ('resolved','rejected')
        AND created_at > NOW() - INTERVAL '7 days'
    """
    return 0  # default: no prior reports


# ── Auth (stub JWT) ───────────────────────────────────────────────────────────
bearer = HTTPBearer(auto_error=False)

async def require_auth(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer)
) -> dict:
    if not creds or creds.credentials != "mock-jwt-token":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid or missing token")
    return {"user": "admin", "role": "admin"}


# ── Pydantic schemas ──────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class StatusUpdate(BaseModel):
    status: Literal["pending", "assigned", "in_progress", "resolved", "rejected"]
    assigned_to: Optional[str] = None
    notes: Optional[str] = None

class SecondShotForm(BaseModel):
    report_id: str
    latitude: float
    longitude: float


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0", "timestamp": datetime.datetime.utcnow().isoformat()}


@app.post("/api/auth/login")
def login(req: LoginRequest):
    # Stub: accept any credentials in development
    return {
        "success": True,
        "token": "mock-jwt-token",
        "user": {"id": "u-001", "username": req.username, "role": "admin", "zones": [1,2,3,4,5]},
    }


@app.post("/api/reports", status_code=201)
async def submit_report(
    image:     UploadFile  = File(...),
    latitude:  float       = Form(...),
    longitude: float       = Form(...),
    accuracy:  float       = Form(default=10.0),
    phone:     Optional[str] = Form(default=None),
    description: Optional[str] = Form(default=None),
):
    """
    Main report submission endpoint.
    Executes the full three-algorithm verification pipeline.
    """

    # ── Step 1: GPS bounds validation ─────────────────────────────────────────
    b = BANGALORE_BOUNDS
    if not (b["lat_min"] <= latitude <= b["lat_max"] and
            b["lon_min"] <= longitude <= b["lon_max"]):
        raise HTTPException(400, detail="Location outside service area (Bangalore bounds).")
    if accuracy > 100:
        raise HTTPException(400, detail=f"GPS accuracy too low ({accuracy:.0f}m). Enable high-accuracy mode.")

    # ── Step 2: Save uploaded image ───────────────────────────────────────────
    report_id  = str(uuid.uuid4())
    ext        = image.filename.rsplit(".", 1)[-1] if image.filename else "jpg"
    img_path   = UPLOAD_DIR / f"{report_id}.{ext}"
    content    = await image.read()
    img_path.write_bytes(content)
    now_utc    = datetime.datetime.utcnow()

    # ── Step 3: ALGORITHM 1 — Solar authentication ───────────────────────────
    solar = validate_image_authenticity(
        latitude=latitude,
        longitude=longitude,
        timestamp_utc=now_utc,
        image_path=str(img_path),
    )

    if solar.verdict == "rejected":
        img_path.unlink(missing_ok=True)
        return {
            "success": False,
            "report_id": report_id,
            "stage": "solar_authentication",
            "status": "rejected",
            "message": "Image rejected: lighting is inconsistent with the claimed location and time. Possible GPS spoofing.",
            "solar": solar.to_dict(),
        }

    # ── Step 4: YOLOv8 inference ──────────────────────────────────────────────
    detection = run_yolo_inference(str(img_path))
    conf      = detection["confidence"]
    waste     = detection["waste_type"]

    # ── Step 5: ALGORITHM 3 — Multi-shot triage ───────────────────────────────
    bboxes_rv = [
        ReverifierBBox(b["x1"], b["y1"], b["x2"], b["y2"], b["confidence"], b["cls"])
        for b in detection["bounding_boxes"]
    ]
    shot_assessment = assess_initial_shot(conf, bboxes_rv)

    if conf < 0.70:
        img_path.unlink(missing_ok=True)
        return {
            "success": False,
            "report_id": report_id,
            "status": "rejected",
            "stage": "ai_detection",
            "message": f"No garbage detected with sufficient confidence ({conf*100:.0f}%). Ensure the dump is clearly visible.",
            "ai_confidence": conf,
        }

    if shot_assessment.needs_second_shot:
        # Park the report and return guidance for second image
        _save_report({
            "report_id": report_id,
            "tracking_code": _next_tracking_code(),
            "status": "awaiting_second_shot",
            "latitude": latitude, "longitude": longitude,
            "accuracy": accuracy,
            "image_path": str(img_path),
            "created_at": now_utc.isoformat(),
            "shot1_confidence": conf,
            "shot1_waste_type": waste,
            "solar": solar.to_dict(),
            "detection": detection,
        })
        return {
            "success": True,
            "report_id": report_id,
            "status": "awaiting_second_shot",
            "stage": "multi_shot_required",
            "message": shot_assessment.reason,
            "ai_confidence": conf,
            "guidance": shot_assessment.to_dict()["guidance"],
            "solar": solar.to_dict(),
        }

    # ── Step 6: ALGORITHM 2 — Priority scoring ────────────────────────────────
    bboxes_sc = [
        ScorerBBox(b["x1"], b["y1"], b["x2"], b["y2"], b["confidence"], b["cls"])
        for b in detection["bounding_boxes"]
    ]
    nearby_count = _count_nearby_unresolved(latitude, longitude)
    priority = compute_priority_score(
        ai_confidence=conf,
        waste_type=waste,
        bounding_boxes=bboxes_sc,
        latitude=latitude,
        longitude=longitude,
        sensitive_zones=[],     # populate from zone database in production
        unresolved_nearby_reports=nearby_count,
    )

    # ── Step 7: Persist ───────────────────────────────────────────────────────
    tracking_code = _next_tracking_code()
    report_record = {
        "report_id":      report_id,
        "tracking_code":  tracking_code,
        "status":         "verified",
        "latitude":       latitude,
        "longitude":      longitude,
        "accuracy":       accuracy,
        "image_path":     str(img_path),
        "created_at":     now_utc.isoformat(),
        "solar":          solar.to_dict(),
        "detection":      detection,
        "priority":       priority.to_dict(),
        "phone":          phone,
        "description":    description,
    }
    _save_report(report_record)

    return {
        "success": True,
        "report_id":     report_id,
        "tracking_code": tracking_code,
        "status":        "verified",
        "stage":         "complete",
        "message":       "Report verified and submitted to municipality.",
        "ai_confidence": conf,
        "waste_type":    waste,
        "solar":         solar.to_dict(),
        "priority":      priority.to_dict(),
    }


@app.post("/api/reports/{report_id}/second-shot", status_code=200)
async def submit_second_shot(
    report_id: str,
    image:     UploadFile = File(...),
    latitude:  float      = Form(...),
    longitude: float      = Form(...),
):
    """Complete multi-shot verification after citizen provides second image."""
    existing = _get_report(report_id)
    if not existing or existing["status"] != "awaiting_second_shot":
        raise HTTPException(404, detail="Report not found or not awaiting second shot.")

    ext      = image.filename.rsplit(".", 1)[-1] if image.filename else "jpg"
    img2_path = UPLOAD_DIR / f"{report_id}_shot2.{ext}"
    img2_path.write_bytes(await image.read())

    detection2 = run_yolo_inference(str(img2_path))
    now_utc    = datetime.datetime.utcnow()

    fusion_result = complete_verification(
        conf1=existing["shot1_confidence"], waste_type1=existing["shot1_waste_type"],
        lat1=existing["latitude"],         lon1=existing["longitude"],
        ts1=datetime.datetime.fromisoformat(existing["created_at"]),
        conf2=detection2["confidence"],    waste_type2=detection2["waste_type"],
        lat2=latitude,                     lon2=longitude,
        ts2=now_utc,
    )

    if fusion_result.fusion.final_triage == "rejected":
        _REPORTS[report_id]["status"] = "rejected"
        return {"success": False, "status": "rejected",
                "message": "Fused confidence below threshold after two shots.",
                "fusion": fusion_result.to_dict()}

    # Priority scoring on fused result
    bboxes_sc = [
        ScorerBBox(b["x1"], b["y1"], b["x2"], b["y2"], b["confidence"], b["cls"])
        for b in detection2["bounding_boxes"]
    ]
    priority = compute_priority_score(
        ai_confidence=fusion_result.fusion.fused_confidence,
        waste_type=detection2["waste_type"],
        bounding_boxes=bboxes_sc,
        latitude=existing["latitude"],
        longitude=existing["longitude"],
    )

    tracking_code = existing.get("tracking_code") or _next_tracking_code()
    _REPORTS[report_id].update({
        "status":         "verified",
        "tracking_code":  tracking_code,
        "shot2_confidence": detection2["confidence"],
        "fusion":         fusion_result.to_dict(),
        "priority":       priority.to_dict(),
    })

    return {
        "success": True, "status": "verified",
        "tracking_code": tracking_code,
        "fusion":  fusion_result.to_dict(),
        "priority": priority.to_dict(),
        "message": "Multi-shot verification complete. Report submitted to municipality.",
    }


@app.get("/api/reports")
def list_reports(
    status_filter: Optional[str] = None,
    tier: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    _auth: dict = Depends(require_auth),
):
    reports = list(_REPORTS.values())
    if status_filter:
        reports = [r for r in reports if r.get("status") == status_filter]
    if tier:
        reports = [r for r in reports if r.get("priority", {}).get("tier") == tier]
    reports.sort(key=lambda r: r.get("priority", {}).get("score", 0), reverse=True)
    start = (page - 1) * limit
    return {"total": len(reports), "page": page, "limit": limit,
            "reports": reports[start:start + limit]}


@app.get("/api/reports/{report_id}")
def get_report(report_id: str):
    r = _get_report(report_id)
    if not r:
        raise HTTPException(404, detail="Report not found.")
    return r


@app.patch("/api/reports/{report_id}/status")
def update_status(
    report_id: str, body: StatusUpdate,
    _auth: dict = Depends(require_auth),
):
    r = _get_report(report_id)
    if not r:
        raise HTTPException(404, detail="Report not found.")
    r["status"]      = body.status
    r["assigned_to"] = body.assigned_to
    if body.notes:
        r.setdefault("notes", []).append({"text": body.notes, "at": datetime.datetime.utcnow().isoformat()})
    return {"success": True, "report_id": report_id, "status": body.status}


@app.get("/api/stats")
def get_stats(_auth: dict = Depends(require_auth)):
    reports = list(_REPORTS.values())
    total   = len(reports)
    def count(s): return sum(1 for r in reports if r.get("status") == s)
    def count_tier(t): return sum(1 for r in reports if r.get("priority", {}).get("tier") == t)
    return {
        "total_reports":    total,
        "verified":         count("verified"),
        "pending":          count("verified"),
        "in_progress":      count("in_progress"),
        "resolved":         count("resolved"),
        "rejected":         count("rejected"),
        "critical":         count_tier("critical"),
        "high":             count_tier("high"),
        "medium":           count_tier("medium"),
        "low":              count_tier("low"),
        "fraud_detected":   sum(1 for r in reports if r.get("solar", {}).get("verdict") == "rejected"),
        "multi_shot_used":  sum(1 for r in reports if "fusion" in r),
    }


# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend_main:app", host="0.0.0.0", port=8000, reload=True)
