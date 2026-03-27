import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ARRAY, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(255))
    phone = Column(String(20))
    role = Column(String(20), nullable=False) # admin, inspector, viewer
    zones = Column(ARRAY(Integer)) 
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    last_login = Column(DateTime)

    reports_assigned = relationship("Report", back_populates="assignee")
    status_changes = relationship("StatusHistory", back_populates="changer")
    audit_logs = relationship("AuditLog", back_populates="user")
