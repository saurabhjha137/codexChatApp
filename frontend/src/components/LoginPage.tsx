import { FormEvent, useState } from "react";
import { MessageSquare } from "lucide-react";
import { useChatStore } from "../store/chatStore";
import { ThemeToggle } from "./ThemeToggle";

export function LoginPage() {
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const { login, loading, error } = useChatStore();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await login(name, mobileNumber);
  }

  return (
    <main className="app-shell min-h-screen">
      <div className="fixed right-5 top-5">
        <ThemeToggle />
      </div>
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="primary-button flex h-11 w-11 items-center justify-center rounded-md">
            <MessageSquare size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">LAN Chat</h1>
            <p className="text-muted text-sm">Local network messaging</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="app-panel rounded-xl border p-6 shadow-2xl">
          <label className="text-secondary mb-2 block text-sm font-medium" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="input-control mb-4 w-full rounded-md px-3 py-2 text-sm"
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />

          <label className="text-secondary mb-2 block text-sm font-medium" htmlFor="mobile">
            Mobile Number
          </label>
          <input
            id="mobile"
            className="input-control mb-5 w-full rounded-md px-3 py-2 text-sm"
            placeholder="+919876543210"
            value={mobileNumber}
            onChange={(event) => setMobileNumber(event.target.value)}
            required
          />

          {error && <p className="mb-4 rounded-md bg-red-950 px-3 py-2 text-sm text-red-200">{error}</p>}

          <button
            className="primary-button w-full rounded-md px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "Joining..." : "Join Chat"}
          </button>
          <a className="text-muted mt-4 block text-center text-sm hover:text-[var(--secondary)]" href="/admin">
            Admin console
          </a>
        </form>
      </div>
    </main>
  );
}
