export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type User = {
  id: number;
  name: string;
  mobile_number: string;
  is_online: boolean;
  is_active: boolean;
  last_seen: string | null;
  connected_at: string | null;
  created_at: string;
};

export type ChatMessage = {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  reply_to_message_id: number | null;
  reply_preview: string | null;
  status: "sent" | "delivered" | "read";
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
};

export type MessagePage = {
  items: ChatMessage[];
  next_before_id: number | null;
};

export type MessageAckItem = {
  message_id: number;
  sender_id: number;
  receiver_id: number;
  status: "sent" | "delivered" | "read";
  delivered_at: string | null;
  read_at: string | null;
};

export type AdminUser = User & {
  total_messages: number;
};

export type WebSocketEvent =
  | { type: "USER_ONLINE"; payload: User }
  | { type: "USER_OFFLINE"; payload: User }
  | { type: "NEW_MESSAGE"; payload: ChatMessage }
  | { type: "MESSAGE_DELIVERED"; payload: { items: MessageAckItem[] } }
  | { type: "MESSAGE_READ"; payload: { items: MessageAckItem[] } }
  | { type: "HEARTBEAT"; payload: { user_id: number } }
  | { type: "PONG"; payload: Record<string, never> }
  | { type: "ERROR"; payload: { message: string } };

export type NotificationSettings = {
  muted: boolean;
  browserEnabled: boolean;
  permission: NotificationPermission | "unsupported" | "insecure";
};
