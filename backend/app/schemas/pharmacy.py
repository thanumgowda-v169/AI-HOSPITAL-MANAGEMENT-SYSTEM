from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class MedicineBase(BaseModel):
    name: str
    generic_name: Optional[str] = None
    category: str
    manufacturer: Optional[str] = None
    batch_number: str
    unit_price: float = 10.0
    stock_quantity: int = 100
    reorder_level: int = 20
    expiry_date: date
    unit_type: Optional[str] = "Tablets"
    dosage_form: Optional[str] = "500mg"
    is_active: Optional[bool] = True

class MedicineCreate(MedicineBase):
    pass

class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    generic_name: Optional[str] = None
    category: Optional[str] = None
    manufacturer: Optional[str] = None
    batch_number: Optional[str] = None
    unit_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    reorder_level: Optional[int] = None
    expiry_date: Optional[date] = None
    unit_type: Optional[str] = None
    dosage_form: Optional[str] = None
    is_active: Optional[bool] = None

class MedicineResponse(MedicineBase):
    id: int
    medicine_code: str
    created_at: datetime
    is_low_stock: bool = False
    is_near_expiry: bool = False

    class Config:
        from_attributes = True

class PharmacyTransactionCreate(BaseModel):
    medicine_id: int
    patient_id: Optional[int] = None
    prescription_id: Optional[int] = None
    transaction_type: str  # INCOMING, DISPENSED, RETURNED, EXPIRED, ADJUSTMENT
    quantity: int
    unit_price: Optional[float] = None
    notes: Optional[str] = None

class PharmacyTransactionResponse(BaseModel):
    id: int
    medicine_id: int
    patient_id: Optional[int] = None
    prescription_id: Optional[int] = None
    transaction_type: str
    quantity: int
    unit_price: float
    total_amount: float
    notes: Optional[str] = None
    timestamp: datetime
    medicine_name: Optional[str] = None
    patient_name: Optional[str] = None

    class Config:
        from_attributes = True
