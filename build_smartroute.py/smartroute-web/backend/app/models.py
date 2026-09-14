"""Database Models"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(String(50), default="technician")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    meters = relationship("Meter", back_populates="owner")
    routes = relationship("Route", back_populates="owner")


class Meter(Base):
    __tablename__ = "meters"
    id = Column(Integer, primary_key=True, index=True)
    meter_id = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    priority = Column(Integer, default=3)
    is_overdue = Column(Boolean, default=False)
    address = Column(Text)
    city = Column(String(100))
    area = Column(String(100))
    status = Column(String(50), default="active")
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="meters")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Route(Base):
    __tablename__ = "routes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    start_lat = Column(Float, nullable=False)
    start_lon = Column(Float, nullable=False)
    start_label = Column(String(255), default="Start")
    before_distance_km = Column(Float, default=0.0)
    after_distance_km = Column(Float, default=0.0)
    saved_distance_km = Column(Float, default=0.0)
    improvement_percent = Column(Float, default=0.0)
    before_travel_time_min = Column(Float, default=0.0)
    after_travel_time_min = Column(Float, default=0.0)
    saved_travel_time_min = Column(Float, default=0.0)
    avg_speed_kmph = Column(Float, default=30.0)
    detected_area = Column(String(50))
    total_meters = Column(Integer, default=0)
    sequence = Column(JSON)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="routes")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Analytics(Base):
    __tablename__ = "analytics"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    route_id = Column(Integer, ForeignKey("routes.id"))
    action = Column(String(100))
    meters_count = Column(Integer)
    distance_km = Column(Float)
    travel_time_min = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
