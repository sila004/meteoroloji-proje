"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY, type Theme } from "../lib/theme";

const THEME_CHANGE_EVENT = "meteoroloji-theme-change";

function getTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerTheme(): Theme {
  return "light";
}

function subscribe(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === THEME_STORAGE_KEY || event.key === null) {
      document.documentElement.dataset.theme = event.newValue === "dark" ? "dark" : "light";
      onChange();
    }
  }

  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function toggleTheme() {
  const theme = getTheme() === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The current session can still change theme when storage is unavailable.
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | null>(null);

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
