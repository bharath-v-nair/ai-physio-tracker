from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    age: Optional[int] = Field(default=None, gt=0)
    gender: Optional[str] = None
    height: Optional[float] = Field(default=None, gt=0)
    weight: Optional[float] = Field(default=None, gt=0)
    rehabilitation_goal: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(min_length=8)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = Field(default=None, gt=0)
    gender: Optional[str] = None
    height: Optional[float] = Field(default=None, gt=0)
    weight: Optional[float] = Field(default=None, gt=0)
    rehabilitation_goal: Optional[str] = None

class UserInDB(UserBase):
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
