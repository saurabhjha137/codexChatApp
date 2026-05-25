import { Dashboard } from "./components/Dashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { LoginPage } from "./components/LoginPage";
import { useChatStore } from "./store/chatStore";

export default function App() {
  if (window.location.pathname.startsWith("/admin")) return <AdminDashboard />;
  const currentUser = useChatStore((state) => state.currentUser);
  return currentUser ? <Dashboard /> : <LoginPage />;
}
