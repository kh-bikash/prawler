from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: EmailStr  # OAuth2PasswordRequestForm uses 'username' for email
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class BuildCreateRequest(BaseModel):
    prompt: str

class BuildResponse(BaseModel):
    id: int
    user_id: int
    prompt: str
    device_name: str
    description: str
    parts_json: List[Any] | Any 
    wiring_json: List[Any] | Any
    firmware_code: str
    firmware_code: str
    enclosure_md: str
    openscad_code: Optional[str] = None
    cad_script: Optional[str] = None
    openscad_lid: Optional[str] = None
    openscad_body: Optional[str] = None
    stl_lid_url: Optional[str] = None
    stl_body_url: Optional[str] = None
    analysis: Optional[str] = None
    steps_json: List[Any] | Any
    created_at: datetime

    class Config:
        from_attributes = True
