import { apiUrl } from "./api";

export type WeatherAccount = {
  email: string;
  isAdmin: boolean;
  city: string;
  deliveryTime: string;
  dailyEnabled: boolean;
  lastSentDate: string | null;
  nextDeliveryUtc: string | null;
  mailReady: boolean;
  developmentPickup: boolean;
};

export type MailStatus = {
  mailReady: boolean;
  developmentPickup: boolean;
  cities: string[];
  defaultDeliveryTime: string;
};

export class AccountApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export function notifyAccountChanged() {
  window.dispatchEvent(new Event("weather-account-changed"));
}

export async function accountRequest<T>(path: string, method = "GET", data?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${apiUrl}/api/weather-account${path}`, {
    method,
    credentials: "include",
    headers: method === "GET" ? undefined : { "Content-Type": "application/json", "X-Weather-Client": "web" },
    body: data === undefined ? undefined : JSON.stringify(data),
    cache: "no-store",
    signal,
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && path !== "/library" && path !== "/me") notifyAccountChanged();
    const message = result?.message ?? result?.error?.errors?.[0] ?? (response.status === 401 ? "Giriş yapman gerekiyor." :
      response.status === 429 ? "Çok fazla deneme yapıldı. Bir süre sonra tekrar dene." : "İşlem tamamlanamadı. Lütfen tekrar dene.");
    throw new AccountApiError(message, response.status);
  }
  return result as T;
}
