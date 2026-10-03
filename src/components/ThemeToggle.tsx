import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("moonlight_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("moonlight_theme", "light");
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={isDark ? "Switch to Light mode" : "Switch to Night mode"}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer touch-manipulation ${className || ""}`}
    >
      {isDark ? <Sun className="h-4 w-4 text-gold" /> : <Moon className="h-4 w-4 text-primary" />}
    </button>
  );
}
