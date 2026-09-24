from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class LoginRequest(BaseModel):
    email: str
    password: str

class UserProfileResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    role_display: Optional[str] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = "Odisha"
    address: Optional[str] = None
    verification_status: Optional[str] = "VERIFIED"

    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse
