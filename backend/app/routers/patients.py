from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.patient import Patient
from app.models.user import User, UserRole
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.services.auth import get_current_user, require_roles
from app.services.audit import log_audit

router = APIRouter(prefix="/patients", tags=["Patients"])

def generate_patient_id(db: Session) -> str:
    count = db.query(Patient).count()
    year = datetime.now().year
    return f"CR-{year}-{(count + 1):04d}"

@router.get("/", response_model=List[PatientResponse])
def list_patients(
    search: Optional[str] = Query(None, description="Search by name, patient ID or phone"),
    status: Optional[str] = Query(None),
    gender: Optional[str] = Query(None),
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Patient)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Patient.full_name.ilike(search_filter),
                Patient.patient_id.ilike(search_filter),
                Patient.phone.ilike(search_filter)
            )
        )
        
    if status:
        query = query.filter(Patient.status == status)
        
    if gender:
        query = query.filter(Patient.gender == gender)
        
    patients = query.order_by(Patient.id.desc()).offset(offset).limit(limit).all()
    return patients

@router.post("/", response_model=PatientResponse)
def create_patient(
    patient_in: PatientCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.NURSE, UserRole.HOSPITAL_MANAGER])),
    db: Session = Depends(get_db)
):
    unique_id = generate_patient_id(db)
    
    patient = Patient(
        patient_id=unique_id,
        full_name=patient_in.full_name,
        date_of_birth=patient_in.date_of_birth,
        age=patient_in.age,
        gender=patient_in.gender,
        blood_group=patient_in.blood_group,
        phone=patient_in.phone,
        email=patient_in.email,
        address=patient_in.address,
        emergency_contact_name=patient_in.emergency_contact_name,
        emergency_contact_phone=patient_in.emergency_contact_phone,
        emergency_contact_relation=patient_in.emergency_contact_relation,
        allergies=patient_in.allergies,
        chronic_conditions=patient_in.chronic_conditions,
        status=patient_in.status or "Active"
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    log_audit(db, current_user, "CREATE", "Patient", str(patient.id), f"Registered patient {patient.full_name} ({unique_id})")
    return patient

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient_update: PatientUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.NURSE, UserRole.HOSPITAL_MANAGER])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    update_data = patient_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
        
    db.commit()
    db.refresh(patient)
    
    log_audit(db, current_user, "UPDATE", "Patient", str(patient.id), f"Updated details for patient {patient.full_name}")
    return patient

@router.delete("/{patient_id}")
def delete_patient(
    patient_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    p_name = patient.full_name
    db.delete(patient)
    db.commit()
    
    log_audit(db, current_user, "DELETE", "Patient", str(patient_id), f"Admin deleted patient {p_name}")
    return {"message": f"Patient {p_name} deleted successfully"}
