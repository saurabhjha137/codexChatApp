import { API_BASE_URL } from "./http";
import type { WebSocketEvent } from "../types";

export type SocketHandlers = {
  onEvent: (event: WebSocketEvent) => void;
  onOpen: () => void;
  onClose: () => void;
};

export class ChatSocket {
  private socket: WebSocket | null = null;
  private pingTimer: number | null = null;

  connect(userId: number, handlers: SocketHandlers): void {
    this.disconnect();
    const wsUrl = API_BASE_URL.replace(/^http/, "ws") + `/ws/${userId}`;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
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
    this.clearPing();
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
}
