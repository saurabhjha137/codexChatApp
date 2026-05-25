from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "LAN Chat"
    app_env: str = "local"
    api_prefix: str = ""
    database_url: str = "sqlite:///./lan_chat.db"
    cors_origins: str = "*"
    log_level: str = "INFO"
    rate_limit_per_minute: int = 120
    websocket_heartbeat_seconds: int = 25
    admin_username: str = "admin"
    admin_password: str = "change-me-admin"
    admin_token_secret: str = "change-me-local-secret"
    admin_token_ttl_minutes: int = 480

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
