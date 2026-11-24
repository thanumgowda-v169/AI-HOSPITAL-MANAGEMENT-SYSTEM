from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Date, Float, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "Scheduled"
    CONFIRMED = "Confirmed"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
    NO_SHOW = "No-show"

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    appointment_number = Column(String(50), unique=True, index=True, nullable=False)  # e.g., APT-2026-0001
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    
    appointment_date = Column(Date, nullable=False, index=True)
    appointment_time = Column(String(20), nullable=False)  # e.g., "10:30 AM"
    reason = Column(Text, nullable=True)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.SCHEDULED, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    booking_date = Column(DateTime(timezone=True), server_default=func.now())

    # AI No-Show Prediction Fields
    lead_time_days = Column(Integer, default=1)
    noshow_risk_score = Column(Float, default=0.0)  # 0.0 to 1.0 (e.g. 0.35)
    noshow_risk_level = Column(String(20), default="Low")  # Low, Medium, High
    noshow_risk_factors = Column(Text, nullable=True)  # JSON or comma-separated explanations
    prediction_confidence = Column(Float, default=0.85)

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    department = relationship("Department")
    medical_records = relationship("MedicalRecord", back_populates="appointment")
    bills = relationship("Bill", back_populates="appointment")
