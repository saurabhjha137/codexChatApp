from datetime import datetime
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session
from app.models.message import Message
from app.repositories.interfaces import IMessageRepository


class MessageRepository(IMessageRepository):
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, sender_id: int, receiver_id: int, message: str, reply_to_message_id: int | None = None) -> Message:
        record = Message(
            sender_id=sender_id,
            receiver_id=receiver_id,
            message=message,
            reply_to_message_id=reply_to_message_id,
            status="sent",
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def conversation(self, user_a: int, user_b: int, limit: int, before_id: int | None = None) -> list[Message]:
        statement = (
            select(Message)
            .where(
                or_(
                    (Message.sender_id == user_a) & (Message.receiver_id == user_b),
                    (Message.sender_id == user_b) & (Message.receiver_id == user_a),
                )
            )
            .order_by(Message.id.desc())
            .limit(limit)
        )
        if before_id is not None:
            statement = statement.where(Message.id < before_id)
        return list(reversed(list(self.db.scalars(statement))))

    def get_by_id(self, message_id: int) -> Message | None:
        return self.db.get(Message, message_id)

    def mark_delivered(self, message_ids: list[int], receiver_id: int, delivered_at: datetime) -> list[Message]:
        records = list(
            self.db.scalars(
                select(Message).where(
                    and_(
                        Message.id.in_(message_ids),
                        Message.receiver_id == receiver_id,
                        Message.delivered_at.is_(None),
                    )
                )
            )
        )
        for record in records:
            record.status = "delivered"
            record.delivered_at = delivered_at
        self.db.commit()
        for record in records:
            self.db.refresh(record)
        return records

    def mark_read(self, message_ids: list[int], reader_id: int, read_at: datetime) -> list[Message]:
        records = list(
            self.db.scalars(
                select(Message).where(
                    and_(
                        Message.id.in_(message_ids),
                        Message.receiver_id == reader_id,
                        Message.read_at.is_(None),
                    )
                )
            )
        )
        for record in records:
            record.status = "read"
            record.delivered_at = record.delivered_at or read_at
            record.read_at = read_at
        self.db.commit()
        for record in records:
            self.db.refresh(record)
        return records

    def count_for_user(self, user_id: int) -> int:
        return int(
            self.db.scalar(
                select(func.count(Message.id)).where(or_(Message.sender_id == user_id, Message.receiver_id == user_id))
            )
            or 0
        )
