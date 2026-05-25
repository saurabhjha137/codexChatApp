from datetime import datetime, timezone
from sqlalchemy import or_, select
from sqlalchemy.orm import Session
from app.models.user import User
from app.repositories.interfaces import IUserRepository


class UserRepository(IUserRepository):
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.get(User, user_id)

    def get_by_mobile(self, mobile_number: str) -> User | None:
        return self.db.scalar(select(User).where(User.mobile_number == mobile_number))

    def list_all(self) -> list[User]:
        return list(self.db.scalars(select(User).order_by(User.is_online.desc(), User.name.asc())))

    def create(self, name: str, mobile_number: str, is_active: bool = True) -> User:
        user = User(name=name, mobile_number=mobile_number, is_active=is_active)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user_id: int, name: str | None, mobile_number: str | None, is_active: bool | None) -> User | None:
        user = self.get_by_id(user_id)
        if user is None:
            return None
        if name is not None:
            user.name = name
        if mobile_number is not None:
            user.mobile_number = mobile_number
        if is_active is not None:
            user.is_active = is_active
            if not is_active:
                user.is_online = False
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user_id: int) -> bool:
        user = self.get_by_id(user_id)
        if user is None:
            return False
        self.db.delete(user)
        self.db.commit()
        return True

    def search(self, query: str | None) -> list[User]:
        statement = select(User)
        if query:
            pattern = f"%{query.strip()}%"
            statement = statement.where(or_(User.name.ilike(pattern), User.mobile_number.ilike(pattern)))
        return list(self.db.scalars(statement.order_by(User.is_online.desc(), User.name.asc())))

    def set_presence(self, user_id: int, is_online: bool) -> User | None:
        user = self.get_by_id(user_id)
        if user is None:
            return None
        now = datetime.now(timezone.utc)
        user.is_online = is_online
        user.connected_at = now if is_online else user.connected_at
        user.last_seen = now
        self.db.commit()
        self.db.refresh(user)
        return user
