
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  cities,
  getWeather,
  weatherDescription,
  type Weather,
} from "../lib/weather";
import "./favoriler.css";

const STORAGE_KEY = "meteoroloji-favoriler";

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
}: {
  name: string;
  onRemove: (name: string) => void;
}) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const city = cities.find((item) => item.name === name);

    if (!city) {
      setError("Şehir bulunamadı.");
      setLoading(false);
      return;
    }

    let active = true;

    getWeather(city)
      .then((data) => {
        if (active) {
          setWeather(data);
        }
      })
      .catch(() => {
        if (active) {
          setError("Hava durumu alınamadı.");
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
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selected, setSelected] = useState(0);
  const [ready, setReady] = useState(false);

  // Kaydedilen favorileri tarayıcıdan yükle
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      if (Array.isArray(saved)) {
        const valid = saved.filter(
          (name): name is string =>
            typeof name === "string" &&
            cities.some((city) => city.name === name)
        );

        setFavorites([...new Set(valid)]);
      }
    } catch {
      setFavorites([]);
    }

    setReady(true);
  }, []);

  // Favorileri kaydet
  function updateFavorites(next: string[]) {
    setFavorites(next);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(next)
      );
    } catch {
      // Depolama kullanılamasa da sayfa çalışır.
    }
  }

  // Favoriye ekle veya favoriden kaldır
  function toggleFavorite() {
    const name = cities[selected].name;

    if (favorites.includes(name)) {
      updateFavorites(
        favorites.filter((item) => item !== name)
      );
    } else {
      updateFavorites([...favorites, name]);
    }
  }

  // Kart üzerindeki yıldızdan favori kaldır
  function removeFavorite(name: string) {
    updateFavorites(
      favorites.filter((item) => item !== name)
    );
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

        <section className="fav-section">
          <div className="fav-section-heading">
            <div>
              <p className="fav-eyebrow">
                FAVORİ YÖNETİMİ
              </p>

              <h2>Şehir Ekle</h2>
            </div>

            <span>
              Şehirlerini kişiselleştir
            </span>
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
                disabled={!ready}
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

          {!ready && (
            <div className="fav-empty">
              Favoriler yükleniyor...
            </div>
          )}

          {ready && favorites.length === 0 && (
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

          {ready && favorites.length > 0 && (
            <div className="fav-weather-grid">
              {favorites.map((name) => (
                <FavoriteWeatherCard
                  key={name}
                  name={name}
                  onRemove={removeFavorite}
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
