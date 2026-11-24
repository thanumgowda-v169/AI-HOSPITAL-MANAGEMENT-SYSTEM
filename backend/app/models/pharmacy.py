from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Date, Float, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    medicine_code = Column(String(50), unique=True, index=True, nullable=False)  # e.g., MED-001
    name = Column(String(255), index=True, nullable=False)
    generic_name = Column(String(255), nullable=True)
    category = Column(String(100), index=True, nullable=False)  # Antibiotics, Analgesics, Antipyretics, etc.
    manufacturer = Column(String(255), nullable=True)
    batch_number = Column(String(100), nullable=False)
    unit_price = Column(Float, nullable=False, default=10.0)
    stock_quantity = Column(Integer, nullable=False, default=100)
    reorder_level = Column(Integer, nullable=False, default=20)
    expiry_date = Column(Date, nullable=False, index=True)
    unit_type = Column(String(50), default="Tablets")  # Tablets, Capsules, Syrup, Injection, Vial
    dosage_form = Column(String(100), nullable=True)  # 500mg, 100ml, 5mg/ml
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    transactions = relationship("PharmacyTransaction", back_populates="medicine", cascade="all, delete-orphan")

class PharmacyTransaction(Base):
    __tablename__ = "pharmacy_transactions"

    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=True)
    transaction_type = Column(String(50), nullable=False)  # INCOMING, DISPENSED, RETURNED, EXPIRED, ADJUSTMENT
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    dispensed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    medicine = relationship("Medicine", back_populates="transactions")
    patient = relationship("Patient")
    prescription = relationship("Prescription")
