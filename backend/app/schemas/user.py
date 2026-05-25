import re
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from app.utilities.sanitizer import sanitize_name

MOBILE_PATTERN = re.compile(r"^\+?[1-9]\d{7,14}$")


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    mobile_number: str = Field(min_length=8, max_length=16)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned = sanitize_name(value)
        if len(cleaned) < 2:
            raise ValueError("Name must contain at least 2 characters")
        return cleaned

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile(cls, value: str) -> str:
        cleaned = re.sub(r"[\s-]", "", value)
        if not MOBILE_PATTERN.match(cleaned):
            raise ValueError("Mobile number must be 8-15 digits and may start with +")
        return cleaned


class UserResponse(BaseModel):
    id: int
    name: str
    mobile_number: str
    is_online: bool
    is_active: bool
    last_seen: datetime | None
    connected_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserAdminCreate(RegisterRequest):
    is_active: bool = True


class UserAdminUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    mobile_number: str | None = Field(default=None, min_length=8, max_length=16)
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def validate_optional_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = sanitize_name(value)
        if len(cleaned) < 2:
            raise ValueError("Name must contain at least 2 characters")
        return cleaned

    @field_validator("mobile_number")
    @classmethod
    def validate_optional_mobile(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = re.sub(r"[\s-]", "", value)
        if not MOBILE_PATTERN.match(cleaned):
            raise ValueError("Mobile number must be 8-15 digits and may start with +")
        return cleaned


class UserAdminResponse(UserResponse):
    total_messages: int = 0
