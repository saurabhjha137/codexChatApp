from abc import ABC, abstractmethod
from datetime import datetime
from app.models.message import Message
from app.models.user import User


class IUserRepository(ABC):
    @abstractmethod
    def get_by_id(self, user_id: int) -> User | None:
        raise NotImplementedError

    @abstractmethod
    def get_by_mobile(self, mobile_number: str) -> User | None:
        raise NotImplementedError

    @abstractmethod
    def list_all(self) -> list[User]:
        raise NotImplementedError

    @abstractmethod
    def create(self, name: str, mobile_number: str, is_active: bool = True) -> User:
        raise NotImplementedError

    @abstractmethod
    def update(self, user_id: int, name: str | None, mobile_number: str | None, is_active: bool | None) -> User | None:
        raise NotImplementedError

    @abstractmethod
    def delete(self, user_id: int) -> bool:
        raise NotImplementedError

    @abstractmethod
    def search(self, query: str | None) -> list[User]:
        raise NotImplementedError

    @abstractmethod
    def set_presence(self, user_id: int, is_online: bool) -> User | None:
        raise NotImplementedError


class IMessageRepository(ABC):
    @abstractmethod
    def create(self, sender_id: int, receiver_id: int, message: str, reply_to_message_id: int | None = None) -> Message:
        raise NotImplementedError

    @abstractmethod
    def conversation(self, user_a: int, user_b: int, limit: int, before_id: int | None = None) -> list[Message]:
        raise NotImplementedError

    @abstractmethod
    def get_by_id(self, message_id: int) -> Message | None:
        raise NotImplementedError

    @abstractmethod
    def mark_delivered(self, message_ids: list[int], receiver_id: int, delivered_at: datetime) -> list[Message]:
        raise NotImplementedError

    @abstractmethod
    def mark_read(self, message_ids: list[int], reader_id: int, read_at: datetime) -> list[Message]:
        raise NotImplementedError

    @abstractmethod
    def count_for_user(self, user_id: int) -> int:
        raise NotImplementedError
