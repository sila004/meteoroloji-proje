import { cities } from "./weather";

const key = "meteoroloji-favoriler";
const eventName = "weather-local-favorites-changed";

export function subscribeFavorites(listener: () => void) {
  const onStorage = (event: StorageEvent) => { if (event.key === key || event.key === null) listener(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener(eventName, listener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(eventName, listener);
  };
}

export function readFavorites(): string {
  try { return localStorage.getItem(key) ?? "[]"; }
  catch { return "[]"; }
}

export function parseFavorites(value: string | null): string[] {
  try {
    const saved: unknown = JSON.parse(value ?? "[]");
    return Array.isArray(saved) ? [...new Set(saved.filter((name): name is string =>
      typeof name === "string" && cities.some(city => city.name === name)))] : [];
  } catch { return []; }
}

export function storeFavorites(names: string[]) {
  localStorage.setItem(key, JSON.stringify(names));
  window.dispatchEvent(new Event(eventName));
}
