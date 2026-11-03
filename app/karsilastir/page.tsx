
"use client";

import { useEffect, useRef, useState } from "react";
import {
  cities,
  getWeather,
  weatherDescription,
  type Weather,
} from "../lib/weather";
import "./karsilastir.css";

// Arama yapılabilen şehir seçme kutusu
function CitySearch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (index: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const filteredCities = cities
    .map((city, index) => ({
      ...city,
      index,
    }))
    .filter((city) =>
      city.name
        .toLocaleLowerCase("tr-TR")
        .includes(search.toLocaleLowerCase("tr-TR"))
    );

  return (
    <div className="kars-select-card" ref={containerRef}>
      <span className="kars-card-label">{label}</span>

      <button
        type="button"
        className="kars-dropdown-button"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          setSearch("");
        }}
      >
        <span>{cities[value].name}</span>
        <span aria-hidden="true">{open ? "⌃" : "⌄"}</span>
      </button>

      {open && (
        <div className="kars-dropdown">
          <input
            ref={inputRef}
            type="text"
            placeholder="Şehir ara..."
            aria-label={`${label} ara`}
            className="kars-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
              }

              if (
                e.key === "Enter" &&
                filteredCities.length > 0
              ) {
                onChange(filteredCities[0].index);
                setOpen(false);
                setSearch("");
              }
            }}
          />

          <div className="kars-city-list">
            {filteredCities.length === 0 && (
              <p className="kars-no-result">
                Şehir bulunamadı.
              </p>
            )}

            {filteredCities.map((city) => (
              <button
                key={city.name}
                type="button"
                className="kars-city-option"
                onClick={() => {
                  onChange(city.index);
                  setOpen(false);
                  setSearch("");
                }}
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Karşılaştırma sayfası
export default function Karsilastir() {
  const [first, setFirst] = useState(0);
  const [second, setSecond] = useState(1);
  const [results, setResults] = useState<Weather[] | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function compare() {
    if (first === second || loading) return;

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const data = await Promise.all([
        getWeather(cities[first]),
        getWeather(cities[second]),
      ]);

      setResults(data);
    } catch {
      setError(
        "Karşılaştırma yapılamadı. Lütfen tekrar dene."
      );
    } finally {
      setLoading(false);
    }
  }

  const fark = results
    ? Math.abs(
        results[0].temperature -
          results[1].temperature
      ).toFixed(1)
    : null;

  return (
    <main className="kars-page">
      <div className="kars-container">

        {/* Sayfa başlığı */}
        <header className="kars-heading">
          <p className="kars-eyebrow">
            METEOROLOJİ / ŞEHİR ANALİZİ
          </p>

          <h1>Şehir Karşılaştırma</h1>

          <p className="kars-subtitle">
            Türkiye'deki iki şehrin güncel hava
            koşullarını karşılaştır. Sıcaklık, nem ve
            rüzgâr değerlerini tek ekranda incele.
          </p>
        </header>

        {/* Şehir seçimi */}
        <section className="kars-section">
          <div className="kars-section-heading">
            <div>
              <p className="kars-eyebrow">
                KARŞILAŞTIRMA AYARLARI
              </p>
              <h2>Şehirlerini Seç</h2>
            </div>

            <span>2 şehir karşılaştırması</span>
          </div>

          <div className="kars-select-grid">
            <CitySearch
              label="01 / BİRİNCİ ŞEHİR"
              value={first}
              onChange={(index) => {
                setFirst(index);
                setResults(null);
                setError("");
              }}
            />

            <CitySearch
              label="02 / İKİNCİ ŞEHİR"
              value={second}
              onChange={(index) => {
                setSecond(index);
                setResults(null);
                setError("");
              }}
            />
          </div>

          <div className="kars-actions">
            <button
              type="button"
              className="kars-button"
              onClick={compare}
              disabled={
                loading || first === second
              }
            >
              {loading
                ? "Karşılaştırılıyor..."
                : "Şehirleri Karşılaştır →"}
            </button>

            {first === second && (
              <p className="kars-warning">
                Karşılaştırmak için iki farklı şehir seç.
              </p>
            )}

            {error && (
              <p className="kars-error">{error}</p>
            )}
          </div>
        </section>

        {/* Karşılaştırma sonuçları */}
        {results && (
          <section className="kars-section">
            <div className="kars-section-heading">
              <div>
                <p className="kars-eyebrow">
                  GÜNCEL METEOROLOJİ VERİLERİ
                </p>
                <h2>Karşılaştırma Sonuçları</h2>
              </div>
            </div>

            <div className="kars-result-grid">
              {results.map((weather, index) => (
                <article
                  className="kars-weather-card"
                  key={index}
                >
                  <div className="kars-orbit" />

                  <div className="kars-weather-top">
                    <span>
                      📍{" "}
                      {
                        cities[
                          index === 0
                            ? first
                            : second
                        ].name
                      }
                    </span>

                    <span className="kars-live">
                      GÜNCEL VERİ
                    </span>
                  </div>

                  <div className="kars-weather-body">
                    <div className="kars-temperature">
                      {Math.round(
                        weather.temperature
                      )}
                      <span>°C</span>
                    </div>

                    <span
                      className="kars-weather-icon"
                      aria-hidden="true"
                    >
                      🌤️
                    </span>
                  </div>

                  <h3>
                    {weatherDescription(weather.code)}
                  </h3>

                  <div className="kars-weather-bottom">
                    <span>
                      Hissedilen:{" "}
                      {weather.apparent}°C
                    </span>

                    <span>
                      Nem: %{weather.humidity}
                    </span>

                    <span>
                      Rüzgâr: {weather.wind} km/sa
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {/* Karşılaştırma özeti */}
            <div className="kars-summary">
              <p className="kars-eyebrow">
                KARŞILAŞTIRMA ÖZETİ
              </p>

              <h2>
                İki Şehir Arasındaki Farklar
              </h2>

              <div className="kars-summary-grid">
                <div className="kars-summary-item">
                  <span>SICAKLIK FARKI</span>

                  <strong>{fark}°C</strong>

                  <small>
                    İki şehir arasındaki fark
                  </small>
                </div>

                <div className="kars-summary-item">
                  <span>DAHA SICAK ŞEHİR</span>

                  <strong>
                    {results[0].temperature ===
                    results[1].temperature
                      ? "Eşit"
                      : results[0].temperature >
                        results[1].temperature
                      ? cities[first].name
                      : cities[second].name}
                  </strong>

                  <small>
                    Güncel sıcaklığa göre
                  </small>
                </div>

                <div className="kars-summary-item">
                  <span>DAHA NEMLİ ŞEHİR</span>

                  <strong>
                    {results[0].humidity ===
                    results[1].humidity
                      ? "Eşit"
                      : results[0].humidity >
                        results[1].humidity
                      ? cities[first].name
                      : cities[second].name}
                  </strong>

                  <small>
                    Bağıl nem oranına göre
                  </small>
                </div>

                <div className="kars-summary-item">
                  <span>DAHA RÜZGÂRLI ŞEHİR</span>

                  <strong>
                    {results[0].wind ===
                    results[1].wind
                      ? "Eşit"
                      : results[0].wind >
                        results[1].wind
                      ? cities[first].name
                      : cities[second].name}
                  </strong>

                  <small>
                    Rüzgâr hızına göre
                  </small>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Sayfa altı */}
        <footer className="kars-footer">
          <strong>METEOROLOJİ</strong>
          <span>
            Şehir Karşılaştırma Merkezi
          </span>
        </footer>

      </div>
    </main>
  );
}
