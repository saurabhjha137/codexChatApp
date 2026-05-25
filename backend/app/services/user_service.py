from app.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from app.models.user import User
from app.repositories.interfaces import IUserRepository
from app.schemas.user import RegisterRequest, UserAdminCreate, UserAdminUpdate


class UserService:
    def __init__(self, users: IUserRepository) -> None:
        self.users = users

    def register_or_login(self, request: RegisterRequest) -> User:
        existing = self.users.get_by_mobile(request.mobile_number)
        if existing is not None:
            if not existing.is_active:
                raise ForbiddenError("This user is disabled")
            return existing
        return self.users.create(name=request.name, mobile_number=request.mobile_number)

    def list_users(self) -> list[User]:
        return self.users.list_all()

    def search_users(self, query: str | None = None) -> list[User]:
        return self.users.search(query)

    def require_user(self, user_id: int) -> User:
        user = self.users.get_by_id(user_id)
        if user is None:
            raise NotFoundError("User not found")
        if not user.is_active:
            raise ForbiddenError("This user is disabled")
        return user

    def create_user(self, request: UserAdminCreate) -> User:
        if self.users.get_by_mobile(request.mobile_number) is not None:
            raise ValidationError("Mobile number already exists")
        return self.users.create(request.name, request.mobile_number, request.is_active)

    def update_user(self, user_id: int, request: UserAdminUpdate) -> User:
        if request.mobile_number is not None:
            existing = self.users.get_by_mobile(request.mobile_number)
            if existing is not None and existing.id != user_id:
                raise ValidationError("Mobile number already exists")
        user = self.users.update(user_id, request.name, request.mobile_number, request.is_active)
        if user is None:
            raise NotFoundError("User not found")
        return user

    def delete_user(self, user_id: int) -> None:
        if not self.users.delete(user_id):
            raise NotFoundError("User not found")

    def mark_online(self, user_id: int) -> User:
        user = self.users.set_presence(user_id, True)
        if user is None:
            raise NotFoundError("User not found")
        return user

    def mark_offline(self, user_id: int) -> User:
        user = self.users.set_presence(user_id, False)
        if user is None:
            raise NotFoundError("User not found")
        return user
