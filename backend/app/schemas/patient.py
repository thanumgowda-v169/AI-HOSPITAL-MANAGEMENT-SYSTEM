from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

class PatientBase(BaseModel):
    full_name: str
    date_of_birth: Optional[date] = None
    age: int
    gender: str  # Male, Female, Other
    blood_group: str
    phone: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    status: Optional[str] = "Active"

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    status: Optional[str] = None

class PatientResponse(PatientBase):
    id: int
    patient_id: str
    registration_date: datetime

    class Config:
        from_attributes = True
