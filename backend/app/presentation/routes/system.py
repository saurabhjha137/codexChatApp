from fastapi import APIRouter, Request
from app.schemas.common import ApiResponse
from app.utilities.network import get_local_ip

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/network", response_model=ApiResponse[dict[str, str]])
def network_info(request: Request) -> ApiResponse[dict[str, str]]:
    host = get_local_ip()
    port = request.url.port or 8000
    return ApiResponse(
        data={
            "local_ip": host,
            "backend_url": f"http://{host}:{port}",
            "websocket_url": f"ws://{host}:{port}/ws/{{user_id}}",
        }
    )

