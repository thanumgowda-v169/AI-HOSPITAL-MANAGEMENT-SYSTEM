from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.doctor import Doctor, Department
from app.models.user import User, UserRole
from app.schemas.doctor import DoctorCreate, DoctorUpdate, DoctorResponse, DepartmentCreate, DepartmentResponse
from app.services.auth import get_current_user, require_roles
from app.services.audit import log_audit

router = APIRouter(prefix="/doctors", tags=["Doctors & Departments"])

@router.get("/departments", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    departments = db.query(Department).all()
    return departments

@router.post("/departments", response_model=DepartmentResponse)
def create_department(
    dept_in: DepartmentCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HOSPITAL_MANAGER])),
    db: Session = Depends(get_db)
):
    existing = db.query(Department).filter(Department.name == dept_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this name already exists")
    
    dept = Department(**dept_in.dict())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    
    log_audit(db, current_user, "CREATE", "Department", str(dept.id), f"Created department {dept.name}")
    return dept

@router.get("/", response_model=List[DoctorResponse])
def list_doctors(
    department_id: int = None,
    available_only: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(Doctor)
    if department_id:
        query = query.filter(Doctor.department_id == department_id)
    if available_only:
        query = query.filter(Doctor.is_available == True)
        
    doctors = query.all()
    results = []
    for doc in doctors:
        doc_resp = DoctorResponse.from_orm(doc)
        if doc.department:
            doc_resp.department_name = doc.department.name
        results.append(doc_resp)
    return results

@router.post("/", response_model=DoctorResponse)
def create_doctor(
    doc_in: DoctorCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HOSPITAL_MANAGER])),
    db: Session = Depends(get_db)
):
    existing = db.query(Doctor).filter(Doctor.doctor_code == doc_in.doctor_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Doctor code already in use")

    doctor = Doctor(**doc_in.dict())
    db.add(doctor)
    db.commit()
    db.refresh(doctor)

    log_audit(db, current_user, "CREATE", "Doctor", str(doctor.id), f"Added doctor {doctor.full_name} ({doctor.doctor_code})")
    
    doc_resp = DoctorResponse.from_orm(doctor)
    if doctor.department:
        doc_resp.department_name = doctor.department.name
    return doc_resp

@router.put("/{doctor_id}", response_model=DoctorResponse)
def update_doctor(
    doctor_id: int,
    doc_update: DoctorUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HOSPITAL_MANAGER])),
    db: Session = Depends(get_db)
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    for k, v in doc_update.dict(exclude_unset=True).items():
        setattr(doctor, k, v)
        
    db.commit()
    db.refresh(doctor)
    
    log_audit(db, current_user, "UPDATE", "Doctor", str(doctor.id), f"Updated profile for doctor {doctor.full_name}")
    
    doc_resp = DoctorResponse.from_orm(doctor)
    if doctor.department:
        doc_resp.department_name = doctor.department.name
    return doc_resp
