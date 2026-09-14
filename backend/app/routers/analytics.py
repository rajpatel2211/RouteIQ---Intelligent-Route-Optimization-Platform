"""Analytics Routes"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/summary", response_model=schemas.AnalyticsSummary)
def summary(db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    routes = db.query(models.Route).filter(models.Route.owner_id == current.id).all()
    if not routes:
        return schemas.AnalyticsSummary(
            total_routes=0, total_meters_served=0, total_distance_km=0.0,
            total_time_saved_min=0.0, avg_improvement_percent=0.0)
    return schemas.AnalyticsSummary(
        total_routes=len(routes),
        total_meters_served=sum(r.total_meters for r in routes),
        total_distance_km=round(sum(r.after_distance_km for r in routes), 2),
        total_time_saved_min=round(sum(r.saved_travel_time_min for r in routes), 2),
        avg_improvement_percent=round(sum(r.improvement_percent for r in routes) / len(routes), 2))
