from datetime import datetime
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=200)


class AdminLoginResponse(BaseModel):
    token: str
    expires_at: datetime
