from sqlalchemy import Column, Integer, String, Text, DateTime, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), unique=True, index=True, nullable=False)  # e.g., CR-2026-0001
    full_name = Column(String(255), index=True, nullable=False)
    date_of_birth = Column(Date, nullable=True)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)  # Male, Female, Other
    blood_group = Column(String(10), nullable=False)  # A+, B+, O+, AB+, etc.
    phone = Column(String(50), index=True, nullable=False)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact_name = Column(String(255), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)
    emergency_contact_relation = Column(String(50), nullable=True)
    allergies = Column(Text, nullable=True)  # Comma separated or description
    chronic_conditions = Column(Text, nullable=True)
    registration_date = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    status = Column(String(50), default="Active")  # Active, Inpatient, Discharged

    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    medical_records = relationship("MedicalRecord", back_populates="patient", cascade="all, delete-orphan")
    bills = relationship("Bill", back_populates="patient", cascade="all, delete-orphan")
    bed_allocations = relationship("BedAllocation", back_populates="patient", cascade="all, delete-orphan")
