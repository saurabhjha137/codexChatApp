type Props = {
  message: string | null;
  onClose: () => void;
};

export function Toast({ message, onClose }: Props) {
  if (!message) return null;
  return (
    <button className="app-panel fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border px-4 py-3 text-left text-sm shadow-2xl" onClick={onClose}>
      {message}
    </button>
  );
}
