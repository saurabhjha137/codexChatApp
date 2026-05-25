import asyncio
import logging
from dataclasses import dataclass
from fastapi import WebSocket

logger = logging.getLogger(__name__)


@dataclass
class ClientConnection:
    user_id: int
    websocket: WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._active: dict[int, ClientConnection] = {}
        self._lock = asyncio.Lock()

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            stale = self._active.get(user_id)
            if stale is not None:
                await self._safe_close(stale.websocket, code=4000)
            self._active[user_id] = ClientConnection(user_id=user_id, websocket=websocket)
            logger.info("WebSocket connected for user_id=%s", user_id)

    async def disconnect(self, user_id: int, websocket: WebSocket | None = None) -> bool:
        async with self._lock:
            current = self._active.get(user_id)
            if current is None:
                return False
            if websocket is not None and current.websocket is not websocket:
                return False
            self._active.pop(user_id, None)
            logger.info("WebSocket disconnected for user_id=%s", user_id)
            return True

    def is_online(self, user_id: int) -> bool:
        return user_id in self._active

    async def send_to_user(self, user_id: int, payload: dict) -> None:
        connection = self._active.get(user_id)
        if connection is None:
            return
        try:
            await connection.websocket.send_json(payload)
        except RuntimeError:
            await self.disconnect(user_id, connection.websocket)

    async def broadcast(self, payload: dict) -> None:
        for user_id in list(self._active.keys()):
            await self.send_to_user(user_id, payload)

    async def heartbeat(self, user_id: int, websocket: WebSocket, interval_seconds: int) -> None:
        while self._active.get(user_id) is not None:
            await asyncio.sleep(interval_seconds)
            current = self._active.get(user_id)
            if current is None or current.websocket is not websocket:
                break
            try:
                await websocket.send_json({"type": "HEARTBEAT", "payload": {"user_id": user_id}})
            except RuntimeError:
                await self.disconnect(user_id, websocket)
                break

    async def shutdown(self) -> None:
        for connection in list(self._active.values()):
            await self._safe_close(connection.websocket, code=1001)
        self._active.clear()

    async def _safe_close(self, websocket: WebSocket, code: int) -> None:
        try:
            await websocket.close(code=code)
        except RuntimeError:
            pass


manager = ConnectionManager()
