import uvicorn
from app.utilities.network import get_local_ip


if __name__ == "__main__":
    ip = get_local_ip()
    print(f"LAN backend URL: http://{ip}:8000")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

