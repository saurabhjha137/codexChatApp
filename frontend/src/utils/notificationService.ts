import type { ChatMessage, NotificationSettings, User } from "../types";
import { unescapeHtml } from "./format";

type AppNotificationPermission = NotificationPermission | "unsupported" | "insecure";

function isLocalhost(): boolean {
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

export function getNotificationPermission(): AppNotificationPermission {
  if (!("Notification" in window)) return "unsupported";
  if (!window.isSecureContext && !isLocalhost()) return "insecure";
  return Notification.permission;
}

export async function requestBrowserNotifications(): Promise<AppNotificationPermission> {
  const current = getNotificationPermission();
  console.debug("[notifications] permission before request", current);
  if (current === "unsupported" || current === "insecure" || current === "granted" || current === "denied") return current;
  const next = await Notification.requestPermission();
  console.debug("[notifications] permission after request", next);
  return next;
}

export function shouldShowBrowserNotification(settings: NotificationSettings, incomingForCurrentUser: boolean): boolean {
  const permission = getNotificationPermission();
  const hidden = document.visibilityState !== "visible";
  const allowed = settings.browserEnabled && permission === "granted" && hidden && incomingForCurrentUser;
  console.debug("[notifications] eligibility", {
    browserEnabled: settings.browserEnabled,
    permission,
    hidden,
    incomingForCurrentUser,
    allowed,
  });
  return allowed;
}

export function showMessageNotification(
  settings: NotificationSettings,
  sender: User | undefined,
  message: ChatMessage,
  onClick: () => void,
): void {
  if (!shouldShowBrowserNotification(settings, true)) return;
  const title = sender?.name ? `${sender.name} sent a message` : "New LAN Chat message";
  const notification = new Notification(title, {
    body: unescapeHtml(message.message).slice(0, 140),
    icon: "/chat-icon.svg",
    badge: "/chat-icon.svg",
    tag: `lan-chat-${message.id}`,
    data: { created_at: message.created_at },
    requireInteraction: false,
  });
  console.debug("[notifications] fired", { messageId: message.id, senderId: message.sender_id });
  notification.onclick = () => {
    window.focus();
    onClick();
    notification.close();
  };
}
