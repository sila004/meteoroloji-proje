
"use client";

import { useEffect, useRef, useState } from "react";
import {
  cities,
  getWeather,
  weatherDescription,
  type Weather,
} from "../lib/weather";
import "./karsilastir.css";
import { accountRequest } from "../lib/account";
import { type SavedComparison } from "../lib/comparisons";
import { LibraryNotice, useWeatherLibrary } from "../components/WeatherLibraryProvider";

// Arama yapılabilen şehir seçme kutusu
function CitySearch({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (index: number) => void;
  disabled: boolean;
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
        disabled={disabled}
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
              if (disabled) return;
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
                disabled={disabled}
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
  const { library, loading: accountLoading, error: accountError } = useWeatherLibrary();
  const [first, setFirst] = useState(0);
  const [second, setSecond] = useState(1);
  const [results, setResults] = useState<Weather[] | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<SavedComparison[]>([]);
  const [historyOwner, setHistoryOwner] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyRevision, setHistoryRevision] = useState(0);
  const [clearing, setClearing] = useState(false);
  const [clearRequested, setClearRequested] = useState(false);
  const [resultDate, setResultDate] = useState<string | null>(null);
  const [resultOwner, setResultOwner] = useState<string | null>(null);
  const owner = library?.email ?? null;
  const visibleHistory = historyOwner === owner ? history : [];
  const visibleResults = resultOwner === owner ? results : null;

  useEffect(() => {
    if (!owner) return;
    const controller = new AbortController();
    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError("");
      setHistory([]);
      try {
        const items = await accountRequest<SavedComparison[]>("/comparisons", "GET", undefined, controller.signal);
        if (!controller.signal.aborted) { setHistory(items); setHistoryOwner(owner); }
      } catch {
        if (!controller.signal.aborted) setHistoryError("Karşılaştırma geçmişin yüklenemedi.");
      } finally { if (!controller.signal.aborted) setHistoryLoading(false); }
    }
    void loadHistory();
    return () => controller.abort();
  }, [owner, historyRevision]);

  async function clearHistory() {
    setClearing(true);
    setHistoryError("");
    try {
      await accountRequest("/comparisons", "DELETE");
      setClearRequested(false);
      setHistoryRevision(value => value + 1);
    } catch {
      setHistoryError("Geçmiş temizlenemedi. Tekrar dene.");
    } finally { setClearing(false); }
  }

  function openHistory(item: SavedComparison) {
    const firstIndex = cities.findIndex(city => city.name === item.firstCity);
    const secondIndex = cities.findIndex(city => city.name === item.secondCity);
    if (firstIndex < 0 || secondIndex < 0) return;
    setFirst(firstIndex);
    setSecond(secondIndex);
    setResults([item.firstWeather, item.secondWeather]);
    setResultDate(item.comparedUtc);
    setResultOwner(owner);
    setError("");
  }

  async function compare() {
    if (first === second || loading || accountLoading || historyLoading || clearing || accountError) return;

    setLoading(true);
    setError("");
    setResults(null);
    setResultDate(null);

    try {
      if (library) {
        const item = await accountRequest<SavedComparison>("/comparisons", "POST", {
          firstCity: cities[first].name, secondCity: cities[second].name,
        });
        setResults([item.firstWeather, item.secondWeather]);
        setResultDate(item.comparedUtc);
        setHistoryRevision(value => value + 1);
      } else {
        setResults(await Promise.all([getWeather(cities[first]), getWeather(cities[second])]));
      }
      setResultOwner(owner);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Karşılaştırma yapılamadı. Lütfen tekrar dene."
      );
    } finally {
      setLoading(false);
    }
  }

  const fark = visibleResults
    ? Math.abs(
        visibleResults[0].temperature -
          visibleResults[1].temperature
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
            Türkiye’deki iki şehrin güncel hava
            koşullarını karşılaştır. Sıcaklık, nem ve
            rüzgâr değerlerini tek ekranda incele.
          </p>
        </header>
        <LibraryNotice>Son 50 kayıt saklanır.</LibraryNotice>

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
              disabled={loading || clearing}
              onChange={(index) => {
                setFirst(index);
                setResults(null);
                setError("");
              }}
            />

            <CitySearch
              label="02 / İKİNCİ ŞEHİR"
              value={second}
              disabled={loading || clearing}
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
                loading || accountLoading || historyLoading || clearing || !!accountError || first === second
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
        {visibleResults && (
          <section className="kars-section">
            <div className="kars-section-heading">
              <div>
                <p className="kars-eyebrow">
                  GÜNCEL METEOROLOJİ VERİLERİ
                </p>
                <h2>Karşılaştırma Sonuçları</h2>
                {resultDate && <p className="library-notice">Kayıt zamanı: {new Date(resultDate).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}. Bu değerler karşılaştırma anına aittir. Güncellemek için yeniden karşılaştır.</p>}
              </div>
            </div>

            <div className="kars-result-grid">
              {visibleResults.map((weather, index) => (
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
                      {resultDate ? "KAYITLI SONUÇ" : "GÜNCEL VERİ"}
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
                    {visibleResults[0].temperature ===
                    visibleResults[1].temperature
                      ? "Eşit"
                      : visibleResults[0].temperature >
                        visibleResults[1].temperature
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
                    {visibleResults[0].humidity ===
                    visibleResults[1].humidity
                      ? "Eşit"
                      : visibleResults[0].humidity >
                        visibleResults[1].humidity
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
                    {visibleResults[0].wind ===
                    visibleResults[1].wind
                      ? "Eşit"
                      : visibleResults[0].wind >
                        visibleResults[1].wind
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

        {library && <section className="library-history" aria-labelledby="comparison-history-title">
          <h2 id="comparison-history-title">Karşılaştırma Geçmişim</h2>
          {historyLoading && <p role="status">Geçmiş yükleniyor…</p>}
          {historyError && <p className="library-error" role="alert">{historyError} <button type="button" disabled={clearing || loading} onClick={() => setHistoryRevision(value => value + 1)}>Tekrar dene</button></p>}
          {!historyLoading && !historyError && visibleHistory.length === 0 && <p>Henüz kayıtlı karşılaştırman yok. İki şehir seçip karşılaştırarak başlayabilirsin.</p>}
          {!historyLoading && visibleHistory.length > 0 && <>
            <ul>{visibleHistory.map(item => <li key={item.id}>
              <div><strong>{item.firstCity} ({item.firstWeather.temperature}°C) / {item.secondCity} ({item.secondWeather.temperature}°C)</strong>
                <small>{new Date(item.comparedUtc).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}</small></div>
              <button type="button" disabled={loading || clearing} onClick={() => openHistory(item)}>Kaydı görüntüle</button>
            </li>)}</ul>
            {clearRequested ? <p>Hesabındaki bütün karşılaştırma geçmişi silinsin mi?{" "}
              <button type="button" disabled={clearing || loading} onClick={() => void clearHistory()}>{clearing ? "Temizleniyor…" : "Evet, geçmişimi sil"}</button>{" "}
              <button type="button" disabled={clearing} onClick={() => setClearRequested(false)}>Vazgeç</button>
            </p> : <button type="button" disabled={loading || clearing} onClick={() => setClearRequested(true)}>Geçmişimi temizle</button>}
          </>}
        </section>}

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
