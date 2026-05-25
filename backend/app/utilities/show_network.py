from app.utilities.network import get_local_ip


def main() -> None:
    ip = get_local_ip()
    print(f"Local IP: {ip}")
    print(f"Backend URL: http://{ip}:8000")
    print(f"Frontend URL: http://{ip}:5173")
    print(f"WebSocket URL: ws://{ip}:8000/ws/{{user_id}}")


if __name__ == "__main__":
    main()

