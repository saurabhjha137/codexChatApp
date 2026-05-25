from datetime import datetime, timezone
from app.core.exceptions import NotFoundError, ValidationError
from app.models.message import Message
from app.repositories.interfaces import IMessageRepository, IUserRepository
from app.schemas.message import MessageCreate


class MessageService:
    def __init__(self, messages: IMessageRepository, users: IUserRepository) -> None:
        self.messages = messages
        self.users = users

    def send_message(self, sender_id: int, request: MessageCreate) -> Message:
        if sender_id == request.receiver_id:
            raise ValidationError("Cannot send a message to yourself")
        sender = self.users.get_by_id(sender_id)
        receiver = self.users.get_by_id(request.receiver_id)
        if sender is None:
            raise NotFoundError("Sender not found")
        if receiver is None:
            raise NotFoundError("Receiver not found")
        if not sender.is_active or not receiver.is_active:
            raise ValidationError("Cannot send messages to disabled users")
        if request.reply_to_message_id is not None:
            original = self.messages.get_by_id(request.reply_to_message_id)
            if original is None:
                raise NotFoundError("Reply target not found")
            participant_ids = {original.sender_id, original.receiver_id}
            if sender_id not in participant_ids or request.receiver_id not in participant_ids:
                raise ValidationError("Reply target is outside this conversation")
        return self.messages.create(
            sender_id=sender_id,
            receiver_id=request.receiver_id,
            message=request.message,
            reply_to_message_id=request.reply_to_message_id,
        )

    def get_conversation(self, current_user_id: int, other_user_id: int, limit: int = 50, before_id: int | None = None) -> list[Message]:
        if self.users.get_by_id(current_user_id) is None:
            raise NotFoundError("Current user not found")
        if self.users.get_by_id(other_user_id) is None:
            raise NotFoundError("Conversation user not found")
        return self.messages.conversation(current_user_id, other_user_id, min(limit, 100), before_id)

    def mark_delivered(self, message_ids: list[int], receiver_id: int) -> list[Message]:
        return self.messages.mark_delivered(message_ids, receiver_id, datetime.now(timezone.utc))

    def mark_read(self, message_ids: list[int], reader_id: int) -> list[Message]:
        return self.messages.mark_read(message_ids, reader_id, datetime.now(timezone.utc))

    def count_for_user(self, user_id: int) -> int:
        return self.messages.count_for_user(user_id)
