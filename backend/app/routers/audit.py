from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.user import AuditLog, User, UserRole
from app.services.auth import require_roles

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("/")
def list_audit_logs(
    limit: int = Query(100, ge=10, le=500),
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HOSPITAL_MANAGER])),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)

    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return logs
