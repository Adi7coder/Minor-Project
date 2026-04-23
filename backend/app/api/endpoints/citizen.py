from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import uuid
from datetime import datetime

from app.api import deps
from app.schemas.report import ReportCreate, ReportResponse, LocationResponse, DetectionResponse
from app.models.report import Report
from app.models.detection_result import DetectionResult
from app.services import storage, ml

router = APIRouter()

def generate_tracking_code() -> str:
    date_str = datetime.now().strftime("%Y%m%d")
    short_uuid = str(uuid.uuid4()).split("-")[0][:5].upper()
    return f"GD-{date_str}-{short_uuid}"

@router.post("/", response_model=dict, status_code=201)
async def create_report(
    report_in: ReportCreate,
    db: AsyncSession = Depends(deps.get_db)
):
    try:
        # 1. Upload Image
        image_url = await storage.upload_image(report_in.image)

        # 2. Call ML Service
        ml_result = await ml.verify_garbage(report_in.image)

        # 3. Determine status based on confidence
        confidence = ml_result.get("confidence", 0)
        if confidence >= 0.90:
            status = "verified"
        elif confidence >= 0.70:
            status = "pending" # manual review
        else:
            status = "rejected"

        tracking_code = generate_tracking_code()

        # 4. Save to DB
        # Point format: 'SRID=4326;POINT(lon lat)'
        point_wkt = f"SRID=4326;POINT({report_in.longitude} {report_in.latitude})"

        new_report = Report(
            tracking_code=tracking_code,
            latitude=report_in.latitude,
            longitude=report_in.longitude,
            accuracy=report_in.accuracy,
            location_point=point_wkt,
            image_urls=[image_url],
            confidence_score=confidence,
            waste_type=ml_result.get("waste_type"),
            status=status,
            citizen_phone=report_in.citizen_phone
        )
        db.add(new_report)
        await db.flush() # To get the report_id

        detection = DetectionResult(
            report_id=new_report.report_id,
            model_version=ml_result.get("model_version", "mock-v1"),
            confidence_score=confidence,
            waste_type=ml_result.get("waste_type"),
            detections=ml_result.get("detections", []),
            inference_time=ml_result.get("inference_time", 0.0)
        )
        db.add(detection)
        await db.commit()

        return {
            "success": True,
            "report_id": tracking_code,
            "status": status,
            "message": "Report submitted successfully."
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{tracking_code}", response_model=ReportResponse)
async def get_report(
    tracking_code: str,
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(select(Report).where(Report.tracking_code == tracking_code))
    report = result.scalars().first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    return ReportResponse(
        report_id=report.tracking_code,
        timestamp=report.created_at,
        location=LocationResponse(
            latitude=report.latitude,
            longitude=report.longitude,
            accuracy=report.accuracy,
            address="Mapping Address Not Implemented"
        ),
        images=report.image_urls,
        status=report.status,
        created_at=report.created_at,
        updated_at=report.updated_at
    )
