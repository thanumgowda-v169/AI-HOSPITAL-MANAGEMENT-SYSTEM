from pydantic import BaseModel, EmailStr
from typing import Optional

class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    floor_number: Optional[int] = 1
    phone_extension: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int

    class Config:
        from_attributes = True

class DoctorBase(BaseModel):
    doctor_code: str
    full_name: str
    department_id: int
    specialization: str
    qualification: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    room_number: Optional[str] = None
    consulting_fee: Optional[float] = 500.0
    availability_days: Optional[str] = "Mon,Tue,Wed,Thu,Fri"
    shift_start: Optional[str] = "09:00 AM"
    shift_end: Optional[str] = "05:00 PM"
    is_available: Optional[bool] = True

class DoctorCreate(DoctorBase):
    pass

class DoctorUpdate(BaseModel):
    full_name: Optional[str] = None
    department_id: Optional[int] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    room_number: Optional[str] = None
    consulting_fee: Optional[float] = None
    availability_days: Optional[str] = None
    shift_start: Optional[str] = None
    shift_end: Optional[str] = None
    is_available: Optional[bool] = None

class DoctorResponse(DoctorBase):
    id: int
    department_name: Optional[str] = None

    class Config:
        from_attributes = True
