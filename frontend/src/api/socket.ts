import type { WebSocketEvent } from "../types";

export type SocketHandlers = {
  onEvent: (event: WebSocketEvent) => void;
  onOpen: () => void;
  onClose: () => void;
  onReconnect?: (attempt: number) => void;
};

function inferWebSocketBaseUrl(): string {
  if (import.meta.env.VITE_WS_BASE_URL) return import.meta.env.VITE_WS_BASE_URL;
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL.replace(/^http/, "ws");
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "ws://localhost:8000";
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.hostname}:8000`;
}

export class ChatSocket {
  private socket: WebSocket | null = null;
  private pingTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private manuallyClosed = false;
  private userId: number | null = null;
  private handlers: SocketHandlers | null = null;

  connect(userId: number, handlers: SocketHandlers): void {
    this.disconnect();
    this.manuallyClosed = false;
    this.userId = userId;
    this.handlers = handlers;
    this.open(userId, handlers);
  }

  private open(userId: number, handlers: SocketHandlers): void {
    const wsUrl = `${inferWebSocketBaseUrl()}/ws/${userId}`;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      handlers.onOpen();
      this.pingTimer = window.setInterval(() => this.send({ type: "PING", payload: {} }), 20000);
    };
    this.socket.onmessage = (message) => {
      const event = JSON.parse(message.data) as WebSocketEvent;
      console.debug("[websocket] event", event.type, event.payload);
      handlers.onEvent(event);
    };
    this.socket.onclose = () => {
      this.clearPing();
      handlers.onClose();
      if (!this.manuallyClosed) {
        this.scheduleReconnect();
      }
    };
    this.socket.onerror = () => {
      this.socket?.close();
    };
  }

  sendMessage(receiverId: number, message: string, replyToMessageId: number | null): void {
    this.send({ type: "NEW_MESSAGE", payload: { receiver_id: receiverId, message, reply_to_message_id: replyToMessageId } });
  }

  markDelivered(messageIds: number[]): void {
    if (messageIds.length > 0) this.send({ type: "MESSAGE_DELIVERED", payload: { message_ids: messageIds } });
  }

  markRead(messageIds: number[]): void {
    if (messageIds.length > 0) this.send({ type: "MESSAGE_READ", payload: { message_ids: messageIds } });
  }

  disconnect(): void {
    this.manuallyClosed = true;
    this.clearPing();
    this.clearReconnect();
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      this.socket.close();
    }
    this.socket = null;
  }

  private send(payload: object): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  private clearPing(): void {
    if (this.pingTimer !== null) {
      window.clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.userId === null || this.handlers === null || this.reconnectTimer !== null) return;
    this.reconnectAttempts += 1;
    const delay = Math.min(30000, 1000 * 2 ** Math.min(this.reconnectAttempts, 5));
    this.handlers.onReconnect?.(this.reconnectAttempts);
    console.debug("[websocket] reconnect scheduled", { attempt: this.reconnectAttempts, delay });
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (this.userId !== null && this.handlers !== null && !this.manuallyClosed) {
        this.open(this.userId, this.handlers);
      }
    }, delay);
  }

  private clearReconnect(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
