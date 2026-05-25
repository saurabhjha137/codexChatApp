import { Moon, Sun } from "lucide-react";
import { useTheme } from "../theme/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button className="theme-toggle" onClick={toggleTheme} title={isLight ? "Switch to dark theme" : "Switch to light theme"} type="button">
      <span className={`theme-toggle__thumb ${isLight ? "translate-x-7" : "translate-x-0"}`}>
        {isLight ? <Sun size={14} /> : <Moon size={14} />}
      </span>
    </button>
  );
}
