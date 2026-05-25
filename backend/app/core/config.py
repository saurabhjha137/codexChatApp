from functools import lru_cache
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "LAN Chat"
    app_env: str = "local"
    api_prefix: str = ""
    database_url: str = "sqlite:///./lan_chat.db"
    cors_origins: str = "*"
    trusted_hosts: str = "*"
    frontend_url: str = "http://localhost:5173"
    log_level: str = "INFO"
    rate_limit_per_minute: int = 120
    websocket_heartbeat_seconds: int = 25
    admin_username: str = "admin"
    admin_password: str = "change-me-admin"
    admin_token_secret: str = "change-me-local-secret"
    admin_token_ttl_minutes: int = 480

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.app_env.lower() in {"production", "prod"}:
            insecure = [
                name
                for name, value in {
                    "ADMIN_PASSWORD": self.admin_password,
                    "ADMIN_TOKEN_SECRET": self.admin_token_secret,
                }.items()
                if value.startswith("change-me-") or value.startswith("replace-with-")
            ]
            if insecure:
                raise ValueError(f"Production requires secure values for: {', '.join(insecure)}")
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def trusted_host_list(self) -> list[str]:
        if self.trusted_hosts.strip() == "*":
            return ["*"]
        return [host.strip() for host in self.trusted_hosts.split(",") if host.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
