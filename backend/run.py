import os
import uvicorn
from app.utilities.network import get_local_ip


if __name__ == "__main__":
    ip = get_local_ip()
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("APP_ENV", "local").lower() in {"local", "development", "dev"}
    print(f"Backend URL: http://{ip}:{port}")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=reload)
