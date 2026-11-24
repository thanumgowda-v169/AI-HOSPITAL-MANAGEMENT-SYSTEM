from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PrescriptionItemBase(BaseModel):
    medicine_id: int
    dosage: str
    frequency: str
    duration_days: int = 5
    quantity: int = 10
    instructions: Optional[str] = "After meals"

class PrescriptionItemResponse(PrescriptionItemBase):
    id: int
    medicine_name: Optional[str] = None
    medicine_category: Optional[str] = None

    class Config:
        from_attributes = True

class PrescriptionCreate(BaseModel):
    notes: Optional[str] = None
    items: List[PrescriptionItemBase] = []

class PrescriptionResponse(BaseModel):
    id: int
    medical_record_id: int
    patient_id: int
    doctor_id: int
    prescription_date: datetime
    notes: Optional[str] = None
    status: str
    items: List[PrescriptionItemResponse] = []

    class Config:
        from_attributes = True

class MedicalRecordBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_id: Optional[int] = None
    chief_complaint: str
    clinical_examination: Optional[str] = None
    diagnosis: str
    icd10_code: Optional[str] = None
    blood_pressure: Optional[str] = "120/80"
    pulse_rate: Optional[int] = 72
    temperature: Optional[float] = 98.6
    respiratory_rate: Optional[int] = 16
    spo2: Optional[int] = 98
    doctor_notes: Optional[str] = None
    treatment_plan: Optional[str] = None
    is_confidential: Optional[bool] = False

class MedicalRecordCreate(MedicalRecordBase):
    prescriptions: Optional[List[PrescriptionCreate]] = None

class MedicalRecordResponse(MedicalRecordBase):
    id: int
    record_date: datetime
    doctor_name: Optional[str] = None
    patient_name: Optional[str] = None
    prescriptions: List[PrescriptionResponse] = []

    class Config:
        from_attributes = True
