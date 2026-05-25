import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Search, Shield, Trash2, Users, X } from "lucide-react";
import { useAdminStore } from "../store/adminStore";
import type { AdminUser } from "../types";
import { formatDateTime } from "../utils/format";
import { Avatar } from "./Avatar";
import { ThemeToggle } from "./ThemeToggle";
import { Toast } from "./Toast";

type EditState = {
  id?: number;
  name: string;
  mobile_number: string;
  is_active: boolean;
};

const emptyEdit: EditState = { name: "", mobile_number: "", is_active: true };

export function AdminDashboard() {
  const { token, users, loading, toast, login, logout, loadUsers, saveUser, deleteUser, clearToast } = useAdminStore();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<EditState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (token) void loadUsers();
  }, [token]);

  const filteredUsers = useMemo(() => {
    const needle = query.toLowerCase().trim();
    if (!needle) return users;
    return users.filter((user) => `${user.name} ${user.mobile_number}`.toLowerCase().includes(needle));
  }, [query, users]);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await login(username, password);
  }

  async function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    await saveUser(editing);
    setEditing(null);
  }

  if (!token) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center px-5">
        <div className="fixed right-5 top-5">
          <ThemeToggle />
        </div>
        <form className="app-panel w-full max-w-md rounded-xl border p-6 shadow-2xl" onSubmit={submitLogin}>
          <div className="mb-6 flex items-center gap-3">
            <div className="primary-button flex h-11 w-11 items-center justify-center rounded-xl">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Admin Console</h1>
              <p className="text-muted text-sm">Manage LAN Chat users</p>
            </div>
          </div>
          <label className="text-secondary mb-2 block text-sm">Username</label>
          <input className="input-control mb-4 w-full rounded-lg px-3 py-2" value={username} onChange={(event) => setUsername(event.target.value)} />
          <label className="text-secondary mb-2 block text-sm">Password</label>
          <input className="input-control mb-5 w-full rounded-lg px-3 py-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <button className="primary-button w-full rounded-lg px-4 py-2 font-semibold" disabled={loading} type="submit">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <Toast message={toast} onClose={clearToast} />
      </main>
    );
  }

  return (
    <main className="app-shell min-h-screen">
      <div className="flex min-h-screen">
        <aside className="app-panel hidden w-64 border-r p-4 md:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="primary-button flex h-10 w-10 items-center justify-center rounded-xl">
              <Shield size={20} />
            </div>
            <div>
              <p className="font-semibold">Admin</p>
              <p className="text-muted text-xs">LAN Chat</p>
            </div>
            <ThemeToggle />
          </div>
          <div className="app-panel-soft rounded-lg px-3 py-2 text-sm">
            <Users size={16} className="mr-2 inline" />
            User Management
          </div>
          <a className="text-muted mt-3 block rounded-lg px-3 py-2 text-sm hover:bg-[var(--surface-hover)]" href="/">
            Back to chat
          </a>
          <button className="text-muted mt-2 w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--surface-hover)]" onClick={logout}>
            Logout
          </button>
        </aside>

        <section className="flex-1 p-4 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Users</h1>
              <p className="text-muted text-sm">Create, edit, disable, and monitor local users.</p>
            </div>
            <button className="primary-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold" onClick={() => setEditing(emptyEdit)}>
              <Plus size={18} />
              New user
            </button>
          </div>

          <div className="input-control mb-4 flex items-center gap-2 rounded-lg px-3 py-2">
            <Search size={16} className="text-muted" />
            <input className="flex-1 bg-transparent text-sm outline-none" placeholder="Search users" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>

          <div className="app-panel overflow-hidden rounded-xl border">
            <div className="app-border text-muted hidden grid-cols-[1.5fr_1fr_0.8fr_1fr_0.7fr_0.6fr] gap-4 border-b px-4 py-3 text-xs uppercase tracking-wide md:grid">
              <span>User</span>
              <span>Mobile</span>
              <span>Status</span>
              <span>Last seen</span>
              <span>Messages</span>
              <span>Actions</span>
            </div>
            {filteredUsers.map((user) => (
              <div key={user.id} className="app-border grid gap-3 border-b px-4 py-4 last:border-b-0 md:grid-cols-[1.5fr_1fr_0.8fr_1fr_0.7fr_0.6fr] md:items-center">
                <div className="flex items-center gap-3">
                  <Avatar name={user.name} online={user.is_online} size="sm" />
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-muted text-xs">Created {formatDateTime(user.created_at)}</p>
                  </div>
                </div>
                <p className="text-secondary text-sm">{user.mobile_number}</p>
                <span className={`w-fit rounded-full px-2 py-1 text-xs ${user.is_active ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                  {user.is_active ? (user.is_online ? "Online" : "Enabled") : "Disabled"}
                </span>
                <p className="text-secondary text-sm">{formatDateTime(user.last_seen)}</p>
                <p className="text-secondary text-sm">{user.total_messages}</p>
                <div className="flex gap-2">
                  <button className="icon-button" onClick={() => setEditing(user)} title="Edit user">
                    <Edit2 size={16} />
                  </button>
                  <button className="icon-button" onClick={() => setDeleteTarget(user)} title="Delete user">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form className="app-panel w-full max-w-md rounded-xl border p-5 shadow-2xl" onSubmit={submitUser}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing.id ? "Edit user" : "Create user"}</h2>
              <button className="icon-button" onClick={() => setEditing(null)} type="button">
                <X size={18} />
              </button>
            </div>
            <label className="text-secondary mb-2 block text-sm">Name</label>
            <input className="input-control mb-4 w-full rounded-lg px-3 py-2" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} required />
            <label className="text-secondary mb-2 block text-sm">Mobile number</label>
            <input className="input-control mb-4 w-full rounded-lg px-3 py-2" value={editing.mobile_number} onChange={(event) => setEditing({ ...editing, mobile_number: event.target.value })} required />
            <label className="text-secondary mb-5 flex items-center gap-3 text-sm">
              <input checked={editing.is_active} onChange={(event) => setEditing({ ...editing, is_active: event.target.checked })} type="checkbox" />
              Enabled
            </label>
            <button className="primary-button w-full rounded-lg px-4 py-2 font-semibold" type="submit">
              Save user
            </button>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="app-panel w-full max-w-sm rounded-xl border p-5 shadow-2xl">
            <h2 className="mb-2 text-lg font-semibold">Delete {deleteTarget.name}?</h2>
            <p className="text-muted mb-5 text-sm">This removes the user and their related messages from this local database.</p>
            <div className="flex justify-end gap-2">
              <button className="app-panel-soft rounded-lg px-4 py-2" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white"
                onClick={() => {
                  void deleteUser(deleteTarget.id);
                  setDeleteTarget(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <Toast message={toast} onClose={clearToast} />
    </main>
  );
}
