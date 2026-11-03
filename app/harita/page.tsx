
"use client";

import { useEffect, useState } from "react";
import {
  cities,
  getWeather,
  weatherDescription,
  type Weather,
} from "../lib/weather";
import "./harita.css";

export default function Harita() {
  const [selected, setSelected] = useState(0);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getWeather(cities[0])
      .then((data) => {
        if (active) setWeather(data);
      })
      .catch(() => {
        if (active) {
          setError("Hava durumu alınamadı.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function selectCity(index: number) {
    setSelected(index);
    setLoading(true);
    setError("");
    setWeather(null);

    try {
      const data = await getWeather(cities[index]);
      setWeather(data);
    } catch {
      setError("Hava durumu alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  const minLon = 25;
  const maxLon = 45;
  const minLat = 35;
  const maxLat = 43;

  return (
    <main className="harita-page">
      <div className="harita-container">

        <header className="harita-heading">
          <div>
            <p className="harita-eyebrow">
              TÜRKİYE METEOROLOJİ
            </p>
            <h1>Türkiye Hava Durumu Haritası</h1>
            <p className="harita-subtitle">
              Türkiye genelindeki şehirlerin güncel hava
              durumunu keşfet. Haritadan bir şehir seçerek
              detaylı bilgilerini görüntüle.
            </p>
          </div>
        </header>

        <section className="harita-section">
          <div className="harita-section-heading">
            <div>
              <p className="harita-eyebrow">
                İNTERAKTİF HARİTA
              </p>
              <h2>Şehirleri Keşfet</h2>
            </div>

            <span className="harita-count">
              {cities.length} şehir
            </span>
          </div>

          <div className="harita-glass">
            <div className="harita-map">
              <span className="harita-map-label">
                TÜRKİYE
              </span>

              {cities.map((city, index) => {
                const left =
                  ((city.lon - minLon) /
                    (maxLon - minLon)) *
                  100;

                const top =
                  ((maxLat - city.lat) /
                    (maxLat - minLat)) *
                  100;

                return (
                  <button
                    key={city.name}
                    type="button"
                    className={
                      selected === index
                        ? "harita-pin harita-pin-active"
                        : "harita-pin"
                    }
                    style={{
                      left: `${Math.max(5, Math.min(95, left))}%`,
                      top: `${Math.max(8, Math.min(92, top))}%`,
                    }}
                    onClick={() => selectCity(index)}
                    aria-pressed={selected === index}
                  >
                    <span className="harita-pin-dot" />
                    {city.name}
                  </button>
                );
              })}
            </div>

            <div className="harita-map-bottom">
              <span>Şehir seçmek için tıkla</span>
              <strong>{cities[selected].name}</strong>
            </div>
          </div>
        </section>

        <section className="harita-section">
          <div className="harita-section-heading">
            <div>
              <p className="harita-eyebrow">
                GÜNCEL HAVA DURUMU
              </p>
              <h2>Seçili Şehir</h2>
            </div>
          </div>

          <div className="harita-weather">
            <div className="harita-orbit" />
            <div className="harita-orbit harita-orbit-two" />

            <div className="harita-weather-top">
              <span>📍 {cities[selected].name}</span>
              <span className="harita-live">
                GÜNCEL VERİLER
              </span>
            </div>

            {loading && (
              <p className="harita-status">
                Hava durumu yükleniyor...
              </p>
            )}

            {error && (
              <p className="harita-status">
                {error}
              </p>
            )}

            {!loading && !error && weather && (
              <>
                <div className="harita-weather-body">
                  <div>
                    <div className="harita-temperature">
                      {Math.round(weather.temperature)}
                      <span>°C</span>
                    </div>

                    <h3>
                      {weatherDescription(weather.code)}
                    </h3>

                    <p>
                      {cities[selected].name} için güncel
                      meteoroloji bilgileri
                    </p>
                  </div>

                  <div
                    className="harita-weather-symbol"
                    aria-hidden="true"
                  >
                    ☀️
                  </div>
                </div>

                <div className="harita-weather-bottom">
                  <span>
                    Nem: %{weather.humidity}
                  </span>
                  <span>
                    Rüzgâr: {weather.wind} km/sa
                  </span>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="harita-metrics">
          <div className="harita-metric">
            <span>GÖRÜNTÜLENEN ŞEHİR</span>
            <strong>{cities[selected].name}</strong>
            <small>Seçili konum</small>
          </div>

          <div className="harita-metric">
            <span>SICAKLIK</span>
            <strong>
              {weather
                ? `${Math.round(weather.temperature)}°C`
                : "—"}
            </strong>
            <small>Güncel sıcaklık</small>
          </div>

          <div className="harita-metric">
            <span>NEM ORANI</span>
            <strong>
              {weather ? `%${weather.humidity}` : "—"}
            </strong>
            <small>Bağıl nem</small>
          </div>

          <div className="harita-metric">
            <span>RÜZGÂR HIZI</span>
            <strong>
              {weather ? `${weather.wind} km/sa` : "—"}
            </strong>
            <small>Güncel rüzgâr</small>
          </div>
        </section>

        <footer className="harita-footer">
          <strong>METEOROLOJİ</strong>
          <span>Türkiye Hava Durumu Haritası</span>
        </footer>

      </div>
    </main>
  );
}
