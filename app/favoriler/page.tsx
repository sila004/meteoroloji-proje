
"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  cities,
  getWeather,
  weatherDescription,
  type Weather,
} from "../lib/weather";
import "./favoriler.css";
import { useWeatherLibrary } from "../components/WeatherLibraryProvider";
import { parseFavorites, readFavorites, storeFavorites, subscribeFavorites } from "../lib/favorites";

// Arama yapılabilen şehir seçme kutusu
function CitySearch({
  selected,
  onChange,
}: {
  selected: number;
  onChange: (index: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
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

  function chooseCity(index: number) {
    onChange(index);
    setOpen(false);
    setSearch("");
  }

  return (
    <div className="fav-dropdown-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="fav-dropdown-button"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          setSearch("");
        }}
      >
        <span>{cities[selected].name}</span>
        <span aria-hidden="true">
          {open ? "⌃" : "⌄"}
        </span>
      </button>

      {open && (
        <div className="fav-dropdown">
          <input
            ref={inputRef}
            type="text"
            className="fav-search-input"
            placeholder="Şehir ara..."
            aria-label="Şehir ara"
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
                chooseCity(filteredCities[0].index);
              }
            }}
          />

          <div className="fav-city-list">
            {filteredCities.length === 0 && (
              <p className="fav-no-result">
                Şehir bulunamadı.
              </p>
            )}

            {filteredCities.map((city) => (
              <button
                key={city.name}
                type="button"
                className="fav-city-option"
                onClick={() => chooseCity(city.index)}
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

// Favori şehirlerin hava durumu kartı
function FavoriteWeatherCard({
  name,
  onRemove,
  disabled,
}: {
  name: string;
  onRemove: (name: string) => void;
  disabled: boolean;
}) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const city = cities.find((item) => item.name === name);

    let active = true;

    const request = city ? getWeather(city) : Promise.reject(new Error("Şehir bulunamadı."));
    request
      .then((data) => {
        if (active) {
          setWeather(data);
        }
      })
      .catch(() => {
        if (active) {
          setError(city ? "Hava durumu alınamadı." : "Şehir bulunamadı.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [name]);

  return (
    <article className="fav-weather-card">
      <div className="fav-orbit" />

      <div className="fav-weather-top">
        <span>{name}</span>

        <button
          type="button"
          className="fav-remove-button"
          disabled={disabled}
          onClick={() => onRemove(name)}
          aria-label={`${name} favorilerden çıkar`}
          title="Favorilerden çıkar"
        >
          ★
        </button>
      </div>

      {loading && (
        <p className="fav-status">
          Hava durumu yükleniyor...
        </p>
      )}

      {error && (
        <p className="fav-status">
          {error}
        </p>
      )}

      {!loading && !error && weather && (
        <>
          <div className="fav-weather-body">
            <div>
              <div className="fav-temperature">
                {Math.round(weather.temperature)}
                <span>°C</span>
              </div>

              <h3>
                {weatherDescription(weather.code)}
              </h3>
            </div>

            <span
              className="fav-weather-symbol"
              aria-hidden="true"
            >
              🌤️
            </span>
          </div>

          <div className="fav-weather-bottom">
            <span>
              Nem: %{weather.humidity}
            </span>

            <span>
              Rüzgâr: {weather.wind} km/sa
            </span>
          </div>
        </>
      )}
    </article>
  );
}

export default function Favoriler() {
  const { library, loading: accountLoading, error: accountError, favorite } = useWeatherLibrary();
  const stored = useSyncExternalStore(subscribeFavorites, readFavorites, () => null);
  const guestFavorites = parseFavorites(stored);
  const [selected, setSelected] = useState(0);
  const ready = stored !== null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const favorites = library ? library.favorites : guestFavorites;
  const disabled = !ready || accountLoading || !!accountError || busy;
  const importable = guestFavorites.filter(name => !favorites.includes(name));

  // Favoriye ekle veya favoriden kaldır
  async function changeFavorite(name: string, add: boolean) {
    if (disabled) return;
    setBusy(true);
    setError("");
    try {
      if (library) {
        await favorite(name, add);
      } else {
        storeFavorites(add ? [...favorites, name] : favorites.filter(item => item !== name));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Favoriler kaydedilemedi. Tekrar dene.");
    } finally { setBusy(false); }
  }

  function toggleFavorite() {
    const name = cities[selected].name;
    void changeFavorite(name, !favorites.includes(name));
  }

  // Kart üzerindeki yıldızdan favori kaldır
  function removeFavorite(name: string) {
    void changeFavorite(name, false);
  }

  async function importFavorites() {
    setBusy(true);
    setError("");
    try {
      for (const name of importable) await favorite(name, true);
    } catch {
      setError("Aktarım tamamlanamadı. Aktarılmayan şehirler için yeniden deneyebilirsin.");
    } finally { setBusy(false); }
  }

  const alreadyFavorite = favorites.includes(
    cities[selected].name
  );

  return (
    <main className="fav-page">
      <div className="fav-container">

        <header className="fav-heading">
          <p className="fav-eyebrow">
            METEOROLOJİ / KİŞİSEL TAKİP
          </p>

          <h1>Favori Şehirlerim</h1>

          <p className="fav-subtitle">
            Takip etmek istediğin şehirleri kaydet.
            Favori şehirlerinin güncel hava durumunu
            tek ekranda görüntüle.
          </p>
        </header>
        {!accountLoading && !library && !accountError && <p className="library-notice">Şu an favorilerin yalnızca bu tarayıcıda saklanıyor.</p>}
        {library && importable.length > 0 && <div className="library-notice">
          Bu tarayıcıda hesabına eklenmemiş {importable.length} favori şehir var.{" "}
          <button type="button" disabled={disabled} onClick={() => void importFavorites()}>Favorilerimi hesabıma aktar</button>
        </div>}
        {error && <p className="library-notice library-error" role="alert">{error}</p>}

        <section className="fav-section">
          <div className="fav-section-heading">
            <div>
              <p className="fav-eyebrow">
                FAVORİ YÖNETİMİ
              </p>

              <h2>Şehir Ekle</h2>
            </div>

          </div>

          <div className="fav-add-card">
            <div className="fav-add-info">
              <span className="fav-small-label">
                ŞEHİR SEÇİMİ
              </span>

              <h3>
                {cities[selected].name}
              </h3>

              <p>
                Şehir seçerek favorilerine ekleyebilir
                veya favorilerinden kaldırabilirsin.
              </p>
            </div>

            <div className="fav-add-actions">
              <CitySearch
                selected={selected}
                onChange={setSelected}
              />

              <button
                type="button"
                className={`fav-add-button ${
                  alreadyFavorite
                    ? "fav-remove-active"
                    : ""
                }`}
                onClick={toggleFavorite}
                disabled={disabled}
              >
                {alreadyFavorite
                  ? " Favorilerden Kaldır"
                  : " Favorilere Ekle"}
              </button>
            </div>
          </div>
        </section>

        <section className="fav-section">
          <div className="fav-section-heading">
            <div>
              <p className="fav-eyebrow">
                KAYDEDİLEN ŞEHİRLER
              </p>

              <h2>Favori Listem</h2>
            </div>

            <span>
              {ready ? favorites.length : "—"} şehir
            </span>
          </div>

          {(!ready || accountLoading) && (
            <div className="fav-empty">
              Favoriler yükleniyor...
            </div>
          )}

          {ready && !accountLoading && !accountError && favorites.length === 0 && (
            <div className="fav-empty">
              <span className="fav-empty-icon">
               
              </span>

              <h3>
                Henüz favori şehrin yok
              </h3>

              <p>
                Yukarıdaki şehir seçme alanından
                ilk favori şehrini ekleyebilirsin.
              </p>
            </div>
          )}

          {ready && !accountLoading && !accountError && favorites.length > 0 && (
            <div className="fav-weather-grid">
              {favorites.map((name) => (
                <FavoriteWeatherCard
                  key={name}
                  name={name}
                  onRemove={removeFavorite}
                  disabled={disabled}
                />
              ))}
            </div>
          )}
        </section>

        <div className="fav-back">
          <Link href="/">
            ← Ana Sayfaya Dön
          </Link>
        </div>

        <footer className="fav-footer">
          <strong>METEOROLOJİ</strong>
          <span>Favori Şehir Takip Merkezi</span>
        </footer>

      </div>
    </main>
  );
}
