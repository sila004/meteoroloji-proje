"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { accountRequest, AccountApiError } from "../lib/account";

type Library = { email: string; favorites: string[]; preferences: Record<string, string> };
type Section = "home" | "map" | "air-quality";
type LibraryContext = {
  library: Library | null;
  loading: boolean;
  error: string;
  reload: () => void;
  favorite: (city: string, add: boolean) => Promise<void>;
  preference: (section: Section, city: string) => Promise<void>;
};
const Context = createContext<LibraryContext | null>(null);

export default function WeatherLibraryProvider({ children }: { children: React.ReactNode }) {
  const [library, setLibrary] = useState<Library | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => {
    setLibrary(null);
    setLoading(true);
    setError("");
    setRevision(value => value + 1);
  }, []);

  useEffect(() => {
    window.addEventListener("weather-account-changed", reload);
    return () => window.removeEventListener("weather-account-changed", reload);
  }, [reload]);

  useEffect(() => {
    const controller = new AbortController();
    accountRequest<Library>("/library", "GET", undefined, controller.signal)
      .then(data => { if (!controller.signal.aborted) setLibrary(data); })
      .catch(err => {
        if (!controller.signal.aborted && !(err instanceof AccountApiError && err.status === 401)) {
          setError("Hesabındaki kayıtlar yüklenemedi. Tekrar dene.");
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);

  async function favorite(city: string, add: boolean) {
    if (!library || loading) throw new Error("Favorilerini hesabına kaydetmek için giriş yap.");
    const owner = library.email;
    await accountRequest(add ? "/favorites" : `/favorites/${encodeURIComponent(city)}`, add ? "PUT" : "DELETE", add ? { city } : undefined);
    setLibrary(current => current?.email === owner ? {
      ...current,
      favorites: add ? [...new Set([...current.favorites, city])] : current.favorites.filter(name => name !== city),
    } : current);
  }

  async function preference(section: Section, city: string) {
    if (!library || loading) throw new Error("Şehir tercihini kaydetmek için giriş yap.");
    const owner = library.email;
    await accountRequest(`/preferences/${section}`, "PUT", { city });
    setLibrary(current => current?.email === owner ? {
      ...current, preferences: { ...current.preferences, [section]: city },
    } : current);
  }

  return <Context.Provider value={{ library, loading, error, reload, favorite, preference }}>{children}</Context.Provider>;
}

export function useWeatherLibrary() {
  const context = useContext(Context);
  if (!context) throw new Error("WeatherLibraryProvider bulunamadı.");
  return context;
}

export function LibraryNotice({ children }: { children: React.ReactNode }) {
  const { library, loading, error, reload } = useWeatherLibrary();
  if (loading) return <p className="library-notice" role="status">Hesap kayıtların kontrol ediliyor…</p>;
  if (error) return <p className="library-notice library-error" role="alert">{error} <button type="button" onClick={reload}>Tekrar dene</button></p>;
  return <p className="library-notice">{library ? children : <><Link href="/hesabim">Hesabına giriş yap</Link>; şehir tercihlerin, favorilerin ve karşılaştırma geçmişin hesabında saklansın.</>}</p>;
}

export function useSavedCity(section: Section, defaultCity = "İstanbul") {
  const { library, loading, error: libraryError, preference } = useWeatherLibrary();
  const owner = library?.email ?? null;
  const [choice, setChoice] = useState<{ owner: string | null; city: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const city = choice?.owner === owner ? choice.city : library?.preferences[section] ?? defaultCity;
  async function selectCity(next: string) {
    setChoice({ owner, city: next });
    setMessage("");
    if (!library) return;
    setSaving(true);
    try {
      await preference(section, next);
      setMessage("Şehir tercihin hesabına kaydedildi.");
    } catch {
      setMessage("Şehir gösteriliyor ancak tercihin kaydedilemedi. Sayfayı yenileyip tekrar dene.");
    } finally { setSaving(false); }
  }
  return { city, selectCity, disabled: loading || saving || !!libraryError, message };
}
