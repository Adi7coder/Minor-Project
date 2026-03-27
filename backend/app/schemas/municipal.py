from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from uuid import UUID
from .report import ReportResponse

class ReportUpdate(BaseModel):
    status: str
    assigned_to: Optional[UUID] = None
    notes: Optional[str] = None

class ReportListResponse(BaseModel):
    total: int
    page: int
    limit: int
    reports: List[ReportResponse]

class StatsResponse(BaseModel):
    total_reports: int
    verified: int
    pending: int
    resolved: int
    avg_resolution_time: str
    verification_rate: str
    by_zone: Dict[str, int]
    by_waste_type: Dict[str, int]
    daily_trend: List[Dict[str, Any]]
