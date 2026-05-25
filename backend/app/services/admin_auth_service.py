import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone
from app.core.config import Settings
from app.core.exceptions import UnauthorizedError
from app.schemas.admin import AdminLoginRequest, AdminLoginResponse


class AdminAuthService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def login(self, request: AdminLoginRequest) -> AdminLoginResponse:
        valid_username = hmac.compare_digest(request.username, self.settings.admin_username)
        valid_password = hmac.compare_digest(request.password, self.settings.admin_password)
        if not (valid_username and valid_password):
            raise UnauthorizedError("Invalid admin credentials")
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=self.settings.admin_token_ttl_minutes)
        token = self._sign({"sub": request.username, "exp": int(expires_at.timestamp())})
        return AdminLoginResponse(token=token, expires_at=expires_at)

    def verify(self, token: str) -> None:
        try:
            payload_part, signature = token.split(".", 1)
        except ValueError as exc:
            raise UnauthorizedError("Invalid admin token") from exc
        expected = self._signature(payload_part)
        if not hmac.compare_digest(signature, expected):
            raise UnauthorizedError("Invalid admin token")
        payload = json.loads(base64.urlsafe_b64decode(payload_part.encode()).decode())
        if int(payload.get("exp", 0)) < int(datetime.now(timezone.utc).timestamp()):
            raise UnauthorizedError("Admin token expired")

    def _sign(self, payload: dict) -> str:
        payload_part = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode()
        return f"{payload_part}.{self._signature(payload_part)}"

    def _signature(self, payload_part: str) -> str:
        digest = hmac.new(self.settings.admin_token_secret.encode(), payload_part.encode(), hashlib.sha256).digest()
        return base64.urlsafe_b64encode(digest).decode()
