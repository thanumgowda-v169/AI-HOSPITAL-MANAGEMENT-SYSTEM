from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, Token, UserResponse, UserCreate, PasswordResetRequest
from app.services.auth import verify_password, get_password_hash, create_access_token, get_current_user, require_roles
from app.services.audit import log_audit

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value, "user_id": user.id}
    )

    log_audit(db, user, "LOGIN", "User", str(user.id), f"User {user.email} logged in successfully")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role.value,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/reset-password")
def reset_password(req: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with this email not found")
    
    user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    log_audit(db, user, "PASSWORD_RESET", "User", str(user.id), f"Password reset for {user.email}")
    return {"message": "Password reset successfully. You can now log in with the new password."}

@router.get("/users", response_model=list[UserResponse])
def list_users(
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HOSPITAL_MANAGER])),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()
    return users

@router.post("/register", response_model=UserResponse)
def register_user(
    user_in: UserCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        phone=user_in.phone,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    log_audit(db, current_user, "CREATE", "User", str(new_user.id), f"Created staff user {new_user.email} as {new_user.role.value}")
    return new_user
