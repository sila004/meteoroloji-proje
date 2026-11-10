export type OutdoorForecast = {
  time: string[];
  apparent_temperature: (number | null)[];
  precipitation_probability: (number | null)[];
  precipitation: (number | null)[];
  wind_speed_10m: (number | null)[];
  uv_index: (number | null)[];
  weather_code: (number | null)[];
  is_day: (number | null)[];
};

export type OutdoorHour = {
  time: string;
  apparent: number;
  rainProbability: number;
  precipitation: number;
  wind: number;
  uv: number;
  score: number;
};

export type OutdoorRecommendation =
  | { kind: "recommended"; hour: OutdoorHour }
  | { kind: "missing" | "no-daylight" | "unsuitable" };

// Tahmin saatleri, seçilen konumun yerel saatinde ve saat dilimi eki olmadan gelir.
export function localMinute(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function bestOutdoorHour(
  hourly: OutdoorForecast,
  selectedDate: string,
  nowLocal: string
): OutdoorRecommendation {
  const dayHours = hourly.time
    .map((time, index) => ({ time, index }))
    .filter(({ time }) => time.startsWith(`${selectedDate}T`));
  if (dayHours.length === 0) return { kind: "missing" };

  // Başlamış/geçmiş saatleri ve gece saatlerini önerme.
  const daylight = dayHours.filter(({ time, index }) =>
    time.slice(0, 16) >= nowLocal && hourly.is_day[index] === 1
  );
  if (daylight.length === 0) return { kind: "no-daylight" };

  let completeHours = 0;
  const candidates: OutdoorHour[] = [];
  for (const { time, index } of daylight) {
    const apparent = hourly.apparent_temperature[index];
    const rainProbability = hourly.precipitation_probability[index];
    const precipitation = hourly.precipitation[index];
    const wind = hourly.wind_speed_10m[index];
    const uv = hourly.uv_index[index];
    const code = hourly.weather_code[index];
    if (typeof apparent !== "number" || !Number.isFinite(apparent) ||
        typeof rainProbability !== "number" || !Number.isFinite(rainProbability) ||
        typeof precipitation !== "number" || !Number.isFinite(precipitation) ||
        typeof wind !== "number" || !Number.isFinite(wind) ||
        typeof uv !== "number" || !Number.isFinite(uv) ||
        typeof code !== "number" || !Number.isFinite(code) ||
        rainProbability < 0 || rainProbability > 100 || precipitation < 0 || wind < 0 || uv < 0)
      continue;

    completeHours++;
    // Açık/parçalı bulutlu/kapalı koşullar; fırtına, sis, yağmur ve karı ele.
    if (![0, 1, 2, 3].includes(code) || rainProbability >= 60 || precipitation > 0.5 ||
        wind >= 35 || uv >= 8 || apparent < 5 || apparent > 32)
      continue;

    const score = Math.max(0, 100 - Math.abs(apparent - 21) * 2 -
      rainProbability * 0.45 - precipitation * 18 - wind * 0.6 - uv * 3);
    candidates.push({ time, apparent, rainProbability, precipitation, wind, uv, score });
  }

  if (completeHours === 0) return { kind: "missing" };
  if (candidates.length === 0) return { kind: "unsuitable" };
  // Eşit puanda daha erken saat seçilir.
  candidates.sort((a, b) => b.score - a.score || a.time.localeCompare(b.time));
  return { kind: "recommended", hour: candidates[0] };
}
