from sqlalchemy.orm import Session
from app.models.user import AuditLog, User
from typing import Optional

def log_audit(
    db: Session,
    user: Optional[User],
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = "127.0.0.1"
):
    try:
        audit_entry = AuditLog(
            user_id=user.id if user else None,
            user_email=user.email if user else "system",
            role=user.role.value if (user and hasattr(user, 'role')) else "SYSTEM",
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id is not None else None,
            details=details,
            ip_address=ip_address
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Audit Error] Failed to write audit log: {e}")
