from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.common import ApiResponse
from app.schemas.user import RegisterRequest, UserResponse
from app.services.dependencies import build_user_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=ApiResponse[UserResponse])
def register(request: RegisterRequest, db: Session = Depends(get_db)) -> ApiResponse[UserResponse]:
    user = build_user_service(db).register_or_login(request)
    return ApiResponse(message="Logged in successfully", data=UserResponse.model_validate(user))

