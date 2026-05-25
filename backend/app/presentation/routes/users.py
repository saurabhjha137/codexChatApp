from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.common import ApiResponse
from app.schemas.user import UserResponse
from app.services.dependencies import build_user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=ApiResponse[list[UserResponse]])
def list_users(db: Session = Depends(get_db)) -> ApiResponse[list[UserResponse]]:
    users = build_user_service(db).list_users()
    return ApiResponse(data=[UserResponse.model_validate(user) for user in users])

