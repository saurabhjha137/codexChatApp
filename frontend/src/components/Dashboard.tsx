import { useEffect, useState } from "react";
import { useChatStore } from "../store/chatStore";
import { ChatWindow } from "./ChatWindow";
import { Toast } from "./Toast";
import { UserSidebar } from "./UserSidebar";

export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    currentUser,
    users,
    selectedUserId,
    messagesByUser,
    nextBeforeByUser,
    connected,
    loadingHistory,
    notificationSettings,
    replyTo,
    toast,
    logout,
    loadUsers,
    selectUser,
    loadOlderMessages,
    sendMessage,
    connectSocket,
    setReplyTo,
    markVisibleConversationRead,
    updateNotificationSettings,
    clearToast,
  } = useChatStore();

  useEffect(() => {
    void loadUsers();
    if (!connected) connectSocket();
  }, []);

  if (!currentUser) return null;

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;
  const messages = selectedUserId ? messagesByUser[selectedUserId] ?? [] : [];

  return (
    <main className="app-shell h-[100dvh] overflow-hidden">
      <div className="flex h-full">
        <div
          className={`fixed inset-y-0 left-0 z-40 w-80 transition-transform md:static md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <UserSidebar
            currentUser={currentUser}
            users={users}
            selectedUserId={selectedUserId}
            connected={connected}
            notificationSettings={notificationSettings}
            onLogout={logout}
            onNotificationChange={updateNotificationSettings}
            onSelect={(userId) => {
              setSidebarOpen(false);
              void selectUser(userId);
            }}
          />
        </div>
        {sidebarOpen && <button className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}
        <ChatWindow
          currentUser={currentUser}
          selectedUser={selectedUser}
          messages={messages}
          replyTo={replyTo}
          hasMore={Boolean(selectedUserId && nextBeforeByUser[selectedUserId])}
          loadingHistory={loadingHistory}
          onLoadOlder={() => void loadOlderMessages()}
          onMarkRead={markVisibleConversationRead}
          onOpenSidebar={() => setSidebarOpen(true)}
          onReply={setReplyTo}
          onSend={sendMessage}
        />
      </div>
      <Toast message={toast} onClose={clearToast} />
    </main>
  );
}
