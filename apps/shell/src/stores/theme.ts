import { create } from "zustand";

type Theme = "light" | "dark";

const STORAGE_KEY = "pulse-theme";

function initialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(STORAGE_KEY, theme);
}

interface ThemeStore {
  theme: Theme;
  toggle: () => void;
}

/** Shell owns dark mode (class-based on <html>); MFEs inherit it. */
export const useTheme = create<ThemeStore>((set, get) => {
  const theme = initialTheme();
  apply(theme);
  return {
    theme,
    toggle: () => {
      const next: Theme = get().theme === "dark" ? "light" : "dark";
      apply(next);
      set({ theme: next });
    },
  };
});