from sqlalchemy import Column, Integer, String, Boolean
from geoalchemy2 import Geometry
from app.db.base import Base

class Zone(Base):
    __tablename__ = "zones"

    zone_id = Column(Integer, primary_key=True, autoincrement=True)
    zone_name = Column(String(100), nullable=False)
    boundary = Column(Geometry(geometry_type='POLYGON', srid=4326))
    active = Column(Boolean, default=True)
