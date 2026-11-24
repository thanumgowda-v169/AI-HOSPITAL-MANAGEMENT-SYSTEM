from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.appointment import AppointmentStatus

class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    department_id: int
    appointment_date: date
    appointment_time: str
    reason: Optional[str] = None
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    appointment_date: Optional[date] = None
    appointment_time: Optional[str] = None
    doctor_id: Optional[int] = None
    department_id: Optional[int] = None
    status: Optional[AppointmentStatus] = None
    reason: Optional[str] = None
    notes: Optional[str] = None

class AppointmentResponse(AppointmentBase):
    id: int
    appointment_number: str
    status: AppointmentStatus
    booking_date: datetime
    
    # AI Risk insights
    lead_time_days: int
    noshow_risk_score: float
    noshow_risk_level: str
    noshow_risk_factors: Optional[str] = None
    prediction_confidence: float

    # Joined fields for display
    patient_name: Optional[str] = None
    patient_code: Optional[str] = None
    doctor_name: Optional[str] = None
    department_name: Optional[str] = None

    class Config:
        from_attributes = True
