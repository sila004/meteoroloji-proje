
"use client";

import { useEffect, useState } from "react";
import { getApiData } from "./lib/api";
import { useTheme } from "./components/ThemeProvider";
import OutdoorPlan from "./components/OutdoorPlan";
import { localMinute } from "./lib/outdoor";
import { useSavedCity } from "./components/WeatherLibraryProvider";
import "./app.css";

type City = {
  name: string;
  latitude: number;
  longitude: number;
};

type CurrentWeather = {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  surface_pressure: number | null;
  precipitation: number;
  cloud_cover: number;
  weather_code: number;
  is_day: number;
};

type DailyWeather = {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max: number[];
  sunrise: string[];
  sunset: string[];
};

type HourlyWeather = {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  weather_code: number[];
  precipitation_probability: number[];
  precipitation: number[];
  wind_speed_10m: number[];
  relative_humidity_2m: number[];
  is_day: number[];
  uv_index: (number | null)[];
};

type WeatherResponse = {
  timezone?: string;
  current: CurrentWeather;
  daily: DailyWeather;
  hourly: HourlyWeather;
};

type AirResponse = {
  current?: Record<string, number | string | undefined>;
  current_units?: Record<string, string>;
};

const cities: City[] = [
  { name: "Adana", latitude: 37, longitude: 35.32 },
  { name: "Ankara", latitude: 39.93, longitude: 32.86 },
  { name: "Antalya", latitude: 36.9, longitude: 30.7 },
  { name: "Balıkesir", latitude: 39.65, longitude: 27.89 },
  { name: "Bursa", latitude: 40.19, longitude: 29.06 },
  { name: "Çanakkale", latitude: 40.15, longitude: 26.41 },
  { name: "Diyarbakır", latitude: 37.91, longitude: 40.24 },
  { name: "Eskişehir", latitude: 39.77, longitude: 30.52 },
  { name: "İstanbul", latitude: 41.01, longitude: 28.98 },
  { name: "İzmir", latitude: 38.42, longitude: 27.14 },
  { name: "Kayseri", latitude: 38.73, longitude: 35.48 },
  { name: "Kocaeli", latitude: 40.77, longitude: 29.94 },
  { name: "Muğla", latitude: 37.22, longitude: 28.36 },
  { name: "Rize", latitude: 41.02, longitude: 40.52 },
  { name: "Sivas", latitude: 39.75, longitude: 37.02 },
];

function condition(code: number) {
  if (code === 0) return { label: "Açık", type: "clear" };
  if ([1, 2].includes(code))
    return { label: "Parçalı bulutlu", type: "partly" };
  if (code === 3) return { label: "Kapalı", type: "cloudy" };
  if ([45, 48].includes(code))
    return { label: "Sisli", type: "fog" };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return { label: "Yağmurlu", type: "rain" };
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return { label: "Kar yağışlı", type: "snow" };
  if ([95, 96, 99].includes(code))
    return { label: "Gök gürültülü", type: "storm" };
  return { label: "Bilinmiyor", type: "unknown" };
}

function dateText(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
  });
}

function dayText(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("tr-TR", {
    weekday: "long",
  });
}

function round(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value)
    : "—";
}

function weatherIcon(code: number) {
  const type = condition(code).type;
  if (type === "clear") return "☀️";
  if (type === "partly") return "🌤️";
  if (type === "cloudy") return "☁️";
  if (type === "fog") return "🌫️";
  if (type === "rain") return "🌧️";
  if (type === "snow") return "❄️";
  if (type === "storm") return "⛈️";
  return "🌡️";
}

function WeatherVisual({
  code,
  isDay = true,
  large = false,
}: {
  code: number;
  isDay?: boolean;
  large?: boolean;
}) {
  const type = condition(code).type;

  return (
    <div
      className={`weather-visual visual-${type} ${
        large ? "visual-large" : ""
      }`}
      aria-hidden="true"
    >
      {isDay && ["clear", "partly"].includes(type) && (
        <div className="weather-sun" />
      )}

      {!isDay && ["clear", "partly"].includes(type) && (
        <div className="weather-moon" />
      )}

      {["partly", "cloudy", "rain", "snow", "storm"].includes(type) && (
        <div className="weather-cloud">
          <span />
          <span />
        </div>
      )}

      {["rain", "storm"].includes(type) && (
        <div className="rain-drops">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      )}

      {type === "snow" && (
        <div className="snow-flakes">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      )}

      {type === "storm" && <div className="lightning" />}

      {type === "fog" && (
        <div className="fog-lines">
          <i />
          <i />
          <i />
        </div>
      )}
    </div>
  );
}



function TemperatureChart({
  times,
  temperatures,
}: {
  times: string[];
  temperatures: number[];
}) {
  const values = temperatures.slice(0, 24);
  const labels = times.slice(0, 24);

  if (values.length < 2) return null;

  const width = 680;
  const height = 190;
  const left = 35;
  const right = 25;
  const top = 28;
  const bottom = 35;

  const min = Math.min(...values) - 2;
  const max = Math.max(...values) + 2;
  const range = Math.max(1, max - min);

  const points = values.map((value, index) => ({
    x: left + (index / (values.length - 1)) * (width - left - right),
    y: top + ((max - value) / range) * (height - top - bottom),
    value,
  }));

  const path = points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
    )
    .join(" ");

  return (
    <section className="extra-card temperature-chart">
      <p className="eyebrow">SICAKLIK ANALİZİ</p>
      <h2>24 Saatlik Sıcaklık Grafiği</h2>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Seçilen günün saatlik sıcaklık grafiği"
      >
        {[0, 1, 2, 3].map((index) => {
          const y = top + index * ((height - top - bottom) / 3);
          return (
            <line
              key={index}
              x1={left}
              x2={width - right}
              y1={y}
              y2={y}
              stroke="currentColor"
              opacity="0.12"
            />
          );
        })}

        <path
          d={path}
          fill="none"
          stroke="#6496d6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points
          .filter((_, index) => index % 4 === 0)
          .map((point, index) => (
            <g key={index}>
              <circle cx={point.x} cy={point.y} r="4" fill="#6496d6" />

              <text
                x={point.x}
                y={point.y - 12}
                textAnchor="middle"
                fill="currentColor"
                fontSize="12"
              >
                {Math.round(point.value)}°
              </text>

              <text
                x={point.x}
                y={height - 8}
                textAnchor="middle"
                fill="currentColor"
                fontSize="11"
                opacity="0.65"
              >
                {labels[index * 4]?.slice(11, 16)}
              </text>
            </g>
          ))}
      </svg>
    </section>
  );
}



function UVCard({ value }: { value?: number }) {
  const valid = typeof value === "number" && Number.isFinite(value);

  const level = !valid
    ? "Veri yok"
    : value < 3
    ? "Düşük"
    : value < 6
    ? "Orta"
    : value < 8
    ? "Yüksek"
    : value < 11
    ? "Çok yüksek"
    : "Aşırı";

  const color = !valid
    ? "#9ba8b8"
    : value < 3
    ? "#56a67b"
    : value < 6
    ? "#e3ae45"
    : value < 8
    ? "#e68a45"
    : "#ce6172";

  return (
    <article className="extra-card">
      <p className="eyebrow">GÜNEŞ IŞINLARI</p>
      <h3>UV İndeksi</h3>

      <div className="uv-number" style={{ color }}>
        {valid ? value.toFixed(1) : "—"}
      </div>

      <strong>{level}</strong>

      <div className="uv-track">
        <span
          style={{
            width: valid
              ? `${Math.min(100, Math.max(0, (value / 11) * 100))}%`
              : "0%",
            backgroundColor: color,
          }}
        />
      </div>

      <p className="extra-note">
        Seçilen günün en yüksek tahmini UV değeri.
      </p>
    </article>
  );
}

/* RÜZGÂR PUSULASI */

function WindCompass({
  speed,
  direction,
}: {
  speed: number;
  direction: number;
}) {
  const directions = ["K", "KD", "D", "GD", "G", "GB", "B", "KB"];
  const normalized = ((direction % 360) + 360) % 360;
  const directionName = directions[Math.round(normalized / 45) % 8];

  return (
    <article className="extra-card">
      <p className="eyebrow">RÜZGÂR ANALİZİ</p>
      <h3>Rüzgâr Pusulası</h3>

      <div className="compass">
        <span className="compass-n">K</span>
        <span className="compass-e">D</span>
        <span className="compass-s">G</span>
        <span className="compass-w">B</span>

        <div
          className="compass-arrow"
          style={{ transform: `rotate(${normalized}deg)` }}
          aria-hidden="true"
        >
          <span />
        </div>
      </div>

      <strong className="compass-speed">
        {round(speed)} km/sa
      </strong>

      <p className="extra-note">
        Rüzgârın geldiği yön: {directionName}
      </p>
    </article>
  );
}



function SunriseSunset({
  sunrise,
  sunset,
  selectedDate,
  clock,
  timezone,
}: {
  sunrise: string;
  sunset: string;
  selectedDate: string;
  clock: string;
  timezone: string;
}) {
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.slice(11, 16).split(":").map(Number);
    return hours * 60 + minutes;
  };

  const today = localMinute(new Date(), timezone).slice(0, 10);

  const start = toMinutes(sunrise);
  const end = toMinutes(sunset);

  const [hours, minutes] = clock.split(":").map(Number);
  const currentMinutes = hours * 60 + minutes;

  const progress =
    selectedDate === today && end > start
      ? Math.min(
          100,
          Math.max(0, ((currentMinutes - start) / (end - start)) * 100)
        )
      : 0;

  return (
    <article className="extra-card">
      <p className="eyebrow">GÜN IŞIĞI</p>
      <h3>Gün Doğumu ve Batımı</h3>

      <div className="sun-arc">
        <svg viewBox="0 0 300 155" role="img" aria-label="Gün ışığı göstergesi">
          <path
            d="M 25 135 A 125 125 0 0 1 275 135"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.15"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {selectedDate === today && (
            <>
              <path
                d="M 25 135 A 125 125 0 0 1 275 135"
                fill="none"
                stroke="#e7b45e"
                strokeWidth="7"
                strokeLinecap="round"
                pathLength="100"
                strokeDasharray={`${progress} 100`}
              />

              <circle
                cx={150 - 125 * Math.cos((progress / 100) * Math.PI)}
                cy={135 - 125 * Math.sin((progress / 100) * Math.PI)}
                r="9"
                fill="#f3c76f"
              />
            </>
          )}
        </svg>
      </div>

      <div className="sun-times">
        <div>
          <span>Gün doğumu</span>
          <strong>{sunrise.slice(11, 16)}</strong>
        </div>

        <div>
          <span>Gün batımı</span>
          <strong>{sunset.slice(11, 16)}</strong>
        </div>
      </div>

      {selectedDate !== today && (
        <p className="extra-note">
          Seçilen günün tahmini doğuş ve batış saatleri.
        </p>
      )}
    </article>
  );
}



function WeatherAlerts({
  maxWind,
  maxRainProbability,
  maxUv,
}: {
  maxWind?: number;
  maxRainProbability: number;
  maxUv?: number;
}) {
  const alerts: string[] = [];

  if (typeof maxWind === "number" && maxWind >= 40) {
    alerts.push("Kuvvetli rüzgâr ihtimali bulunuyor.");
  }

  if (maxRainProbability >= 70) {
    alerts.push("Yağış olasılığı yüksek.");
  }

  if (typeof maxUv === "number" && maxUv >= 6) {
    alerts.push("UV seviyesi yüksek olabilir.");
  }

  return (
    <section className="extra-card weather-alerts">
      <p className="eyebrow">HAVA KOŞULLARI</p>
      <h3>Hava Durumu Bilgilendirmeleri</h3>

      {alerts.length === 0 ? (
        <p>{typeof maxWind === "number" && typeof maxUv === "number"
          ? "Seçilen gün için belirlenen eşikleri aşan bir durum yok."
          : "Bazı ölçümler eksik olduğu için tüm hava koşulları değerlendirilemiyor."}</p>
      ) : (
        <ul>
          {alerts.map((alert) => (
            <li key={alert}>⚠ {alert}</li>
          ))}
        </ul>
      )}

      <p className="extra-note">
        Bu bilgiler tahmin verilerinden oluşturulur.
        Resmî meteorolojik uyarı değildir.
      </p>
    </section>
  );
}



function AirQuality({
  city,
  refreshCount,
}: {
  city: City;
  refreshCount: number;
}) {
  const [air, setAir] = useState<AirResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");
      setAir(null);

      try {
        const data = await getApiData<AirResponse>(
          `/api/hava-kalitesi/detay?city=${encodeURIComponent(city.name)}`,
          "Hava kalitesi alınamadı.",
          controller.signal
        );

        if (!controller.signal.aborted) setAir(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Bir hata oluştu.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [city, refreshCount]);

  const readings = [
    { key: "pm2_5", label: "PM2.5" },
    { key: "pm10", label: "PM10" },
    { key: "carbon_monoxide", label: "Karbonmonoksit" },
    { key: "nitrogen_dioxide", label: "Azot dioksit" },
    { key: "ozone", label: "Ozon" },
    { key: "sulphur_dioxide", label: "Kükürt dioksit" },
  ];

  function value(key: string) {
    const measurement = air?.current?.[key];
    const unit = air?.current_units?.[key] ?? "";

    return typeof measurement === "number"
      ? `${measurement.toLocaleString("tr-TR", {
          maximumFractionDigits: 1,
        })} ${unit}`
      : "Veri yok";
  }

  return (
    <section className="air-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">HAVA KALİTESİ ÖLÇÜMLERİ</p>
          <h2>Hava Kalitesi</h2>
        </div>
        <span className="section-location">{city.name}</span>
      </div>

      {loading && <p className="air-status">Hava kalitesi yükleniyor...</p>}
      {error && <p className="air-status air-error">{error}</p>}

      {air?.current && (
        <>
          <div className="air-particles">
            {readings.slice(0, 2).map((item) => (
              <article className="metric-card" key={item.key}>
                <div className="metric-heading">
                  <span>{item.label}</span>
                </div>
                <p>{value(item.key)}</p>
              </article>
            ))}
          </div>

          <details className="air-details">
            <summary>Gaz ölçümlerini göster</summary>
            <dl className="air-readings">
              {readings.slice(2).map((item) => (
                <div key={item.key}>
                  <dt>{item.label}</dt>
                  <dd>{value(item.key)}</dd>
                </div>
              ))}
            </dl>
          </details>

          <p className="air-source">
            Kaynak: Open-Meteo hava kalitesi modeli.
          </p>
        </>
      )}
    </section>
  );
}



export default function Home() {
  const { city: selectedCity, selectCity: setSelectedCity, disabled: citySaving, message: cityMessage } = useSavedCity("home");
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [clock, setClock] = useState("");
  const [now, setNow] = useState<number | null>(null);
  const { theme, toggleTheme } = useTheme();

  const city = cities.find((item) => item.name === selectedCity) ?? cities[8];
  const timezone = weather?.timezone ?? "Europe/Istanbul";

  useEffect(() => {
    function updateClock() {
      setNow(Date.now());
      setClock(
        new Date().toLocaleTimeString("tr-TR", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [timezone]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadWeather() {
      setLoading(true);
      setError("");
      setWeather(null);
      setSelectedDate("");

      try {
        const data = await getApiData<WeatherResponse>(
          `/api/hava-durumu/tahmin?city=${encodeURIComponent(city.name)}`,
          "Hava durumu alınamadı.",
          controller.signal
        );

        if (!data.current || !data.daily || !data.hourly) {
          throw new Error("Hava durumu verileri eksik.");
        }

        if (!controller.signal.aborted) {
          setWeather(data);
          setSelectedDate(data.daily.time[0]);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Bir hata oluştu.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadWeather();
    return () => controller.abort();
  }, [city, refreshCount]);

  const current = weather?.current;
  const daily = weather?.daily;
  const hourly = weather?.hourly;

  const currentCondition = condition(current?.weather_code ?? -1);

  const selectedDayIndex = daily ? daily.time.indexOf(selectedDate) : -1;

  const selectedHours = hourly
    ? hourly.time
        .map((time, index) => ({ time, index }))
        .filter(({ time }) => time.startsWith(selectedDate))
    : [];

  const selectedTemperatures = selectedHours.map(
    ({ index }) => hourly?.temperature_2m[index] ?? 0
  );

  const selectedTimes = selectedHours.map(({ time }) => time);

  const selectedUvValues = selectedHours
    .map(({ index }) => hourly?.uv_index[index])
    .filter((value): value is number =>
      typeof value === "number" && Number.isFinite(value)
    );

  const maxUv =
    selectedUvValues.length > 0 ? Math.max(...selectedUvValues) : undefined;

  const maxWind = selectedHours.length
    ? Math.max(
        ...selectedHours.map(
          ({ index }) => hourly?.wind_speed_10m[index] ?? 0
        )
      )
    : undefined;

  const maxRainProbability =
    selectedDayIndex >= 0
      ? daily?.precipitation_probability_max[selectedDayIndex] ?? 0
      : 0;

  return (
    <main className="weather-page">
      <div className="page-container">
        

        <header className="topbar">
          <a href="#" className="brand">
            <span className="brand-symbol">
              <span />
            </span>

            <span>
              METEOROLOJİ
              <small>HAVA DURUMU</small>
            </span>
          </a>

          <span className="topbar-note">
            Meteoroloji ve güncel tahminler
          </span>

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-pressed={theme === "dark"}
            aria-label={
              theme === "light" ? "Koyu temaya geç" : "Açık temaya geç"
            }
          >
            {theme === "light" ? "☾" : "☀"}
          </button>

          <a href="#weekly-forecast" className="forecast-link">
            7 günlük tahmin ↗
          </a>
        </header>

        

        <section className="page-heading">
          <div>
            <p className="eyebrow">GÜNCEL METEOROLOJİ VERİLERİ</p>
            <h1>Türkiye Hava Durumu</h1>
            <p className="page-description">
              Şehirlerin güncel hava koşulları ve 7 günlük hava tahminleri.
            </p>
          </div>

          <div className="city-selector">
            <label htmlFor="city-select">ŞEHİR SEÇİN</label>

            <select
              id="city-select"
              value={selectedCity}
              disabled={citySaving}
              onChange={(event) => void setSelectedCity(event.target.value)}
            >
              {cities.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {cityMessage && <p className="library-notice" role="status">{cityMessage}</p>}

        {loading && (
          <div className="state-panel" role="status">
            <div className="loader" />
            <h2>Hava durumu yükleniyor</h2>
            <p>Güncel veriler getiriliyor...</p>
          </div>
        )}

        {!loading && error && (
          <div className="state-panel error-panel" role="alert">
            <h2>Bir sorun oluştu</h2>
            <p>{error}</p>

            <button
              className="refresh-button"
              onClick={() => setRefreshCount((value) => value + 1)}
            >
              Tekrar dene
            </button>
          </div>
        )}

        {!loading && current && daily && hourly && (
          <>
           

            <section
              className={`current-weather theme-${currentCondition.type} ${
                current.is_day === 0 ? "theme-night" : ""
              }`}
            >
              <div className="hero-orbit" />
              <div className="hero-orbit orbit-two" />

              <div className="hero-top">
                <div className="location-tag">
                  <span>⌖</span> {city.name}, Türkiye
                </div>

                <span className="data-badge">
                  <i /> GÜNCEL VERİ
                </span>
              </div>

              <div className="hero-body">
                <div className="hero-info">
                  <p className="hero-date">
                    {dateText(current.time.slice(0, 10))}
                  </p>

                  <p className="hero-clock">
                    GÜNCEL HAVA DURUMU · {clock}
                  </p>

                  <div className="temperature">
                    {round(current.temperature_2m)}
                    <span>°C</span>
                  </div>

                  <h2>{currentCondition.label}</h2>

                  <p className="hero-summary">
                    Hissedilen {round(current.apparent_temperature)}°
                    <span> · </span>
                    En yüksek {round(daily.temperature_2m_max[0])}°
                    <span> · </span>
                    En düşük {round(daily.temperature_2m_min[0])}°
                  </p>
                </div>

                <div className="hero-visual">
                  <WeatherVisual
                    code={current.weather_code}
                    isDay={current.is_day === 1}
                    large
                  />
                </div>
              </div>

              <div className="hero-bottom">
                <span>Veriler Open-Meteo tarafından sağlanır.</span>

                <button
                  className="hero-refresh"
                  onClick={() => setRefreshCount((value) => value + 1)}
                >
                  ↻ Verileri yenile
                </button>
              </div>
            </section>

            

            <section className="metrics-grid">
              <article className="metric-card">
                <div className="metric-heading">
                  <span>Nem</span>
                  <span className="metric-symbol">◉</span>
                </div>

                <p>%{round(current.relative_humidity_2m)}</p>
                <span className="metric-note">Bağıl nem oranı</span>

                <div className="humidity-track">
                  <span
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, current.relative_humidity_2m)
                      )}%`,
                    }}
                  />
                </div>
              </article>

              <article className="metric-card">
                <div className="metric-heading">
                  <span>Rüzgâr</span>
                  <span className="metric-symbol">➤</span>
                </div>

                <p>
                  {round(current.wind_speed_10m)}
                  <small>km/sa</small>
                </p>

                <span className="metric-note">Rüzgâr hızı</span>
              </article>

              <article className="metric-card">
                <div className="metric-heading">
                  <span>Hissedilen</span>
                  <span className="metric-symbol">°</span>
                </div>

                <p>{round(current.apparent_temperature)}°</p>
                <span className="metric-note">Hissedilen sıcaklık</span>
              </article>

              <article className="metric-card">
                <div className="metric-heading">
                  <span>Gün doğumu / batımı</span>
                  <span className="metric-symbol">☀</span>
                </div>

                <div className="daylight-times">
                  <div>
                    <strong>{daily.sunrise[0]?.slice(11, 16)}</strong>
                    <span>Gün doğumu</span>
                  </div>

                  <span className="daylight-divider" />

                  <div>
                    <strong>{daily.sunset[0]?.slice(11, 16)}</strong>
                    <span>Gün batımı</span>
                  </div>
                </div>
              </article>
            </section>

            

            <OutdoorPlan hourly={hourly} selectedDate={selectedDate} timezone={timezone} cityName={city.name} now={now} />

            <section className="weather-extras">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">DETAYLI METEOROLOJİ</p>
                  <h2>Hava Analizleri</h2>
                </div>

                <span className="section-location">
                  {dateText(selectedDate)}
                </span>
              </div>

              <div className="extras-grid">
                <UVCard value={maxUv} />

                <WindCompass
                  speed={current.wind_speed_10m}
                  direction={current.wind_direction_10m}
                />

                {selectedDayIndex >= 0 && (
                  <SunriseSunset
                    sunrise={daily.sunrise[selectedDayIndex]}
                    sunset={daily.sunset[selectedDayIndex]}
                    selectedDate={selectedDate}
                    clock={clock}
                    timezone={timezone}
                  />
                )}
              </div>

              <WeatherAlerts
                maxWind={maxWind}
                maxRainProbability={maxRainProbability}
                maxUv={maxUv}
              />

              <TemperatureChart
                times={selectedTimes}
                temperatures={selectedTemperatures}
              />
            </section>

           

            <section id="weekly-forecast" className="weekly-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">ÖNÜMÜZDEKİ GÜNLER</p>
                  <h2>7 Günlük Hava Tahmini</h2>
                </div>

                <span className="section-location">{city.name}</span>
              </div>

              <p className="selection-hint">
                Bir güne tıklayarak saatlik tahminleri ve analizleri
                değiştirebilirsin.
              </p>

              <div className="forecast-grid">
                {daily.time.map((date, index) => (
                  <button
                    type="button"
                    key={date}
                    className={`forecast-card ${
                      selectedDate === date ? "is-selected" : ""
                    }`}
                    aria-pressed={selectedDate === date}
                    onClick={() => setSelectedDate(date)}
                  >
                    <time dateTime={date}>
                      <strong>{dayText(date)}</strong>
                      <span>{dateText(date)}</span>
                    </time>

                    <WeatherVisual code={daily.weather_code[index]} />

                    <span className="forecast-description">
                      {condition(daily.weather_code[index]).label}
                    </span>

                    <div className="forecast-temperatures">
                      <strong>{round(daily.temperature_2m_max[index])}°</strong>
                      <span>{round(daily.temperature_2m_min[index])}°</span>
                    </div>

                    <div className="forecast-rain">
                      <span>Yağış olasılığı</span>
                      <strong>
                        %{round(daily.precipitation_probability_max[index])}
                      </strong>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* SAATLİK TAHMİN */}

            <section className="hourly-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">SAAT SAAT TAHMİN</p>
                  <h2>Saatlik Hava Durumu</h2>
                </div>

                <span className="section-location">
                  {dateText(selectedDate)}
                </span>
              </div>

              <div className="hourly-scroll" tabIndex={0}>
                {selectedHours.length === 0 && <p className="selection-hint">Bu gün için saatlik tahmin sağlanmıyor. Günlük tahmini yukarıdan inceleyebilir veya başka bir gün seçebilirsin.</p>}
                <ul className="hourly-list">
                  {selectedHours.map(({ time, index }) => (
                    <li className="hourly-card" key={time}>
                      <time dateTime={time}>{time.slice(11, 16)}</time>

                      <WeatherVisual
                        code={hourly.weather_code[index]}
                        isDay={hourly.is_day[index] === 1}
                      />

                      <strong className="hourly-temperature">
                        {round(hourly.temperature_2m[index])}°
                      </strong>

                      <span className="hourly-feels-like">
                        Hissedilen {round(hourly.apparent_temperature[index])}°
                      </span>

                      <span className="hourly-description">
                        {condition(hourly.weather_code[index]).label}
                      </span>

                      <span className="hourly-rain">
                        Yağış %{round(hourly.precipitation_probability[index])}
                      </span>

                      <details className="hourly-details">
                        <summary>Detaylar</summary>

                        <dl>
                          <div>
                            <dt>Nem</dt>
                            <dd>
                              %{round(hourly.relative_humidity_2m[index])}
                            </dd>
                          </div>

                          <div>
                            <dt>Rüzgâr</dt>
                            <dd>
                              {round(hourly.wind_speed_10m[index])} km/sa
                            </dd>
                          </div>

                          <div>
                            <dt>UV</dt>
                            <dd>{hourly.uv_index[index] ?? "—"}</dd>
                          </div>

                          <div>
                            <dt>Yağış</dt>
                            <dd>{hourly.precipitation[index]} mm</dd>
                          </div>
                        </dl>
                      </details>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        )}

        <AirQuality city={city} refreshCount={refreshCount} />

        <footer className="page-footer">
          <span>METEOROLOJİ</span>
          <p>Türkiye hava durumu ve meteoroloji verileri.</p>

          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Veri kaynağı: Open-Meteo
          </a>
        </footer>
      </div>
    </main>
  );
}
