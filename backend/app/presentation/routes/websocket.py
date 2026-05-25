import asyncio
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError as PydanticValidationError
from app.core.config import get_settings
from app.core.exceptions import AppError
from app.database.session import SessionLocal
from app.schemas.message import MessageCreate, MessageResponse
from app.schemas.user import UserResponse
from app.services.dependencies import build_message_service, build_user_service
from app.websocket.events import WebSocketEventType
from app.websocket.manager import manager

logger = logging.getLogger(__name__)
router = APIRouter(tags=["websocket"])


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int) -> None:
    settings = get_settings()
    with SessionLocal() as db:
        user_service = build_user_service(db)
        user_service.require_user(user_id)

    await manager.connect(user_id, websocket)
    heartbeat_task = asyncio.create_task(manager.heartbeat(user_id, websocket, settings.websocket_heartbeat_seconds))

    try:
        presence_payload = await _mark_presence(user_id, True)
        await manager.broadcast({"type": WebSocketEventType.USER_ONLINE, "payload": presence_payload})

        while True:
            raw = await websocket.receive_json()
            event_type = raw.get("type")
            if event_type in {"ping", WebSocketEventType.PING}:
                await websocket.send_json({"type": WebSocketEventType.PONG, "payload": {}})
                continue
            if event_type in {"message", WebSocketEventType.NEW_MESSAGE}:
                await _handle_message(sender_id=user_id, payload=raw.get("payload") or {})
                continue
            if event_type == WebSocketEventType.MESSAGE_DELIVERED:
                await _handle_ack(user_id=user_id, payload=raw.get("payload") or {}, ack_type=WebSocketEventType.MESSAGE_DELIVERED)
                continue
            if event_type == WebSocketEventType.MESSAGE_READ:
                await _handle_ack(user_id=user_id, payload=raw.get("payload") or {}, ack_type=WebSocketEventType.MESSAGE_READ)
                continue
            await websocket.send_json({"type": WebSocketEventType.ERROR, "payload": {"message": "Unsupported event type"}})
    except WebSocketDisconnect:
        logger.info("Client disconnected user_id=%s", user_id)
    except PydanticValidationError as exc:
        await websocket.send_json({"type": WebSocketEventType.ERROR, "payload": {"message": exc.errors()[0]["msg"]}})
    except AppError as exc:
        await websocket.send_json({"type": WebSocketEventType.ERROR, "payload": {"message": exc.message}})
    except Exception:
        logger.exception("Unexpected WebSocket failure for user_id=%s", user_id)
        try:
            await websocket.send_json({"type": WebSocketEventType.ERROR, "payload": {"message": "Internal server error"}})
        except RuntimeError:
            pass
    finally:
        heartbeat_task.cancel()
        disconnected = await manager.disconnect(user_id, websocket)
        if disconnected:
            presence_payload = await _mark_presence(user_id, False)
            await manager.broadcast({"type": WebSocketEventType.USER_OFFLINE, "payload": presence_payload})


async def _handle_message(sender_id: int, payload: dict) -> None:
    request = MessageCreate(**payload)
    with SessionLocal() as db:
        record = build_message_service(db).send_message(sender_id=sender_id, request=request)
        preview = record.reply_to.message[:140] if record.reply_to else None
        message_payload = MessageResponse.model_validate(record).model_copy(update={"reply_preview": preview}).model_dump(mode="json")
    event = {"type": WebSocketEventType.NEW_MESSAGE, "payload": message_payload}
    await manager.send_to_user(sender_id, event)
    await manager.send_to_user(request.receiver_id, event)

    if manager.is_online(request.receiver_id):
        await _handle_ack(
            user_id=request.receiver_id,
            payload={"message_ids": [record.id]},
            ack_type=WebSocketEventType.MESSAGE_DELIVERED,
        )


async def _handle_ack(user_id: int, payload: dict, ack_type: WebSocketEventType) -> None:
    message_ids = [int(message_id) for message_id in payload.get("message_ids", []) if int(message_id) > 0]
    if not message_ids:
        return
    with SessionLocal() as db:
        service = build_message_service(db)
        records = (
            service.mark_delivered(message_ids=message_ids, receiver_id=user_id)
            if ack_type == WebSocketEventType.MESSAGE_DELIVERED
            else service.mark_read(message_ids=message_ids, reader_id=user_id)
        )
        events = [
            {
                "message_id": record.id,
                "sender_id": record.sender_id,
                "receiver_id": record.receiver_id,
                "status": record.status,
                "delivered_at": record.delivered_at.isoformat() if record.delivered_at else None,
                "read_at": record.read_at.isoformat() if record.read_at else None,
            }
            for record in records
        ]
    if not events:
        return
    sender_ids = {event["sender_id"] for event in events}
    for sender_id in sender_ids:
        await manager.send_to_user(sender_id, {"type": ack_type, "payload": {"items": events}})
    await manager.send_to_user(user_id, {"type": ack_type, "payload": {"items": events}})


async def _mark_presence(user_id: int, is_online: bool) -> dict:
    with SessionLocal() as db:
        user = build_user_service(db).mark_online(user_id) if is_online else build_user_service(db).mark_offline(user_id)
        return UserResponse.model_validate(user).model_dump(mode="json")
