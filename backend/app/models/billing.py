from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Date, Float, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class BillStatus(str, enum.Enum):
    PAID = "Paid"
    PENDING = "Pending"
    PARTIALLY_PAID = "Partially paid"

class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)  # INV-2026-0001
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)

    issue_date = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    due_date = Column(Date, nullable=True)

    # Financial Breakdown
    consultation_charges = Column(Float, default=0.0)
    service_charges = Column(Float, default=0.0)  # Nursing, Lab, Procedures
    medicine_charges = Column(Float, default=0.0)
    room_charges = Column(Float, default=0.0)  # Bed daily rate * days
    tax_rate_percent = Column(Float, default=5.0)  # 5% GST/Service tax
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)
    paid_amount = Column(Float, default=0.0)

    status = Column(Enum(BillStatus), default=BillStatus.PENDING, nullable=False, index=True)
    payment_method = Column(String(50), default="Pending")  # Cash, Card, UPI, Insurance, Pending
    notes = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="bills")
    appointment = relationship("Appointment", back_populates="bills")
    payments = relationship("Payment", back_populates="bill", cascade="all, delete-orphan")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=False)
    transaction_id = Column(String(100), unique=True, nullable=False)
    payment_date = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), nullable=False)  # Cash, Credit/Debit Card, UPI, Health Insurance
    payment_status = Column(String(50), default="Success")  # Success, Failed
    notes = Column(Text, nullable=True)

    bill = relationship("Bill", back_populates="payments")
