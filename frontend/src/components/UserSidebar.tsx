import { Bell, BellOff, LogOut, Search, Shield, Wifi, WifiOff } from "lucide-react";
import type { NotificationSettings, User } from "../types";
import { formatDateTime } from "../utils/format";
import { requestBrowserNotifications } from "../utils/notificationService";
import { unlockNotificationSound } from "../utils/soundService";
import { Avatar } from "./Avatar";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  currentUser: User;
  users: User[];
  selectedUserId: number | null;
  connected: boolean;
  notificationSettings: NotificationSettings;
  onSelect: (userId: number) => void;
  onLogout: () => void;
  onNotificationChange: (settings: Partial<NotificationSettings>) => void;
};

export function UserSidebar({
  currentUser,
  users,
  selectedUserId,
  connected,
  notificationSettings,
  onSelect,
  onLogout,
  onNotificationChange,
}: Props) {
  const others = users.filter((user) => user.id !== currentUser.id && user.is_active);
  const notificationPermission = notificationSettings.permission ?? "default";

  async function enableBrowserNotifications() {
    const permission = await requestBrowserNotifications();
    onNotificationChange({ browserEnabled: permission === "granted", permission });
  }

  return (
    <aside className="app-panel flex h-full w-full flex-col border-r">
      <div className="app-border border-b p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={currentUser.name} online={currentUser.is_online} />
            <div className="min-w-0">
              <p className="text-primary truncate text-sm font-semibold">{currentUser.name}</p>
              <p className="text-muted truncate text-xs">{currentUser.mobile_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button className="icon-button" onClick={onLogout} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="app-panel-soft mb-3 flex items-center justify-between rounded-lg px-3 py-2 text-xs">
          <span className="flex items-center gap-2">
            {connected ? <Wifi size={15} style={{ color: "var(--success)" }} /> : <WifiOff size={15} style={{ color: "var(--danger)" }} />}
            {connected ? "Realtime connected" : "Disconnected"}
          </span>
          <a className="flex items-center gap-1 font-medium" style={{ color: "var(--secondary)" }} href="/admin">
            <Shield size={14} />
            Admin
          </a>
        </div>

        <div className="flex gap-2">
          <button
            className="toolbar-button"
            onClick={() => {
              unlockNotificationSound();
              onNotificationChange({ muted: !notificationSettings.muted });
            }}
            title={notificationSettings.muted ? "Unmute sounds" : "Mute sounds"}
          >
            {notificationSettings.muted ? <BellOff size={16} /> : <Bell size={16} />}
            Sound
          </button>
          <button className="toolbar-button" onClick={enableBrowserNotifications} title="Enable browser notifications">
            <Bell size={16} />
            {notificationPermission === "insecure"
              ? "HTTPS"
              : notificationPermission === "denied"
                ? "Denied"
                : notificationSettings.browserEnabled
                  ? "On"
                  : "Browser"}
          </button>
        </div>
        <div className="text-muted mt-2 rounded-lg px-2 py-1 text-xs" style={{ background: "color-mix(in srgb, var(--surface-soft) 70%, transparent)" }}>
          Notifications: {notificationSettings.muted ? "sound muted" : "sound on"} · Browser {notificationPermission}
        </div>
        {notificationPermission === "insecure" && (
          <p className="text-muted mt-2 text-xs">Browser notifications need HTTPS or localhost. Sound notifications still work on LAN HTTP.</p>
        )}
        {notificationPermission === "denied" && (
          <p className="text-muted mt-2 text-xs">Notifications are blocked. Re-enable them from your browser site settings.</p>
        )}
      </div>

      <div className="app-border border-b p-3">
        <div className="input-control flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
          <Search size={16} />
          <span>People</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {others.map((user) => (
            <button
              key={user.id}
              className={`w-full rounded-lg px-3 py-3 text-left transition ${
                selectedUserId === user.id ? "app-panel-soft shadow-lg ring-1" : "hover:bg-[var(--surface-hover)]"
              }`}
              style={selectedUserId === user.id ? { boxShadow: "var(--glow)", borderColor: "var(--primary)" } : undefined}
              onClick={() => onSelect(user.id)}
            >
              <div className="flex items-center gap-3">
                <Avatar name={user.name} online={user.is_online} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-primary truncate text-sm font-medium">{user.name}</p>
                  <p className="text-muted truncate text-xs">
                    {user.is_online ? "Available now" : `Last seen ${formatDateTime(user.last_seen)}`}
                  </p>
                </div>
              </div>
            </button>
          ))}
          {others.length === 0 && <p className="text-muted px-2 py-4 text-sm">No active users are registered yet.</p>}
        </div>
      </div>
    </aside>
  );
}
