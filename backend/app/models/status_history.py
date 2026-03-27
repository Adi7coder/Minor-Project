import uuid
from sqlalchemy import Column, String, DateTime, TEXT, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class StatusHistory(Base):
    __tablename__ = "status_history"

    history_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("reports.report_id", ondelete="CASCADE"))
    old_status = Column(String(20))
    new_status = Column(String(20))
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    notes = Column(TEXT)
    changed_at = Column(DateTime, default=func.now())

    report = relationship("Report", back_populates="status_history")
    changer = relationship("User", back_populates="status_changes")
