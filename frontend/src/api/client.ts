import { http } from "./http";
import type { AdminUser, ApiResponse, MessagePage, User } from "../types";

export async function register(name: string, mobileNumber: string): Promise<User> {
  const response = await http.post<ApiResponse<User>>("/auth/register", {
    name,
    mobile_number: mobileNumber,
  });
  return response.data.data;
}

export async function getUsers(): Promise<User[]> {
  const response = await http.get<ApiResponse<User[]>>("/users");
  return response.data.data;
}

export async function getMessages(currentUserId: number, otherUserId: number, beforeId?: number): Promise<MessagePage> {
  const response = await http.get<ApiResponse<MessagePage>>(`/messages/${otherUserId}`, {
    headers: { "X-User-Id": currentUserId },
    params: { limit: 50, before_id: beforeId },
  });
  return response.data.data;
}

export async function adminLogin(username: string, password: string): Promise<{ token: string; expires_at: string }> {
  const response = await http.post<ApiResponse<{ token: string; expires_at: string }>>("/admin/login", { username, password });
  return response.data.data;
}

export async function adminUsers(token: string, query?: string): Promise<AdminUser[]> {
  const response = await http.get<ApiResponse<AdminUser[]>>("/admin/users", {
    headers: { Authorization: `Bearer ${token}` },
    params: { q: query || undefined },
  });
  return response.data.data;
}

export async function adminCreateUser(
  token: string,
  payload: { name: string; mobile_number: string; is_active: boolean },
): Promise<AdminUser> {
  const response = await http.post<ApiResponse<AdminUser>>("/admin/users", payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data;
}

export async function adminUpdateUser(
  token: string,
  userId: number,
  payload: Partial<{ name: string; mobile_number: string; is_active: boolean }>,
): Promise<AdminUser> {
  const response = await http.patch<ApiResponse<AdminUser>>(`/admin/users/${userId}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data;
}

export async function adminDeleteUser(token: string, userId: number): Promise<void> {
  await http.delete(`/admin/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
