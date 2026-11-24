from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class BedStatus(str, enum.Enum):
    AVAILABLE = "Available"
    OCCUPIED = "Occupied"
    RESERVED = "Reserved"
    MAINTENANCE = "Maintenance"

class Ward(Base):
    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)  # ICU, General Ward A, etc.
    ward_type = Column(String(50), nullable=False)  # Intensive Care, General, Emergency, Pediatric, Maternity
    floor = Column(Integer, default=1)
    daily_rate = Column(Float, default=1500.0)

    beds = relationship("Bed", back_populates="ward")

class Bed(Base):
    __tablename__ = "beds"

    id = Column(Integer, primary_key=True, index=True)
    bed_number = Column(String(50), unique=True, index=True, nullable=False)  # e.g., ICU-101, GEN-201
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=False)
    status = Column(Enum(BedStatus), default=BedStatus.AVAILABLE, nullable=False, index=True)
    features = Column(String(255), default="Standard Monitor, Oxygen Supply")
    notes = Column(Text, nullable=True)

    ward = relationship("Ward", back_populates="beds")
    allocations = relationship("BedAllocation", back_populates="bed", cascade="all, delete-orphan")

class BedAllocation(Base):
    __tablename__ = "bed_allocations"

    id = Column(Integer, primary_key=True, index=True)
    bed_id = Column(Integer, ForeignKey("beds.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    
    admission_date = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    expected_discharge_date = Column(DateTime(timezone=True), nullable=True)
    actual_discharge_date = Column(DateTime(timezone=True), nullable=True)
    admitting_diagnosis = Column(Text, nullable=True)
    status = Column(String(50), default="Active")  # Active, Discharged, Transferred

    bed = relationship("Bed", back_populates="allocations")
    patient = relationship("Patient", back_populates="bed_allocations")
    doctor = relationship("Doctor")
