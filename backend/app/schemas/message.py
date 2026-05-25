from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from app.utilities.sanitizer import sanitize_message


class MessageCreate(BaseModel):
    receiver_id: int = Field(gt=0)
    message: str = Field(min_length=1, max_length=2000)
    reply_to_message_id: int | None = Field(default=None, gt=0)

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        cleaned = sanitize_message(value)
        if not cleaned:
            raise ValueError("Message cannot be empty")
        return cleaned


class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    message: str
    reply_to_message_id: int | None
    reply_preview: str | None = None
    status: str
    delivered_at: datetime | None
    read_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class MessagePageResponse(BaseModel):
    items: list[MessageResponse]
    next_before_id: int | None


class MessageAckRequest(BaseModel):
    message_ids: list[int] = Field(min_length=1, max_length=100)


class WebSocketEnvelope(BaseModel):
    type: str
    payload: dict
