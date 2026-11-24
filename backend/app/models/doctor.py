from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.department import Department

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    doctor_code = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    specialization = Column(String(150), nullable=False)
    qualification = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    room_number = Column(String(50), nullable=True)
    consulting_fee = Column(Float, default=500.0)
    availability_days = Column(String(100), default="Mon,Tue,Wed,Thu,Fri")
    shift_start = Column(String(20), default="09:00 AM")
    shift_end = Column(String(20), default="05:00 PM")
    is_available = Column(Boolean, default=True)

    department = relationship("Department", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")
    medical_records = relationship("MedicalRecord", back_populates="doctor")
