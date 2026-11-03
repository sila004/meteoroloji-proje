
"use client";

import { useEffect, useRef, useState } from "react";
import {
  cities,
  getAirQuality,
  aqiDescription,
  type AirQuality,
} from "../lib/weather";
import "./hava-kalitesi.css";

export default function HavaKalitesi() {
  const [selected, setSelected] = useState(0);
  const [air, setAir] = useState<AirQuality | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const city = cities[selected];

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      setAir(null);

      try {
        const data = await getAirQuality(city);
        if (active) setAir(data);
      } catch {
        if (active) {
          setError("Hava kalitesi verileri alınamadı.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [city]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const filteredCities = cities
    .map((item, index) => ({ ...item, index }))
    .filter((item) =>
      item.name
        .toLocaleLowerCase("tr-TR")
        .includes(search.toLocaleLowerCase("tr-TR"))
    );

  const pollutants = air
    ? [
        {
          label: "PM2.5",
          name: "İnce Partikül Madde",
          value: air.pm25,
          icon: "◌",
        },
        {
          label: "PM10",
          name: "Partikül Madde",
          value: air.pm10,
          icon: "◉",
        },
        {
          label: "OZON",
          name: "Ozon (O₃)",
          value: air.ozone,
          icon: "◎",
        },
        {
          label: "NO₂",
          name: "Azot Dioksit",
          value: air.nitrogenDioxide,
          icon: "◇",
        },
      ]
    : [];

  return (
    <main className="air-page">
      <div className="air-container">

        <header className="air-heading">
          <p className="air-eyebrow">
            METEOROLOJİ / ÇEVRE ANALİZİ
          </p>
          <h1>Detaylı Hava Kalitesi</h1>
          <p className="air-subtitle">
             
          </p>
        </header>

        <section className="air-section">
          <div className="air-section-heading">
            <div>
              <p className="air-eyebrow">
                KONUM SEÇİMİ
              </p>
              <h2>Şehir Seç</h2>
            </div>
            <span>Türkiye hava kalitesi verileri</span>
          </div>

          <div className="air-selector-card">
            <div className="air-selector-info">
              <span className="air-small-label">
                SEÇİLİ ŞEHİR
              </span>
              <h3>{city.name}</h3>
              <p>
                Hava kalitesi bilgilerini görüntülemek
                için şehir seçiniz..
              </p>
            </div>

            <div className="air-dropdown-wrapper" ref={dropdownRef}>
              <button
                type="button"
                className="air-dropdown-button"
                aria-expanded={open}
                onClick={() => {
                  setOpen(!open);
                  setSearch("");
                }}
              >
                <span> {city.name}</span>
                <span aria-hidden="true">
                  {open ? "⌃" : "⌄"}
                </span>
              </button>

              {open && (
                <div className="air-dropdown">
                  <input
                    ref={inputRef}
                    type="text"
                    className="air-search-input"
                    placeholder="Şehir ara..."
                    aria-label="Şehir ara"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setOpen(false);
                      }

                      if (
                        e.key === "Enter" &&
                        filteredCities.length > 0
                      ) {
                        setSelected(filteredCities[0].index);
                        setOpen(false);
                        setSearch("");
                      }
                    }}
                  />

                  <div className="air-city-list">
                    {filteredCities.length === 0 && (
                      <p className="air-no-result">
                        Şehir bulunamadı.
                      </p>
                    )}

                    {filteredCities.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        className="air-city-option"
                        onClick={() => {
                          setSelected(item.index);
                          setOpen(false);
                          setSearch("");
                        }}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="air-section">
          <div className="air-section-heading">
            <div>
              <p className="air-eyebrow">
                GÜNCEL HAVA KALİTESİ
              </p>
              <h2>Hava Kalitesi Analizi</h2>
            </div>
          </div>

          {loading && (
            <div className="air-message">
              Hava kalitesi verileri yükleniyor...
            </div>
          )}

          {error && (
            <div className="air-message air-error">
              {error}
            </div>
          )}

          {air && !loading && (
            <>
              <div className="air-hero">
                <div className="air-orbit" />
                <div className="air-orbit air-orbit-two" />

                <div className="air-hero-top">
                  <span> {city.name}</span>
                  <span className="air-live">
                    GÜNCEL VERİLER
                  </span>
                </div>

                <div className="air-hero-body">
                  <div>
                    <p className="air-hero-label">
                      AVRUPA HAVA KALİTESİ İNDEKSİ
                    </p>

                    <div className="air-aqi-value">
                      {air.aqi ?? "—"}
                    </div>

                    <h3>
                      {air.aqi == null
                        ? "Veri bulunamadı"
                        : aqiDescription(air.aqi)}
                    </h3>

                    <p className="air-hero-description">
                      {city.name} için güncel hava
                      kalitesi göstergeleri
                    </p>
                  </div>

                  <div className="air-hero-symbol" aria-hidden="true">
                    ◉
                  </div>
                </div>

                <div className="air-hero-bottom">
                  <span>
                    Avrupa Hava Kalitesi İndeksi
                  </span>
                  <span>
                    Seçili konum: {city.name}
                  </span>
                </div>
              </div>

              <div className="air-pollutant-heading">
                <p className="air-eyebrow">
                  HAVA KİRLİLİĞİ GÖSTERGELERİ
                </p>
                <h2>Kirletici Madde Değerleri</h2>
              </div>

              <div className="air-metrics">
                {pollutants.map((item) => (
                  <article
                    className="air-metric"
                    key={item.label}
                  >
                    <div className="air-metric-top">
                      <span>{item.label}</span>
                      <span className="air-metric-icon">
                        {item.icon}
                      </span>
                    </div>

                    <h3>{item.name}</h3>

                    <div className="air-metric-value">
                      {item.value ?? "—"}
                      <small>µg/m³</small>
                    </div>

                    <p>Güncel konsantrasyon</p>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="air-section">
          <div className="air-info-card">
            <p className="air-eyebrow">
              BİLGİLENDİRME
            </p>

            <h2>Hava Kalitesi Neden Önemlidir?</h2>

            <p>
              Hava kalitesi, soluduğumuz havadaki
              kirleticilerin yoğunluğunu ifade eder.
              PM2.5 ve PM10 havada bulunan küçük
              parçacıkları, ozon ve azot dioksit ise
              hava kalitesini etkileyen gazları gösterir.
            </p>

            <div className="air-info-grid">
              <div>
                <strong>PM2.5</strong>
                <span>
                  Çapı 2,5 mikrometre veya daha küçük
                  parçacıklardır.
                </span>
              </div>

              <div>
                <strong>PM10</strong>
                <span>
                  Çapı 10 mikrometre veya daha küçük
                  parçacıklardır.
                </span>
              </div>

              <div>
                <strong>Ozon (O₃)</strong>
                <span>
                  Yer seviyesinde hava kirliliğine
                  katkıda bulunabilen gazdır.
                </span>
              </div>

              <div>
                <strong>Azot Dioksit (NO₂)</strong>
                <span>
                  Özellikle yanma süreçleriyle ilişkili
                  bir hava kirleticisidir.
                </span>
              </div>
            </div>
          </div>
        </section>

        <footer className="air-footer">
          <strong>METEOROLOJİ</strong>
          <span>Hava Kalitesi Analiz Merkezi</span>
        </footer>
      </div>
    </main>
  );
}
