from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class DetectionBase(BaseModel):
    class_name: str = Field(..., alias="class")
    confidence: float
    bbox: List[int]

class DetectionResponse(BaseModel):
    is_garbage: bool
    confidence: float
    waste_type: str
    detections: List[DetectionBase]

class ReportCreate(BaseModel):
    image: str # Base64 string or presigned URL
    latitude: float = Field(..., ge=12.8, le=13.2)
    longitude: float = Field(..., ge=77.4, le=77.8)
    accuracy: float
    timestamp: datetime
    citizen_phone: Optional[str] = None

class LocationResponse(BaseModel):
    latitude: float
    longitude: float
    accuracy: float
    address: Optional[str] = None

class ReportResponse(BaseModel):
    report_id: str # The custom GD-YYYYMMDD-XXXXX ID
    timestamp: datetime
    location: LocationResponse
    images: List[str]
    detection: Optional[DetectionResponse] = None
    status: str
    assigned_to: Optional[UUID] = None
    resolution: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
