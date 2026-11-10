// Yayında aynı sitedeki /api yolunu kullanır; Next.js bunu Intern API'ye iletir.
const apiUrl = (process.env.NODE_ENV === "production" ? "" :
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5100").replace(/\/$/, "");
export { apiUrl };

type ApiResponse<T> = {
  data?: T;
  statusCode: number;
  error?: { errors?: string[] };
};

export async function getApiData<T>(
  path: string,
  fallbackMessage: string,
  signal?: AbortSignal
): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, { signal });
  const result: ApiResponse<T> = await response.json();

  if (!response.ok || result.data == null) {
    throw new Error(result.error?.errors?.[0] ?? fallbackMessage);
  }

  return result.data;
}
