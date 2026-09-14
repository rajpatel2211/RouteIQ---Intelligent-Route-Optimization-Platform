"""Route Routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.optimizer import RouteOptimizer, MeterPoint

router = APIRouter(prefix="/api/routes", tags=["Routes"])


@router.post("/optimize", response_model=schemas.RouteResponse)
def optimize(req: schemas.OptimizeRequest, db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    q = db.query(models.Meter).filter(models.Meter.owner_id == current.id)
    if req.meter_ids:
        q = q.filter(models.Meter.meter_id.in_(req.meter_ids))
    meters_db = q.all()
    if not meters_db:
        raise HTTPException(400, "No meters")
    points = [MeterPoint(id=m.meter_id, lat=m.latitude, lon=m.longitude,
                         priority=m.priority, is_overdue=m.is_overdue) for m in meters_db]
    opt = RouteOptimizer(points, (req.start_lat, req.start_lon))
    optimized = opt.optimize()
    s = opt.get_summary()
    route = models.Route(
        name="Route " + datetime.now().strftime("%Y-%m-%d %H:%M"),
        start_lat=req.start_lat, start_lon=req.start_lon, start_label=req.start_label,
        before_distance_km=s["before_distance_km"], after_distance_km=s["after_distance_km"],
        saved_distance_km=s["saved_distance_km"], improvement_percent=s["improvement_percent"],
        before_travel_time_min=s["before_travel_time_min"], after_travel_time_min=s["after_travel_time_min"],
        saved_travel_time_min=s["saved_travel_time_min"], avg_speed_kmph=s["avg_speed_kmph"],
        detected_area=s["detected_area"], total_meters=s["total_meters"],
        sequence=[m.id for m in optimized], owner_id=current.id
    )
    db.add(route)
    db.add(models.Analytics(user_id=current.id, action="optimize",
        meters_count=s["total_meters"], distance_km=s["after_distance_km"],
        travel_time_min=s["after_travel_time_min"]))
    db.commit(); db.refresh(route)
    return route


@router.get("/", response_model=List[schemas.RouteResponse])
def list_routes(db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    return db.query(models.Route).filter(models.Route.owner_id == current.id).order_by(models.Route.created_at.desc()).all()


@router.get("/{route_id}", response_model=schemas.RouteResponse)
def get_route(route_id: int, db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    r = db.query(models.Route).filter(models.Route.id == route_id, models.Route.owner_id == current.id).first()
    if not r: raise HTTPException(404, "Not found")
    return r


@router.delete("/{route_id}")
def delete_route(route_id: int, db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    r = db.query(models.Route).filter(models.Route.id == route_id, models.Route.owner_id == current.id).first()
    if not r: raise HTTPException(404, "Not found")
    db.delete(r); db.commit()
    return {"message": "deleted"}
