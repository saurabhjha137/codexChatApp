import { create } from "zustand";
import { persist } from "zustand/middleware";
import { adminCreateUser, adminDeleteUser, adminLogin, adminUpdateUser, adminUsers } from "../api/client";
import type { AdminUser } from "../types";

type AdminState = {
  token: string | null;
  users: AdminUser[];
  loading: boolean;
  toast: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadUsers: (query?: string) => Promise<void>;
  saveUser: (payload: { id?: number; name: string; mobile_number: string; is_active: boolean }) => Promise<void>;
  deleteUser: (userId: number) => Promise<void>;
  clearToast: () => void;
};

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      token: null,
      users: [],
      loading: false,
      toast: null,

      login: async (username, password) => {
        set({ loading: true });
        try {
          const response = await adminLogin(username, password);
          set({ token: response.token, loading: false, toast: "Admin session started" });
          await get().loadUsers();
          return true;
        } catch {
          set({ loading: false, toast: "Invalid admin credentials" });
          return false;
        }
      },

      logout: () => set({ token: null, users: [], toast: "Admin logged out" }),

      loadUsers: async (query) => {
        const token = get().token;
        if (!token) return;
        set({ loading: true });
        const users = await adminUsers(token, query);
        set({ users, loading: false });
      },

      saveUser: async (payload) => {
        const token = get().token;
        if (!token) return;
        const saved = payload.id
          ? await adminUpdateUser(token, payload.id, payload)
          : await adminCreateUser(token, payload);
        set((state) => ({
          users: payload.id
            ? state.users.map((user) => (user.id === saved.id ? saved : user))
            : [...state.users, saved],
          toast: payload.id ? "User updated" : "User created",
        }));
      },

      deleteUser: async (userId) => {
        const token = get().token;
        if (!token) return;
        await adminDeleteUser(token, userId);
        set((state) => ({ users: state.users.filter((user) => user.id !== userId), toast: "User deleted" }));
      },

      clearToast: () => set({ toast: null }),
    }),
    { name: "lan-chat-admin", partialize: (state) => ({ token: state.token }) },
  ),
);
