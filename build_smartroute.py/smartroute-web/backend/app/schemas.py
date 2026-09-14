"""Pydantic Schemas"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    role: str = "technician"

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class MeterBase(BaseModel):
    meter_id: str
    name: str
    latitude: float
    longitude: float
    priority: int = Field(3, ge=1, le=5)
    is_overdue: bool = False
    address: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None

class MeterCreate(MeterBase):
    pass

class MeterResponse(MeterBase):
    id: int
    status: str
    owner_id: int
    created_at: datetime
    class Config:
        from_attributes = True


class OptimizeRequest(BaseModel):
    start_lat: float
    start_lon: float
    start_label: str = "Start"
    meter_ids: Optional[List[str]] = None

class RouteResponse(BaseModel):
    id: int
    name: str
    start_lat: float
    start_lon: float
    start_label: str
    before_distance_km: float
    after_distance_km: float
    saved_distance_km: float
    improvement_percent: float
    before_travel_time_min: float
    after_travel_time_min: float
    saved_travel_time_min: float
    avg_speed_kmph: float
    detected_area: Optional[str]
    total_meters: int
    sequence: List[str]
    created_at: datetime
    class Config:
        from_attributes = True


class AnalyticsSummary(BaseModel):
    total_routes: int
    total_meters_served: int
    total_distance_km: float
    total_time_saved_min: float
    avg_improvement_percent: float
