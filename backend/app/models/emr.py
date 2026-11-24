from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)

    record_date = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    chief_complaint = Column(Text, nullable=False)
    clinical_examination = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=False)
    icd10_code = Column(String(50), nullable=True)
    
    # Vital signs
    blood_pressure = Column(String(20), nullable=True)  # e.g., "120/80"
    pulse_rate = Column(Integer, nullable=True)  # bpm
    temperature = Column(Float, nullable=True)  # °F or °C
    respiratory_rate = Column(Integer, nullable=True)
    spo2 = Column(Integer, nullable=True)  # %

    doctor_notes = Column(Text, nullable=True)
    treatment_plan = Column(Text, nullable=True)
    is_confidential = Column(Boolean, default=False)  # Role-restricted access

    patient = relationship("Patient", back_populates="medical_records")
    doctor = relationship("Doctor", back_populates="medical_records")
    appointment = relationship("Appointment", back_populates="medical_records")
    prescriptions = relationship("Prescription", back_populates="medical_record", cascade="all, delete-orphan")

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    medical_record_id = Column(Integer, ForeignKey("medical_records.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    
    prescription_date = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="Active")  # Active, Dispensed, Discontinued

    medical_record = relationship("MedicalRecord", back_populates="prescriptions")
    items = relationship("PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan")

class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    dosage = Column(String(100), nullable=False)  # e.g., "500mg"
    frequency = Column(String(100), nullable=False)  # e.g., "1-0-1 (Twice daily)"
    duration_days = Column(Integer, default=5)
    quantity = Column(Integer, default=10)
    instructions = Column(String(255), nullable=True)  # e.g., "After meals"

    prescription = relationship("Prescription", back_populates="items")
    medicine = relationship("Medicine")
