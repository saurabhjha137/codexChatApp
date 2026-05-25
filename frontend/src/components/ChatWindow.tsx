import { FormEvent, useEffect, useRef, useState } from "react";
import { Check, CheckCheck, CornerUpLeft, Menu, Send, Smile, X } from "lucide-react";
import type { ChatMessage, User } from "../types";
import { formatTime, unescapeHtml } from "../utils/format";
import { Avatar } from "./Avatar";
import { EmojiPicker } from "./EmojiPicker";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  currentUser: User;
  selectedUser: User | null;
  messages: ChatMessage[];
  replyTo: ChatMessage | null;
  hasMore: boolean;
  loadingHistory: boolean;
  onSend: (message: string) => void;
  onReply: (message: ChatMessage | null) => void;
  onLoadOlder: () => void;
  onOpenSidebar: () => void;
  onMarkRead: () => void;
};

function StatusTicks({ message }: { message: ChatMessage }) {
  if (message.status === "read") return <CheckCheck size={15} style={{ color: "var(--warning)" }} />;
  if (message.status === "delivered") return <CheckCheck size={15} style={{ color: "var(--warning)" }} />;
  return <Check size={15} style={{ color: "var(--warning)" }} />;
}

export function ChatWindow({
  currentUser,
  selectedUser,
  messages,
  replyTo,
  hasMore,
  loadingHistory,
  onSend,
  onReply,
  onLoadOlder,
  onOpenSidebar,
  onMarkRead,
}: Props) {
  const [draft, setDraft] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    onMarkRead();
  }, [messages.length, selectedUser?.id]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    onSend(draft);
    setDraft("");
    setShowEmoji(false);
  }

  function scrollToMessage(messageId: number) {
    messageRefs.current[messageId]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (!selectedUser) {
    return (
      <section className="flex h-full flex-1 flex-col">
        <header className="app-panel app-border flex items-center gap-3 border-b px-4 py-3 md:hidden">
          <button className="icon-button" onClick={onOpenSidebar} title="Open people">
            <Menu size={20} />
          </button>
          <span className="font-semibold">LAN Chat</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <div>
            <div className="app-panel-soft mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ color: "var(--secondary)", boxShadow: "var(--glow)" }}>
              <Send size={24} />
            </div>
            <h2 className="text-primary text-xl font-semibold">Select a conversation</h2>
            <p className="text-muted mt-2 max-w-sm text-sm">Choose a teammate from the sidebar to start messaging.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full flex-1 flex-col">
      <header className="app-panel app-border flex items-center justify-between border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button className="icon-button md:hidden" onClick={onOpenSidebar} title="Open people">
            <Menu size={20} />
          </button>
          <Avatar name={selectedUser.name} online={selectedUser.is_online} />
          <div className="min-w-0">
            <h2 className="text-primary truncate font-semibold">{selectedUser.name}</h2>
            <p className="text-muted text-xs">{selectedUser.is_online ? "Available now" : "Offline"}</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-5">
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          {hasMore && (
            <button className="app-panel-soft mx-auto rounded-md px-3 py-2 text-xs" disabled={loadingHistory} onClick={onLoadOlder}>
              {loadingHistory ? "Loading..." : "Load older messages"}
            </button>
          )}

          {messages.map((message) => {
            const mine = message.sender_id === currentUser.id;
            return (
              <div
                key={message.id}
                ref={(element) => {
                  messageRefs.current[message.id] = element;
                }}
                className={`group flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[86%] sm:max-w-[74%] ${mine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <div
                    className={`rounded-2xl px-4 py-2 transition-transform duration-150 group-hover:-translate-y-0.5 ${
                      mine ? "bubble-out rounded-br-md" : "bubble-in rounded-bl-md"
                    }`}
                  >
                    {message.reply_to_message_id && (
                      <button
                        className="reply-preview mb-2 block w-full rounded-md px-3 py-2 text-left text-xs"
                        onClick={() => scrollToMessage(message.reply_to_message_id!)}
                        type="button"
                      >
                        {message.reply_preview ? unescapeHtml(message.reply_preview) : "Original message"}
                      </button>
                    )}
                    <p className="break-words text-sm leading-6">{unescapeHtml(message.message)}</p>
                    <div className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${mine ? "bubble-meta-out" : "bubble-meta-in"}`}>
                      <span>{formatTime(message.created_at)}</span>
                      {mine && <StatusTicks message={message} />}
                    </div>
                  </div>
                  <button
                    className="text-muted hidden items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-[var(--surface-hover)] hover:text-[var(--text)] group-hover:flex"
                    onClick={() => onReply(message)}
                    type="button"
                  >
                    <CornerUpLeft size={13} />
                    Reply
                  </button>
                </div>
              </div>
            );
          })}
          {messages.length === 0 && (
            <div className="py-10 text-center">
              <div className="skeleton mx-auto mb-4 h-16 w-16 rounded-2xl" />
              <p className="text-secondary text-sm">No messages yet. Say hello.</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={submit} className="app-panel app-border sticky bottom-0 border-t p-3 sm:p-4">
        <div className="mx-auto max-w-4xl">
          {replyTo && (
            <div className="app-panel-soft mb-2 flex items-center justify-between rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }}>
              <span className="min-w-0 truncate">Replying to: {unescapeHtml(replyTo.message)}</span>
              <button className="icon-button h-7 w-7" onClick={() => onReply(null)} type="button" title="Cancel reply">
                <X size={15} />
              </button>
            </div>
          )}
          <div className="relative flex gap-2">
            <button className="icon-button h-10 w-10" onClick={() => setShowEmoji((value) => !value)} type="button" title="Emoji">
              <Smile size={18} />
            </button>
            {showEmoji && (
              <div className="absolute bottom-12 left-0 z-20">
                <EmojiPicker onSelect={(emoji) => setDraft((value) => `${value}${emoji}`)} />
              </div>
            )}
            <input
              className="input-control min-w-0 flex-1 rounded-lg px-3 py-2 text-sm"
              maxLength={2000}
              placeholder={`Message ${selectedUser.name}`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button className="primary-button flex h-10 w-10 items-center justify-center rounded-lg disabled:opacity-50" disabled={!draft.trim()} title="Send" type="submit">
              <Send size={18} />
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
