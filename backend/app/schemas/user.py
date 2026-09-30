from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator
from typing import Optional
from datetime import datetime

def clean_name(value: str) -> str:
    value = (value or "").strip()
    if not value:
        raise ValueError("Please enter your name.")
    return value


class UserBase(BaseModel):
    full_name: str = Field(max_length=100)
    email: EmailStr
    age: Optional[int] = Field(default=None, gt=0, le=120)
    gender: Optional[str] = Field(default=None, max_length=30)
    height: Optional[float] = Field(default=None, ge=50, le=250)    # cm
    weight: Optional[float] = Field(default=None, ge=20, le=300)    # kg
    rehabilitation_goal: Optional[str] = Field(default=None, max_length=300)

    @field_validator("full_name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        return clean_name(v)

    @field_validator("email")
    @classmethod
    def lower_email(cls, v: str) -> str:
        # Emails are matched case-insensitively, so store them in lower case
        return v.lower()


class UserCreate(UserBase):
    # bcrypt only uses the first 72 bytes of a password
    password: str = Field(min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def password_rules(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("The password can't be only spaces.")
        if len(v.encode()) > 72:
            raise ValueError("Use a password of at most 72 bytes.")
        return v


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=100)
    age: Optional[int] = Field(default=None, gt=0, le=120)
    gender: Optional[str] = Field(default=None, max_length=30)
    height: Optional[float] = Field(default=None, ge=50, le=250)
    weight: Optional[float] = Field(default=None, ge=20, le=300)
    rehabilitation_goal: Optional[str] = Field(default=None, max_length=300)

    @field_validator("full_name")
    @classmethod
    def name_not_blank(cls, v: Optional[str]) -> str:
        # A name can be changed but not removed
        return clean_name(v)

class UserInDB(UserBase):
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
