from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from app.models.billing import BillStatus

class PaymentCreate(BaseModel):
    bill_id: int
    amount: float
    payment_method: str  # Cash, Credit/Debit Card, UPI, Health Insurance
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    bill_id: int
    transaction_id: str
    payment_date: datetime
    amount: float
    payment_method: str
    payment_status: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class BillBase(BaseModel):
    patient_id: int
    appointment_id: Optional[int] = None
    consultation_charges: float = 500.0
    service_charges: float = 0.0
    medicine_charges: float = 0.0
    room_charges: float = 0.0
    tax_rate_percent: float = 5.0
    discount_amount: float = 0.0
    notes: Optional[str] = None

class BillCreate(BillBase):
    pass

class BillUpdate(BaseModel):
    consultation_charges: Optional[float] = None
    service_charges: Optional[float] = None
    medicine_charges: Optional[float] = None
    room_charges: Optional[float] = None
    tax_rate_percent: Optional[float] = None
    discount_amount: Optional[float] = None
    status: Optional[BillStatus] = None
    notes: Optional[str] = None

class BillResponse(BillBase):
    id: int
    invoice_number: str
    issue_date: datetime
    due_date: Optional[date] = None
    tax_amount: float
    total_amount: float
    paid_amount: float
    status: BillStatus
    payment_method: str
    patient_name: Optional[str] = None
    patient_code: Optional[str] = None
    patient_phone: Optional[str] = None
    payments: List[PaymentResponse] = []

    class Config:
        from_attributes = True
