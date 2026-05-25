from sqlalchemy.orm import Session
from app.repositories.message_repository import MessageRepository
from app.repositories.user_repository import UserRepository
from app.services.message_service import MessageService
from app.services.user_service import UserService


def build_user_service(db: Session) -> UserService:
    return UserService(UserRepository(db))


def build_message_service(db: Session) -> MessageService:
    users = UserRepository(db)
    messages = MessageRepository(db)
    return MessageService(messages=messages, users=users)

