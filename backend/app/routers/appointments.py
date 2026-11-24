from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
import json

from app.database import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.department import Department
from app.models.user import User, UserRole
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.services.auth import get_current_user, require_roles
from app.services.audit import log_audit
from app.ai.noshow_model import noshow_ai

router = APIRouter(prefix="/appointments", tags=["Appointments"])

def generate_appointment_number(db: Session) -> str:
    count = db.query(Appointment).count()
    year = datetime.now().year
    return f"APT-{year}-{(count + 1):04d}"

def enrich_appointment_response(appt: Appointment) -> AppointmentResponse:
    resp = AppointmentResponse.from_orm(appt)
    if appt.patient:
        resp.patient_name = appt.patient.full_name
        resp.patient_code = appt.patient.patient_id
    if appt.doctor:
        resp.doctor_name = appt.doctor.full_name
    if appt.department:
        resp.department_name = appt.department.name
    return resp

@router.get("/", response_model=List[AppointmentResponse])
def list_appointments(
    appt_date: Optional[date] = None,
    doctor_id: Optional[int] = None,
    department_id: Optional[int] = None,
    status: Optional[AppointmentStatus] = None,
    patient_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Appointment)
    if appt_date:
        query = query.filter(Appointment.appointment_date == appt_date)
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if department_id:
        query = query.filter(Appointment.department_id == department_id)
    if status:
        query = query.filter(Appointment.status == status)
    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)

    appointments = query.order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.asc()).all()
    return [enrich_appointment_response(a) for a in appointments]

@router.post("/", response_model=AppointmentResponse)
def book_appointment(
    appt_in: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == appt_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    doctor = db.query(Doctor).filter(Doctor.id == appt_in.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    department = db.query(Department).filter(Department.id == appt_in.department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    # Calculate lead time in days
    today = datetime.now().date()
    lead_time = max(0, (appt_in.appointment_date - today).days)

    # Historical appointments for patient
    prev_appts_count = db.query(Appointment).filter(
        Appointment.patient_id == patient.id,
        Appointment.status != AppointmentStatus.CANCELLED
    ).count()

    prev_noshows_count = db.query(Appointment).filter(
        Appointment.patient_id == patient.id,
        Appointment.status == AppointmentStatus.NO_SHOW
    ).count()

    # Time of day parsing
    hour = 10
    try:
        time_str = appt_in.appointment_time.upper()
        if "PM" in time_str:
            base_hour = int(time_str.replace("PM", "").strip().split(":")[0])
            hour = base_hour + (12 if base_hour < 12 else 0)
        else:
            hour = int(time_str.replace("AM", "").strip().split(":")[0])
    except Exception:
        hour = 10

    day_of_week = appt_in.appointment_date.weekday()

    # Run AI No-Show Prediction
    ai_prediction = noshow_ai.predict(
        age=patient.age,
        lead_time_days=lead_time,
        day_of_week=day_of_week,
        hour_of_day=hour,
        department_id=appt_in.department_id,
        previous_appointments=prev_appts_count,
        previous_noshows=prev_noshows_count
    )

    appt_num = generate_appointment_number(db)

    appointment = Appointment(
        appointment_number=appt_num,
        patient_id=appt_in.patient_id,
        doctor_id=appt_in.doctor_id,
        department_id=appt_in.department_id,
        appointment_date=appt_in.appointment_date,
        appointment_time=appt_in.appointment_time,
        reason=appt_in.reason,
        notes=appt_in.notes,
        status=AppointmentStatus.SCHEDULED,
        lead_time_days=lead_time,
        noshow_risk_score=ai_prediction["noshow_risk_score"],
        noshow_risk_level=ai_prediction["risk_level"],
        noshow_risk_factors="; ".join(ai_prediction["top_contributing_factors"]),
        prediction_confidence=ai_prediction["confidence"]
    )

    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    log_audit(
        db, current_user, "CREATE", "Appointment", str(appointment.id),
        f"Booked appointment {appt_num} for {patient.full_name} with Dr. {doctor.full_name}. AI No-Show Risk: {ai_prediction['risk_level']} ({ai_prediction['risk_percentage']}%)"
    )

    return enrich_appointment_response(appointment)

@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    appt_update: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    update_data = appt_update.dict(exclude_unset=True)

    # If rescheduling date changed, re-run AI prediction
    if "appointment_date" in update_data and update_data["appointment_date"] != appointment.appointment_date:
        today = datetime.now().date()
        lead_time = max(0, (update_data["appointment_date"] - today).days)
        appointment.lead_time_days = lead_time
        
        patient = appointment.patient
        if patient:
            day_of_week = update_data["appointment_date"].weekday()
            ai_pred = noshow_ai.predict(
                age=patient.age,
                lead_time_days=lead_time,
                day_of_week=day_of_week,
                hour_of_day=10,
                department_id=appointment.department_id
            )
            appointment.noshow_risk_score = ai_pred["noshow_risk_score"]
            appointment.noshow_risk_level = ai_pred["risk_level"]
            appointment.noshow_risk_factors = "; ".join(ai_pred["top_contributing_factors"])
            appointment.prediction_confidence = ai_pred["confidence"]

    for k, v in update_data.items():
        setattr(appointment, k, v)

    db.commit()
    db.refresh(appointment)

    log_audit(
        db, current_user, "UPDATE", "Appointment", str(appointment.id),
        f"Updated appointment {appointment.appointment_number} (Status: {appointment.status.value})"
    )

    return enrich_appointment_response(appointment)

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return enrich_appointment_response(appointment)
