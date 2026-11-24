from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.bed import BedStatus

class WardResponse(BaseModel):
    id: int
    name: str
    ward_type: str
    floor: int
    daily_rate: float
    total_beds: int = 0
    available_beds: int = 0
    occupied_beds: int = 0

    class Config:
        from_attributes = True

class BedBase(BaseModel):
    bed_number: str
    ward_id: int
    features: Optional[str] = "Standard Monitor, Oxygen Supply"
    notes: Optional[str] = None

class BedCreate(BedBase):
    pass

class BedUpdate(BaseModel):
    status: Optional[BedStatus] = None
    features: Optional[str] = None
    notes: Optional[str] = None

class BedResponse(BedBase):
    id: int
    status: BedStatus
    ward_name: Optional[str] = None
    daily_rate: Optional[float] = None
    current_patient_name: Optional[str] = None
    current_patient_id: Optional[str] = None
    admission_date: Optional[datetime] = None

    class Config:
        from_attributes = True

class BedAllocationCreate(BaseModel):
    bed_id: int
    patient_id: int
    doctor_id: Optional[int] = None
    admitting_diagnosis: Optional[str] = None
    expected_discharge_date: Optional[datetime] = None

class BedAllocationResponse(BaseModel):
    id: int
    bed_id: int
    patient_id: int
    doctor_id: Optional[int] = None
    admission_date: datetime
    expected_discharge_date: Optional[datetime] = None
    actual_discharge_date: Optional[datetime] = None
    admitting_diagnosis: Optional[str] = None
    status: str
    bed_number: Optional[str] = None
    ward_name: Optional[str] = None
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None

    class Config:
        from_attributes = True
