
export const cities = [
  { name: "İstanbul", lat: 41.01, lon: 28.98 },
  { name: "Ankara", lat: 39.93, lon: 32.86 },
  { name: "İzmir", lat: 38.42, lon: 27.14 },
  { name: "Bursa", lat: 40.18, lon: 29.06 },
  { name: "Antalya", lat: 36.90, lon: 30.70 },
  { name: "Adana", lat: 37.00, lon: 35.32 },
  { name: "Konya", lat: 37.87, lon: 32.49 },
  { name: "Gaziantep", lat: 37.07, lon: 37.38 },
  { name: "Trabzon", lat: 41.00, lon: 39.72 },
  { name: "Samsun", lat: 41.29, lon: 36.33 },
  { name: "Kayseri", lat: 38.73, lon: 35.49 },
  { name: "Eskişehir", lat: 39.77, lon: 30.52 },
  { name: "Diyarbakır", lat: 37.91, lon: 40.23 },
  { name: "Van", lat: 38.50, lon: 43.38 },
  { name: "Erzurum", lat: 39.91, lon: 41.27 },
] as const;

export type City = (typeof cities)[number];

export type Weather = {
  temperature: number;
  humidity: number;
  apparent: number;
  wind: number;
  code: number;
};

export type AirQuality = {
  aqi: number | null;
  pm25: number | null;
  pm10: number | null;
  ozone: number | null;
  nitrogenDioxide: number | null;
};

export async function getWeather(city: City): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(city.lat),
    longitude: String(city.lon),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code",
    timezone: "auto",
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`
  );

  if (!response.ok) throw new Error("Hava durumu alınamadı.");

  const data = await response.json();
  const current = data.current;

  return {
    temperature: current.temperature_2m,
    humidity: current.relative_humidity_2m,
    apparent: current.apparent_temperature,
    wind: current.wind_speed_10m,
    code: current.weather_code,
  };
}

export async function getAirQuality(city: City): Promise<AirQuality> {
  const params = new URLSearchParams({
    latitude: String(city.lat),
    longitude: String(city.lon),
    current: "european_aqi,pm2_5,pm10,ozone,nitrogen_dioxide",
    timezone: "auto",
  });

  const response = await fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?${params}`
  );

  if (!response.ok) throw new Error("Hava kalitesi alınamadı.");

  const data = await response.json();
  const current = data.current;

  return {
    aqi: current.european_aqi ?? null,
    pm25: current.pm2_5 ?? null,
    pm10: current.pm10 ?? null,
    ozone: current.ozone ?? null,
    nitrogenDioxide: current.nitrogen_dioxide ?? null,
  };
}

export function weatherDescription(code: number) {
  if (code === 0) return "Açık ☀️";
  if (code <= 3) return "Parçalı bulutlu ⛅";
  if (code <= 48) return "Sisli 🌫️";
  if (code <= 67) return "Yağmurlu 🌧️";
  if (code <= 77) return "Karlı ❄️";
  if (code <= 82) return "Sağanak 🌧️";
  if (code <= 86) return "Kar yağışlı ❄️";
  if (code >= 95) return "Fırtınalı ⛈️";
  return "Değişken hava";
}

export function aqiDescription(value: number | null) {
  if (value === null) return "Veri yok";
  if (value <= 20) return "İyi";
  if (value <= 40) return "Makul";
  if (value <= 60) return "Orta";
  if (value <= 80) return "Kötü";
  if (value <= 100) return "Çok kötü";
  return "Son derece kötü";
}
