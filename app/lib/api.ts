// Yayında aynı sitedeki /api yolunu kullanır; Next.js bunu Intern API'ye iletir.
const apiUrl = (process.env.NODE_ENV === "production" ? "" :
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5100").replace(/\/$/, "");
export { apiUrl };

type ApiResponse<T> = {
  data?: T;
  statusCode: number;
  error?: { errors?: string[]; code?: string; params?: { retryAfterSeconds?: string } };
};

export async function getApiData<T>(
  path: string,
  fallbackMessage: string,
  signal?: AbortSignal
): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, { signal });
  const result: ApiResponse<T> = await response.json();

  if (!response.ok || result.data == null) {
    if (result.error?.code === "WeatherProviderRateLimited") {
      const seconds = Number(response.headers.get("Retry-After") ?? result.error.params?.retryAfterSeconds);
      const serverTime = Date.parse(response.headers.get("Date") ?? "");
      const retryTime = new Date((Number.isFinite(serverTime) ? serverTime : Date.now()) + seconds * 1000);
      if (Number.isFinite(seconds) && seconds > 0 && Number.isFinite(retryTime.getTime())) {
        const availableAt = retryTime.toLocaleString("tr-TR", {
          timeZone: "Europe/Istanbul", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
        });
        throw new Error(`Hava verisi sağlayıcısının istek sınırı doldu. Sağlayıcının bildirdiği yeniden deneme zamanı: ${availableAt} (Türkiye saati).`);
      }
    }
    throw new Error(result.error?.errors?.[0] ?? fallbackMessage);
  }

  return result.data;
}
