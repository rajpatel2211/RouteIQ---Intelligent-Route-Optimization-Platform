"""Meters Routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/meters", tags=["Meters"])


@router.get("/", response_model=List[schemas.MeterResponse])
def list_meters(db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    return db.query(models.Meter).filter(models.Meter.owner_id == current.id).all()


@router.post("/", response_model=schemas.MeterResponse)
def create_meter(meter: schemas.MeterCreate, db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    if db.query(models.Meter).filter(models.Meter.meter_id == meter.meter_id).first():
        raise HTTPException(status_code=400, detail="Meter exists")
    m = models.Meter(**meter.dict(), owner_id=current.id)
    db.add(m); db.commit(); db.refresh(m)
    return m


@router.post("/bulk", response_model=List[schemas.MeterResponse])
def bulk_create(meters: List[schemas.MeterCreate], db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    created = []
    for meter in meters:
        if not db.query(models.Meter).filter(models.Meter.meter_id == meter.meter_id).first():
            m = models.Meter(**meter.dict(), owner_id=current.id)
            db.add(m); created.append(m)
    db.commit()
    for m in created: db.refresh(m)
    return created


@router.delete("/{meter_id}")
def delete_meter(meter_id: int, db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    m = db.query(models.Meter).filter(models.Meter.id == meter_id, models.Meter.owner_id == current.id).first()
    if not m: raise HTTPException(404, "Not found")
    db.delete(m); db.commit()
    return {"message": "deleted"}
