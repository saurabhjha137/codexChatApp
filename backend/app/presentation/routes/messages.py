from fastapi import APIRouter, Depends, Header, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.common import ApiResponse
from app.models.message import Message
from app.schemas.message import MessagePageResponse, MessageResponse
from app.services.dependencies import build_message_service

router = APIRouter(prefix="/messages", tags=["messages"])


def to_message_response(record: Message) -> MessageResponse:
    preview = record.reply_to.message[:140] if record.reply_to else None
    return MessageResponse.model_validate(record).model_copy(update={"reply_preview": preview})


@router.get("/{user_id}", response_model=ApiResponse[MessagePageResponse])
def get_messages(
    user_id: int,
    x_user_id: int = Header(alias="X-User-Id"),
    limit: int = Query(default=50, ge=1, le=100),
    before_id: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
) -> ApiResponse[MessagePageResponse]:
    records = build_message_service(db).get_conversation(
        current_user_id=x_user_id,
        other_user_id=user_id,
        limit=limit,
        before_id=before_id,
    )
    next_before_id = records[0].id if len(records) == limit else None
    return ApiResponse(data=MessagePageResponse(items=[to_message_response(record) for record in records], next_before_id=next_before_id))
