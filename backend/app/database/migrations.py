import logging
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


def run_migrations(engine: Engine) -> None:
    """Small idempotent SQLite migrations for local-first deployments."""
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    with engine.begin() as connection:
        user_columns = {column["name"] for column in inspector.get_columns("users")}
        if "is_active" not in user_columns:
            logger.info("Migrating users: adding is_active")
            connection.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1"))

        if "messages" not in inspector.get_table_names():
            return

        message_columns = {column["name"] for column in inspector.get_columns("messages")}
        additions = {
            "reply_to_message_id": "ALTER TABLE messages ADD COLUMN reply_to_message_id INTEGER NULL",
            "status": "ALTER TABLE messages ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'sent'",
            "delivered_at": "ALTER TABLE messages ADD COLUMN delivered_at DATETIME NULL",
            "read_at": "ALTER TABLE messages ADD COLUMN read_at DATETIME NULL",
        }
        for column_name, ddl in additions.items():
            if column_name not in message_columns:
                logger.info("Migrating messages: adding %s", column_name)
                connection.execute(text(ddl))

        connection.execute(
            text("CREATE INDEX IF NOT EXISTS ix_messages_conversation_created ON messages(sender_id, receiver_id, created_at)")
        )
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_messages_reply_to ON messages(reply_to_message_id)"))
