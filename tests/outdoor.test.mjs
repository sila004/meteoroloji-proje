import test from "node:test";
import assert from "node:assert/strict";
import { bestOutdoorHour, localMinute } from "../app/lib/outdoor.ts";

function forecast(overrides = {}) {
  return {
    time: ["2026-11-04T09:00", "2026-11-04T12:00", "2026-11-04T15:00"],
    apparent_temperature: [21, 21, 18],
    precipitation_probability: [0, 10, 20],
    precipitation: [0, 0, 0], wind_speed_10m: [3, 8, 12],
    uv_index: [1, 3, 1], weather_code: [0, 1, 2], is_day: [1, 1, 1],
    ...overrides,
  };
}

test("geçmiş ve başlamış saatleri önermeden en elverişli gelecek saati seçer", () => {
  const result = bestOutdoorHour(forecast(), "2026-11-04", "2026-11-04T09:30");
  assert.equal(result.kind, "recommended");
  assert.equal(result.hour.time, "2026-11-04T12:00");
});

test("daha iyi koşulları olsa bile gece saatlerini önermez", () => {
  const result = bestOutdoorHour(forecast({ is_day: [0, 1, 1] }), "2026-11-04", "2026-11-04T08:00");
  assert.equal(result.hour.time, "2026-11-04T12:00");
});

test("kalan gündüz saati yoksa yeni gün seçilmesini ister", () => {
  assert.equal(bestOutdoorHour(forecast(), "2026-11-04", "2026-11-04T18:00").kind, "no-daylight");
});

test("fırtına, yüksek UV, kuvvetli rüzgâr, aşırı sıcak ve yağışı uygun göstermez", () => {
  for (const overrides of [
    { weather_code: [95, 96, 99] }, { uv_index: [8, 9, 11] },
    { wind_speed_10m: [35, 40, 50] }, { apparent_temperature: [33, 40, -1] },
    { precipitation_probability: [60, 80, 100] }, { precipitation: [1, 3, 6] },
  ]) {
    assert.equal(bestOutdoorHour(forecast(overrides), "2026-11-04", "2026-11-04T08:00").kind, "unsuitable");
  }
});

test("eksik ve null ölçümleri sıfır kabul etmez", () => {
  assert.equal(bestOutdoorHour(forecast({ uv_index: [null, null, null] }), "2026-11-04", "2026-11-04T08:00").kind, "missing");
  const result = bestOutdoorHour(forecast({ apparent_temperature: [null, 21, 18] }), "2026-11-04", "2026-11-04T08:00");
  assert.equal(result.hour.time, "2026-11-04T12:00");
});

test("yalnız seçilen günün saatlerini değerlendirir", () => {
  const result = bestOutdoorHour(forecast({ time: ["2026-11-04T09:00", "2026-11-05T12:00", "2026-11-04T15:00"] }), "2026-11-05", "2026-11-04T18:00");
  assert.equal(result.hour.time, "2026-11-05T12:00");
  assert.equal(bestOutdoorHour(forecast(), "2026-11-06", "2026-11-04T18:00").kind, "missing");
});

test("gün sınırını cihaz saatine göre değil seçilen konuma göre hesaplar", () => {
  const instant = new Date("2026-11-04T22:30:00Z");
  assert.equal(localMinute(instant, "Europe/Istanbul"), "2026-11-05T01:30");
  assert.equal(localMinute(instant, "America/New_York"), "2026-11-04T17:30");
});
