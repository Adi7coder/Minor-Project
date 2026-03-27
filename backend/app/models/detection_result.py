import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class DetectionResult(Base):
    __tablename__ = "detection_results"

    detection_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("reports.report_id", ondelete="CASCADE"))
    model_version = Column(String(50))
    confidence_score = Column(Float)
    waste_type = Column(String(50))
    detections = Column(JSONB) # Array of detected objects
    inference_time = Column(Float)
    detected_at = Column(DateTime, default=func.now())

    report = relationship("Report", back_populates="detection_results")
