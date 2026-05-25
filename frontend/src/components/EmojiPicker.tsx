const emojiGroups = ["😀", "😂", "😊", "😍", "👍", "🙏", "👏", "🔥", "✅", "🎉", "💡", "🚀", "👀", "💬", "📌", "⭐"];

type Props = {
  onSelect: (emoji: string) => void;
};

export function EmojiPicker({ onSelect }: Props) {
  return (
    <div className="app-panel grid w-56 grid-cols-8 gap-1 rounded-xl border p-2 shadow-2xl">
      {emojiGroups.map((emoji) => (
        <button
          key={emoji}
          className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition hover:scale-110 hover:bg-[var(--surface-hover)]"
          onClick={() => onSelect(emoji)}
          type="button"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
