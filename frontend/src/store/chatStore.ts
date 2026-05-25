import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getMessages, getUsers, register } from "../api/client";
import { ChatSocket } from "../api/socket";
import type { ChatMessage, MessageAckItem, NotificationSettings, User, WebSocketEvent } from "../types";
import { getNotificationPermission, showMessageNotification } from "../utils/notificationService";
import { playNotificationSound } from "../utils/soundService";

type ChatState = {
  currentUser: User | null;
  users: User[];
  selectedUserId: number | null;
  messagesByUser: Record<number, ChatMessage[]>;
  nextBeforeByUser: Record<number, number | null>;
  replyTo: ChatMessage | null;
  connected: boolean;
  loading: boolean;
  loadingHistory: boolean;
  error: string | null;
  toast: string | null;
  notificationSettings: NotificationSettings;
  socket: ChatSocket | null;
  login: (name: string, mobileNumber: string) => Promise<void>;
  logout: () => void;
  loadUsers: () => Promise<void>;
  selectUser: (userId: number) => Promise<void>;
  loadOlderMessages: () => Promise<void>;
  sendMessage: (message: string) => void;
  setReplyTo: (message: ChatMessage | null) => void;
  connectSocket: () => void;
  handleSocketEvent: (event: WebSocketEvent) => void;
  markVisibleConversationRead: () => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  clearToast: () => void;
};

function conversationKey(currentUserId: number, message: ChatMessage): number {
  return message.sender_id === currentUserId ? message.receiver_id : message.sender_id;
}

function upsertMessage(messages: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  const existingIndex = messages.findIndex((message) => message.id === incoming.id);
  if (existingIndex >= 0) {
    return messages.map((message) => (message.id === incoming.id ? incoming : message));
  }
  return [...messages, incoming].sort((a, b) => a.id - b.id);
}

function applyAck(messages: ChatMessage[], ack: MessageAckItem): ChatMessage[] {
  return messages.map((message) =>
    message.id === ack.message_id
      ? { ...message, status: ack.status, delivered_at: ack.delivered_at, read_at: ack.read_at }
      : message,
  );
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      selectedUserId: null,
      messagesByUser: {},
      nextBeforeByUser: {},
      replyTo: null,
      connected: false,
      loading: false,
      loadingHistory: false,
      error: null,
      toast: null,
      notificationSettings: { muted: false, browserEnabled: false, permission: getNotificationPermission() },
      socket: null,

      login: async (name, mobileNumber) => {
        set({ loading: true, error: null });
        try {
          const currentUser = await register(name, mobileNumber);
          set({ currentUser, loading: false });
          await get().loadUsers();
          get().connectSocket();
        } catch (error) {
          set({ loading: false, error: error instanceof Error ? error.message : "Login failed" });
        }
      },

      logout: () => {
        get().socket?.disconnect();
        set({
          currentUser: null,
          users: [],
          selectedUserId: null,
          messagesByUser: {},
          nextBeforeByUser: {},
          replyTo: null,
          connected: false,
          socket: null,
          error: null,
        });
      },

      loadUsers: async () => {
        const users = await getUsers();
        set({ users });
      },

      selectUser: async (userId) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;
        set({ selectedUserId: userId, replyTo: null });
        const page = await getMessages(currentUser.id, userId);
        set((state) => ({
          messagesByUser: { ...state.messagesByUser, [userId]: page.items },
          nextBeforeByUser: { ...state.nextBeforeByUser, [userId]: page.next_before_id },
        }));
        get().markVisibleConversationRead();
      },

      loadOlderMessages: async () => {
        const currentUser = get().currentUser;
        const selectedUserId = get().selectedUserId;
        if (!currentUser || !selectedUserId || get().loadingHistory) return;
        const beforeId = get().nextBeforeByUser[selectedUserId];
        if (!beforeId) return;
        set({ loadingHistory: true });
        const page = await getMessages(currentUser.id, selectedUserId, beforeId);
        set((state) => ({
          loadingHistory: false,
          messagesByUser: {
            ...state.messagesByUser,
            [selectedUserId]: [...page.items, ...(state.messagesByUser[selectedUserId] ?? [])],
          },
          nextBeforeByUser: { ...state.nextBeforeByUser, [selectedUserId]: page.next_before_id },
        }));
      },

      sendMessage: (message) => {
        const selectedUserId = get().selectedUserId;
        if (!selectedUserId || !message.trim()) return;
        get().socket?.sendMessage(selectedUserId, message.trim(), get().replyTo?.id ?? null);
        set({ replyTo: null });
      },

      setReplyTo: (message) => set({ replyTo: message }),

      connectSocket: () => {
        const currentUser = get().currentUser;
        if (!currentUser) return;
        const socket = new ChatSocket();
        socket.connect(currentUser.id, {
          onOpen: () => set({ connected: true }),
          onClose: () => set({ connected: false }),
          onReconnect: (attempt) => set({ toast: `Reconnecting realtime chat... attempt ${attempt}` }),
          onEvent: (event) => get().handleSocketEvent(event),
        });
        set({ socket });
      },

      handleSocketEvent: (event) => {
        if (event.type === "USER_ONLINE" || event.type === "USER_OFFLINE") {
          set((state) => {
            const exists = state.users.some((user) => user.id === event.payload.id);
            const users = exists
              ? state.users.map((user) => (user.id === event.payload.id ? event.payload : user))
              : [...state.users, event.payload];
            return {
              users,
              currentUser: state.currentUser?.id === event.payload.id ? event.payload : state.currentUser,
            };
          });
          return;
        }

        if (event.type === "NEW_MESSAGE") {
          console.debug("[websocket] NEW_MESSAGE", event.payload);
          const currentUser = get().currentUser;
          if (!currentUser) return;
          const key = conversationKey(currentUser.id, event.payload);
          const incomingForMe = event.payload.receiver_id === currentUser.id;
          const activeConversation = get().selectedUserId === key;
          set((state) => ({
            messagesByUser: {
              ...state.messagesByUser,
              [key]: upsertMessage(state.messagesByUser[key] ?? [], event.payload),
            },
          }));
          if (incomingForMe) {
            get().socket?.markDelivered([event.payload.id]);
            playNotificationSound(get().notificationSettings, activeConversation);
            showMessageNotification(
              get().notificationSettings,
              get().users.find((user) => user.id === event.payload.sender_id),
              event.payload,
              () => void get().selectUser(key),
            );
            if (activeConversation) get().markVisibleConversationRead();
          }
          return;
        }

        if (event.type === "MESSAGE_DELIVERED" || event.type === "MESSAGE_READ") {
          set((state) => {
            const currentUser = state.currentUser;
            if (!currentUser) return state;
            const messagesByUser = { ...state.messagesByUser };
            for (const ack of event.payload.items) {
              const key = ack.sender_id === currentUser.id ? ack.receiver_id : ack.sender_id;
              messagesByUser[key] = applyAck(messagesByUser[key] ?? [], ack);
            }
            return { messagesByUser };
          });
          return;
        }

        if (event.type === "ERROR") {
          set({ error: event.payload.message, toast: event.payload.message });
        }
      },

      markVisibleConversationRead: () => {
        const currentUser = get().currentUser;
        const selectedUserId = get().selectedUserId;
        if (!currentUser || !selectedUserId) return;
        const unreadIds = (get().messagesByUser[selectedUserId] ?? [])
          .filter((message) => message.receiver_id === currentUser.id && message.status !== "read")
          .map((message) => message.id);
        get().socket?.markRead(unreadIds);
      },

      updateNotificationSettings: (settings) =>
        set((state) => ({ notificationSettings: { ...state.notificationSettings, ...settings } })),

      clearToast: () => set({ toast: null }),
    }),
    {
      name: "lan-chat-session",
      partialize: (state) => ({
        currentUser: state.currentUser,
        notificationSettings: state.notificationSettings,
      }),
    },
  ),
);
