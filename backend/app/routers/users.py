"""User Management Routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models
from app.auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])


def require_manager(current: models.User):
    if current.role != "manager":
        raise HTTPException(403, "Manager access required")


@router.get("/technicians")
def list_technicians(
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user)
):
    """List all technicians - MANAGER ONLY"""
    require_manager(current)
    users = db.query(models.User).filter(models.User.role == "technician").all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "username": u.username,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
        }
        for u in users
    ]


@router.get("/")
def list_users(
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user)
):
    """List all users - MANAGER ONLY"""
    require_manager(current)
    users = db.query(models.User).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "username": u.username,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
        }
        for u in users
    ]