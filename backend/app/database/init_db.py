from app.database.base import Base
from app.database.migrations import run_migrations
from app.database.session import engine
from app.models.message import Message
from app.models.user import User


def init_db() -> None:
    _ = (User, Message)
    Base.metadata.create_all(bind=engine)
    run_migrations(engine)
