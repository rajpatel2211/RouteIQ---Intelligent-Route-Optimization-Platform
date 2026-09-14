"""Meters Routes - Full Version with Assignment"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/meters", tags=["Meters"])


def require_manager(current: models.User):
    """Helper to enforce manager role"""
    if current.role != "manager":
        raise HTTPException(403, "Manager access required")


# ==================== LIST METERS ====================
@router.get("/", response_model=List[schemas.MeterResponse])
def list_meters(
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user)
):
    """List meters - Manager sees all, Technician sees assigned"""
    if current.role == "manager":
        return db.query(models.Meter).all()
    return (
        db.query(models.Meter)
        .filter(
            (models.Meter.assigned_to == current.id) |
            ((models.Meter.assigned_to == None) & (models.Meter.owner_id == current.id))
        )
        .all()
    )


# ==================== CREATE METER ====================
@router.post("/", response_model=schemas.MeterResponse)
def create_meter(
    meter: schemas.MeterCreate,
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user)
):
    """Create a meter - technicians auto-assign to self"""
    if db.query(models.Meter).filter(models.Meter.meter_id == meter.meter_id).first():
        raise HTTPException(400, "Meter already exists")
    
    meter_data = meter.dict()
    if current.role == "technician" and not meter_data.get("assigned_to"):
        meter_data["assigned_to"] = current.id
    
    m = models.Meter(**meter_data, owner_id=current.id)
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


# ==================== BULK CREATE ====================
@router.post("/bulk", response_model=List[schemas.MeterResponse])
def bulk_create(
    meters: List[schemas.MeterCreate],
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user)
):
    """Bulk create - for CSV upload / demo generation"""
    created = []
    for meter in meters:
        if not db.query(models.Meter).filter(models.Meter.meter_id == meter.meter_id).first():
            meter_data = meter.dict()
            if current.role == "technician" and not meter_data.get("assigned_to"):
                meter_data["assigned_to"] = current.id
            m = models.Meter(**meter_data, owner_id=current.id)
            db.add(m)
            created.append(m)
    db.commit()
    for m in created:
        db.refresh(m)
    return created


# ==================== BULK ASSIGN (SPECIFIC ROUTE) ====================
@router.post("/bulk-assign")
def bulk_assign_meters(
    payload: dict,
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user)
):
    """
    Bulk assign meters to a technician - MANAGER ONLY
    Body: {"meter_ids": [1, 2, 3], "user_id": 5}
    """
    if current.role != "manager":
        raise HTTPException(403, "Only managers can assign meters")
    
    meter_ids = payload.get("meter_ids", [])
    user_id = payload.get("user_id")
    
    if not meter_ids or not user_id:
        raise HTTPException(400, "meter_ids and user_id are required")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    
    if user.role != "technician":
        raise HTTPException(400, "Can only assign to technicians")
    
    updated = db.query(models.Meter).filter(models.Meter.id.in_(meter_ids)).all()
    for m in updated:
        m.assigned_to = user_id
    db.commit()
    
    return {
        "message": f"Assigned {len(updated)} meters to {user.full_name or user.username}",
        "assigned_count": len(updated),
        "technician": user.username
    }


# ==================== UNASSIGN ====================
@router.post("/unassign")
def unassign_meters(
    payload: dict,
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user)
):
    """Unassign meters - MANAGER ONLY"""
    if current.role != "manager":
        raise HTTPException(403, "Only managers can unassign meters")
    
    meter_ids = payload.get("meter_ids", [])
    if not meter_ids:
        raise HTTPException(400, "meter_ids required")
    
    updated = db.query(models.Meter).filter(models.Meter.id.in_(meter_ids)).all()
    for m in updated:
        m.assigned_to = None
    db.commit()
    
    return {"message": f"Unassigned {len(updated)} meters"}


# ==================== LIST UNASSIGNED ====================
@router.get("/unassigned/list", response_model=List[schemas.MeterResponse])
def list_unassigned(
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user)
):
    """List unassigned meters - MANAGER ONLY"""
    require_manager(current)
    return db.query(models.Meter).filter(models.Meter.assigned_to == None).all()


# ==================== ASSIGN SINGLE METER ====================
@router.put("/{meter_id}/assign/{user_id}", response_model=schemas.MeterResponse)
def assign_meter(
    meter_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user)
):
    """Assign single meter to technician - MANAGER ONLY"""
    if current.role != "manager":
        raise HTTPException(403, "Only managers can assign meters")
    
    meter = db.query(models.Meter).filter(models.Meter.id == meter_id).first()
    if not meter:
        raise HTTPException(404, "Meter not found")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    
    if user.role != "technician":
        raise HTTPException(400, "Can only assign to technicians")
    
    meter.assigned_to = user_id
    db.commit()
    db.refresh(meter)
    return meter


# ==================== DELETE METER (Dynamic - LAST) ====================
@router.delete("/{meter_id}")
def delete_meter(
    meter_id: int,
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user)
):
    """Delete meter - Manager can delete any; technician only own/assigned"""
    m = db.query(models.Meter).filter(models.Meter.id == meter_id).first()
    if not m:
        raise HTTPException(404, "Meter not found")
    
    if current.role == "manager":
        pass  # managers can delete anything
    elif m.owner_id == current.id or m.assigned_to == current.id:
        pass  # technicians can delete their own
    else:
        raise HTTPException(403, "You don't have permission to delete this meter")
    
    db.delete(m)
    db.commit()
    return {"message": "deleted"}