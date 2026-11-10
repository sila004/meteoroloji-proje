import test from "node:test";
import assert from "node:assert/strict";
import { getApiData } from "../app/lib/api.ts";

test("sağlayıcı sınırında sunucu tarihine göre Türkiye'deki yeniden deneme zamanını gösterir", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({
    statusCode: 503, error: { code: "WeatherProviderRateLimited", errors: ["Biraz sonra tekrar deneyin."] },
  }), { status: 503, headers: { "Retry-After": "57600", Date: "Tue, 10 Nov 2026 08:00:00 GMT" } }));
  await assert.rejects(getApiData("/example", "Alınamadı"), error =>
    error.message.includes("11 Kasım") && error.message.includes("03:00") && error.message.includes("Türkiye saati"));
});

test("Retry-After başlığı yoksa API'nin bildirdiği bekleme süresini kullanır", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({
    statusCode: 503, error: { code: "WeatherProviderRateLimited", params: { retryAfterSeconds: "3600" } },
  }), { status: 503, headers: { Date: "Tue, 10 Nov 2026 08:00:00 GMT" } }));
  await assert.rejects(getApiData("/example", "Alınamadı"), /12:00/);
});

test("geçersiz bekleme süresinde ve diğer hatalarda API açıklamasını korur", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({
    statusCode: 503, error: { code: "WeatherProviderRateLimited", errors: ["Bekleme bilgisi alınamadı."] },
  }), { status: 503, headers: { "Retry-After": "invalid" } }));
  await assert.rejects(getApiData("/example", "Alınamadı"), /Bekleme bilgisi alınamadı/);
});
