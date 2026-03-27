import uuid
from sqlalchemy import Column, String, Float, DateTime, TEXT, ARRAY, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from app.db.base import Base

class Report(Base):
    __tablename__ = "reports"

    report_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tracking_code = Column(String(20), unique=True, nullable=False) # GD-YYYYMMDD-XXXXX
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy = Column(Float)
    location_point = Column(Geometry(geometry_type='POINT', srid=4326))
    image_urls = Column(ARRAY(TEXT))
    confidence_score = Column(Float)
    waste_type = Column(String(50)) # plastic, organic, construction, mixed
    status = Column(String(20), nullable=False, default="pending") # pending, verified, in_progress, resolved, rejected
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    citizen_phone = Column(TEXT) # Optional
    notes = Column(TEXT)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    resolved_at = Column(DateTime)

    assignee = relationship("User", back_populates="reports_assigned")
    detection_results = relationship("DetectionResult", back_populates="report", cascade="all, delete-orphan")
    status_history = relationship("StatusHistory", back_populates="report", cascade="all, delete-orphan")
