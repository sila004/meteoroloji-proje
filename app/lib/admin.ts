import { apiUrl } from "./api";
import { AccountApiError } from "./account";

export type AdminOverview = {
  totalAccounts: number; activeSubscriptions: number; sentToday: number; failedToday: number;
  mailReady: boolean; developmentPickup: boolean; cities: string[]; updatedUtc: string;
};
export type AdminAccount = {
  id: string; email: string; city: string; deliveryTime: string; dailyEnabled: boolean;
  lastSentDate: string | null; nextAttemptUtc: string | null; processing: boolean;
  lastDelivery: { succeeded: boolean; errorCode: string | null; attemptedUtc: string } | null;
};
export type AdminDelivery = {
  id: string; accountId: string; email: string; city: string; kind: string;
  attemptedUtc: string; succeeded: boolean; errorCode: string | null;
};
export type AdminPage<T> = { items: T[]; total: number; page: number; pageSize: number };

export async function adminRequest<T>(path: string, method = "GET", data?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${apiUrl}/api/weather-admin${path}`, {
    method, credentials: "include", cache: "no-store", signal,
    headers: method === "GET" ? undefined : { "Content-Type": "application/json", "X-Weather-Client": "web" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new AccountApiError(result?.message ??
    (response.status === 401 ? "Oturumun bulunamadı. E-posta koduyla giriş yap." :
      response.status === 403 ? "Bu hesabın Yönetim Merkezi’ne erişim yetkisi yok." :
      "İşlem tamamlanamadı. Lütfen tekrar dene."), response.status);
  return result as T;
}

export function deliveryError(code: string | null) {
  return ({ WeatherUnavailable: "Hava tahmini alınamadı", SmtpFailure: "Mail sunucusu gönderimi kabul etmedi",
    Timeout: "Gönderim zaman aşımına uğradı", DeliveryFailure: "Gönderim tamamlanamadı" })[code ?? ""] ?? "—";
}
