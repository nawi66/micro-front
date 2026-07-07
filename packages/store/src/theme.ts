import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";

/** Class-based dark mode lives on <html>; MFEs inherit it (§7). */
function apply(theme: Theme): void {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
}

function systemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
}

/**
 * Shell owns dark mode. Persisted to localStorage so the choice survives a
 * refresh; the persisted value is re-applied to <html> on rehydration.
 */
export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: systemTheme(),
      toggle: () => {
        const next: Theme = get().theme === "dark" ? "light" : "dark";
        apply(next);
        set({ theme: next });
      },
      setTheme: (theme) => {
        apply(theme);
        set({ theme });
      },
    }),
    {
      name: "pulse-theme",
      partialize: (s) => ({ theme: s.theme }),
      onRehydrateStorage: () => (state) => {
        apply(state?.theme ?? systemTheme());
      },
    },
  ),
);
