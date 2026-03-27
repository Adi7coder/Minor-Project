from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import Optional
from uuid import UUID

from app.api import deps
from app.schemas.municipal import ReportUpdate, ReportListResponse, StatsResponse
from app.schemas.report import ReportResponse, LocationResponse
from app.models.report import Report
from app.models.user import User

router = APIRouter()

@router.get("/reports", response_model=ReportListResponse)
async def list_reports(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_municipal),
    status: Optional[str] = None,
    zone: Optional[int] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    query = select(Report)
    
    if status:
        query = query.where(Report.status == status)
        
    query = query.order_by(Report.created_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    reports = result.scalars().all()
    
    count_query = select(func.count()).select_from(Report)
    if status:
        count_query = count_query.where(Report.status == status)
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    output_reports = []
    for r in reports:
        output_reports.append(
            ReportResponse(
                report_id=r.tracking_code,
                timestamp=r.created_at,
                location=LocationResponse(
                    latitude=r.latitude,
                    longitude=r.longitude,
                    accuracy=r.accuracy or 0.0
                ),
                images=r.image_urls or [],
                status=r.status,
                assigned_to=r.assigned_to,
                resolution=r.notes,
                created_at=r.created_at,
                updated_at=r.updated_at
            )
        )
        
    return ReportListResponse(
        total=total,
        page=page,
        limit=limit,
        reports=output_reports
    )

@router.patch("/reports/{tracking_code}", response_model=dict)
async def update_report_status(
    tracking_code: str,
    update_data: ReportUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_municipal)
):
    result = await db.execute(select(Report).where(Report.tracking_code == tracking_code))
    report = result.scalars().first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    report.status = update_data.status
    if update_data.assigned_to:
        report.assigned_to = update_data.assigned_to
    if update_data.notes:
        report.notes = update_data.notes
        
    await db.commit()
    
    return {
        "success": True,
        "report_id": tracking_code,
        "status": report.status,
        "updated_at": report.updated_at
    }

@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_municipal)
):
    return StatsResponse(
        total_reports=1234,
        verified=1050,
        pending=84,
        resolved=900,
        avg_resolution_time="18.5 hours",
        verification_rate="85.1%",
        by_zone={"1": 250, "2": 400},
        by_waste_type={"mixed": 500, "plastic": 300},
        daily_trend=[{"date": "2025-03-25", "count": 45}]
    )
