from fastapi import APIRouter, Depends, Header, Query
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.database.session import get_db
from app.schemas.admin import AdminLoginRequest, AdminLoginResponse
from app.schemas.common import ApiResponse
from app.schemas.user import UserAdminCreate, UserAdminResponse, UserAdminUpdate
from app.services.admin_auth_service import AdminAuthService
from app.services.dependencies import build_message_service, build_user_service

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(authorization: str = Header(default="")) -> None:
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        from app.core.exceptions import UnauthorizedError

        raise UnauthorizedError("Missing admin token")
    AdminAuthService(get_settings()).verify(token)


@router.post("/login", response_model=ApiResponse[AdminLoginResponse])
def login(request: AdminLoginRequest) -> ApiResponse[AdminLoginResponse]:
    token = AdminAuthService(get_settings()).login(request)
    return ApiResponse(message="Admin logged in", data=token)


@router.get("/users", response_model=ApiResponse[list[UserAdminResponse]])
def list_users(
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
) -> ApiResponse[list[UserAdminResponse]]:
    users = build_user_service(db).search_users(q)
    message_service = build_message_service(db)
    return ApiResponse(
        data=[
            UserAdminResponse.model_validate(user).model_copy(update={"total_messages": message_service.count_for_user(user.id)})
            for user in users
        ]
    )


@router.post("/users", response_model=ApiResponse[UserAdminResponse])
def create_user(
    request: UserAdminCreate,
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ApiResponse[UserAdminResponse]:
    user = build_user_service(db).create_user(request)
    data = UserAdminResponse.model_validate(user).model_copy(update={"total_messages": 0})
    return ApiResponse(message="User created", data=data)


@router.patch("/users/{user_id}", response_model=ApiResponse[UserAdminResponse])
def update_user(
    user_id: int,
    request: UserAdminUpdate,
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ApiResponse[UserAdminResponse]:
    user = build_user_service(db).update_user(user_id, request)
    total = build_message_service(db).count_for_user(user.id)
    return ApiResponse(message="User updated", data=UserAdminResponse.model_validate(user).model_copy(update={"total_messages": total}))


@router.delete("/users/{user_id}", response_model=ApiResponse[dict[str, bool]])
def delete_user(
    user_id: int,
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ApiResponse[dict[str, bool]]:
    build_user_service(db).delete_user(user_id)
    return ApiResponse(message="User deleted", data={"deleted": True})
