from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.emr import MedicalRecord, Prescription, PrescriptionItem
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.pharmacy import Medicine
from app.models.user import User, UserRole
from app.schemas.emr import MedicalRecordCreate, MedicalRecordResponse, PrescriptionResponse, PrescriptionItemResponse
from app.services.auth import get_current_user, require_roles
from app.services.audit import log_audit

router = APIRouter(prefix="/emr", tags=["Electronic Medical Records"])

def enrich_record_response(rec: MedicalRecord, current_user: User) -> MedicalRecordResponse:
    # If confidential and user is not Doctor or Admin, redact sensitive fields
    is_privileged = current_user.role in [UserRole.ADMIN, UserRole.DOCTOR]
    
    resp = MedicalRecordResponse.from_orm(rec)
    if rec.patient:
        resp.patient_name = rec.patient.full_name
    if rec.doctor:
        resp.doctor_name = rec.doctor.full_name

    if rec.is_confidential and not is_privileged:
        resp.clinical_examination = "[CONFIDENTIAL RECORD - AUTHORIZED MEDICAL STAFF ONLY]"
        resp.doctor_notes = "[RESTRICTED ACCESS]"
        resp.treatment_plan = "[RESTRICTED ACCESS]"

    # Populate prescriptions
    resp_prescriptions = []
    for rx in rec.prescriptions:
        rx_items = []
        for itm in rx.items:
            itm_resp = PrescriptionItemResponse.from_orm(itm)
            if itm.medicine:
                itm_resp.medicine_name = itm.medicine.name
                itm_resp.medicine_category = itm.medicine.category
            rx_items.append(itm_resp)
            
        rx_dict = {
            "id": rx.id,
            "medical_record_id": rx.medical_record_id,
            "patient_id": rx.patient_id,
            "doctor_id": rx.doctor_id,
            "prescription_date": rx.prescription_date,
            "notes": rx.notes,
            "status": rx.status,
            "items": rx_items
        }
        resp_prescriptions.append(PrescriptionResponse(**rx_dict))
        
    resp.prescriptions = resp_prescriptions
    return resp

@router.get("/patient/{patient_id}", response_model=List[MedicalRecordResponse])
def get_patient_records(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    records = db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient_id).order_by(MedicalRecord.record_date.desc()).all()
    return [enrich_record_response(r, current_user) for r in records]

@router.post("/", response_model=MedicalRecordResponse)
def create_medical_record(
    record_in: MedicalRecordCreate,
    current_user: User = Depends(require_roles([UserRole.DOCTOR, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == record_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    doctor = db.query(Doctor).filter(Doctor.id == record_in.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    rec = MedicalRecord(
        patient_id=record_in.patient_id,
        doctor_id=record_in.doctor_id,
        appointment_id=record_in.appointment_id,
        chief_complaint=record_in.chief_complaint,
        clinical_examination=record_in.clinical_examination,
        diagnosis=record_in.diagnosis,
        icd10_code=record_in.icd10_code,
        blood_pressure=record_in.blood_pressure,
        pulse_rate=record_in.pulse_rate,
        temperature=record_in.temperature,
        respiratory_rate=record_in.respiratory_rate,
        spo2=record_in.spo2,
        doctor_notes=record_in.doctor_notes,
        treatment_plan=record_in.treatment_plan,
        is_confidential=record_in.is_confidential or False
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    # Process Prescriptions if provided
    if record_in.prescriptions:
        for rx_in in record_in.prescriptions:
            rx = Prescription(
                medical_record_id=rec.id,
                patient_id=rec.patient_id,
                doctor_id=rec.doctor_id,
                notes=rx_in.notes,
                status="Active"
            )
            db.add(rx)
            db.commit()
            db.refresh(rx)

            for item_in in rx_in.items:
                p_item = PrescriptionItem(
                    prescription_id=rx.id,
                    medicine_id=item_in.medicine_id,
                    dosage=item_in.dosage,
                    frequency=item_in.frequency,
                    duration_days=item_in.duration_days,
                    quantity=item_in.quantity,
                    instructions=item_in.instructions
                )
                db.add(p_item)
            db.commit()

    db.refresh(rec)
    log_audit(db, current_user, "CREATE", "EMR", str(rec.id), f"Recorded consultation for patient {patient.full_name} (Diagnosis: {rec.diagnosis})")
    return enrich_record_response(rec, current_user)

@router.get("/{record_id}", response_model=MedicalRecordResponse)
def get_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rec = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Medical record not found")
    return enrich_record_response(rec, current_user)
