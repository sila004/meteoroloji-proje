
"use client";

import { useState } from "react";
import Link from "next/link";
import "./rehber.css";

const konular = [
  {
    baslik: "Sıcaklık",
    kategori: "Temel Meteoroloji",
    aciklama:
      "Havanın ne kadar sıcak veya soğuk olduğunu gösterir. Genellikle Celsius (°C) ile ölçülür.",
    bilgi: "Hava sıcaklığı gün içinde değişebilir.",
    kisaltma: "°C",
  },
  {
    baslik: "Nem",
    kategori: "Temel Meteoroloji",
    aciklama:
      "Havadaki su buharı miktarını ifade eder. Bağıl nem yüzde (%) olarak gösterilir.",
    bilgi:
      "Yüksek nem, sıcak havanın daha bunaltıcı hissedilmesine neden olabilir.",
    kisaltma: "%",
  },
  {
    baslik: "Rüzgâr",
    kategori: "Hava Olayları",
    aciklama:
      "Havanın yüksek basınç alanlarından alçak basınç alanlarına doğru hareketidir.",
    bilgi:
      "Rüzgâr hızı genellikle km/sa veya m/sn ile ölçülür.",
    kisaltma: "km/h",
  },
  {
    baslik: "Yağış",
    kategori: "Hava Olayları",
    aciklama:
      "Atmosferdeki suyun yağmur, kar veya dolu şeklinde yeryüzüne ulaşmasıdır.",
    bilgi:
      "Yağış miktarı genellikle milimetre (mm) ile ifade edilir.",
    kisaltma: "mm",
  },
  {
    baslik: "UV İndeksi",
    kategori: "Güneş ve Atmosfer",
    aciklama:
      "Güneşten gelen ultraviyole ışınlarının etkisini değerlendirmek için kullanılan göstergedir.",
    bilgi:
      "UV indeksi yükseldikçe güneşten korunmak daha önemli hale gelir.",
    kisaltma: "UV",
  },
  {
    baslik: "Hava Kalitesi",
    kategori: "Çevre",
    aciklama:
      "Havadaki kirleticilerin yoğunluğunu ve havanın sağlık açısından durumunu ifade eder.",
    bilgi:
      "Hava kalitesi PM2.5, PM10 ve diğer kirleticilerle değerlendirilebilir.",
    kisaltma: "AQI",
  },
  {
    baslik: "Atmosfer Basıncı",
    kategori: "Temel Meteoroloji",
    aciklama:
      "Atmosferdeki havanın yeryüzüne uyguladığı basınçtır. Genellikle hPa ile ölçülür.",
    bilgi:
      "Basınç değişimleri hava koşullarındaki değişimlerle ilişkili olabilir.",
    kisaltma: "hPa",
  },
  {
    baslik: "Hissedilen Sıcaklık",
    kategori: "Temel Meteoroloji",
    aciklama:
      "Sıcaklık, rüzgâr ve nem gibi etkenlere bağlı olarak havanın nasıl hissedildiğini ifade eder.",
    bilgi:
      "Ölçülen sıcaklık ile hissedilen sıcaklık aynı olmayabilir.",
    kisaltma: "°C",
  },
  {
    baslik: "Fırtına",
    kategori: "Hava Olayları",
    aciklama:
      "Kuvvetli rüzgârların etkili olduğu, bazen yağış ve gök gürültüsünün eşlik ettiği hava olayıdır.",
    bilgi:
      "Fırtınalı havalarda resmi meteorolojik uyarılar takip edilmelidir.",
    kisaltma: "WIND",
  },
  {
    baslik: "Gökkuşağı",
    kategori: "Güneş ve Atmosfer",
    aciklama:
      "Güneş ışığının su damlacıklarında kırılması, yansıması ve renklerine ayrılmasıyla oluşur.",
    bilgi:
      "Genellikle güneş ışığı ile yağmur damlacıkları birlikte bulunduğunda görülür.",
    kisaltma: "OPT",
  },
];

const kategoriler = [
  "Tümü",
  "Temel Meteoroloji",
  "Hava Olayları",
  "Güneş ve Atmosfer",
  "Çevre",
];

const sorular = [
  {
    soru: "Hava durumu ve iklim arasındaki fark nedir?",
    cevap:
      "Hava durumu, belirli bir yerde kısa süre içinde gerçekleşen atmosfer koşullarını ifade eder. İklim ise bir bölgenin uzun yıllar boyunca gözlemlenen hava koşullarının istatistiksel özellikleridir.",
  },
  {
    soru: "Hissedilen sıcaklık neden farklı olabilir?",
    cevap:
      "Hissedilen sıcaklık; hava sıcaklığına ek olarak nem, rüzgâr ve bazı hesaplama yöntemlerinde güneş ışınımı gibi faktörlerden etkilenir. Bu nedenle termometrenin gösterdiği değerle aynı olmayabilir.",
  },
  {
    soru: "Yağış ihtimali yüzde olarak ne anlama gelir?",
    cevap:
      "Yağış olasılığı, belirli bir konum ve zaman aralığında ölçülebilir yağış gerçekleşme ihtimalini gösterir. Örneğin %60 yağış olasılığı, o konumda belirtilen süre içinde yağış görülme ihtimalinin %60 olduğu anlamına gelir.",
  },
  {
    soru: "Hava kalitesi indeksi neyi gösterir?",
    cevap:
      "Hava kalitesi indeksi, havadaki kirletici maddelerin düzeylerini anlaşılır bir göstergeyle ifade eder. Kullanılan indeks sistemine göre değer aralıkları ve kategoriler farklı olabilir.",
  },
  {
    soru: "Meteorolojik tahminler neden değişebilir?",
    cevap:
      "Hava tahminleri atmosfer gözlemleri ve sayısal modeller kullanılarak hazırlanır. Yeni ölçümler geldikçe modeller güncellenir ve tahmin sonuçları değişebilir.",
  },
];

function konuId(baslik: string) {
  return (
    "konu-" +
    baslik
      .toLocaleLowerCase("tr-TR")
      .replace(/\s+/g, "-")
  );
}

export default function RehberPage() {
  const [arama, setArama] = useState("");
  const [kategori, setKategori] = useState("Tümü");
  const [acikSoru, setAcikSoru] = useState<number | null>(null);
  const [aramaAcik, setAramaAcik] = useState(true);

  const aranan = arama.trim().toLocaleLowerCase("tr-TR");

  // Sadece konu başlığındaki kelimelerin başlangıcını ara.
  const filtrelenmisKonular = konular.filter((konu) => {
    const baslik = konu.baslik.toLocaleLowerCase("tr-TR");
    const kelimeler = baslik.split(" ");

    const aramaUyumu =
      aranan === "" ||
      kelimeler.some((kelime) => kelime.startsWith(aranan));

    const kategoriUyumu =
      kategori === "Tümü" || konu.kategori === kategori;

    return aramaUyumu && kategoriUyumu;
  });

  function sonucaGit(baslik: string) {
    setAramaAcik(false);

    document.getElementById(konuId(baslik))?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  return (
    <main className="rehber-page">
      <div className="rehber-container">

        {/* Sayfa başlığı */}
        <header className="rehber-heading">
          <p className="rehber-eyebrow">
            METEOROLOJİ / BİLGİ MERKEZİ
          </p>

          <h1>Meteoroloji Rehberi</h1>

          <p className="rehber-subtitle">
            Hava durumunu daha iyi anlamak için meteoroloji
            terimlerini, atmosfer olaylarını ve temel
            hava tahmini kavramlarını keşfet.
          </p>
        </header>

        {/* Lacivert tanıtım kartı */}
        <section className="rehber-hero">
          <div className="rehber-orbit" />

          <div className="rehber-hero-content">
            <p className="rehber-hero-eyebrow">
              METEOROLOJİ BİLGİ PLATFORMU
            </p>

            <h2>
              Hava Durumu Rehberim 
              <span> </span>
            </h2>

            <p>
              
              Meteoroloji hakkında temel bilgiler ve sıkça sorulan sorular.
            </p>
          </div>

          <div
            className="rehber-hero-decoration"
            aria-hidden="true"
          >
            <div className="rehber-decoration-circle">
              <span>METEO</span>
              <strong>01</strong>
              <small>BİLGİ MERKEZİ</small>
            </div>
          </div>
        </section>

        {/* Arama ve kategoriler */}
        <section className="rehber-section">
          <div className="rehber-section-heading">
            <div>
              <p className="rehber-eyebrow">
                KONU KEŞFET
              </p>

              <h2>Ne Öğrenmek İstersin?</h2>
            </div>

            <span>
              Meteoroloji terimlerini ara ve filtrele
            </span>
          </div>

          <div className="rehber-search-panel">
            <label
              htmlFor="rehber-arama"
              className="rehber-search-label"
            >
              METEOROLOJİ TERİMİ ARA
            </label>

            <div className="rehber-search-wrapper">
              <input
                id="rehber-arama"
                type="search"
                placeholder="Konu ara... Örneğin: Nem, Rüzgâr, Basınç"
                value={arama}
                onChange={(e) => {
                  setArama(e.target.value);
                  setAramaAcik(true);
                }}
                onFocus={() => setAramaAcik(true)}
                className="rehber-search-input"
                autoComplete="off"
              />

              {aranan !== "" && aramaAcik && (
                <div className="rehber-search-results">
                  {filtrelenmisKonular.length > 0 ? (
                    filtrelenmisKonular.map((konu) => (
                      <button
                        key={konu.baslik}
                        type="button"
                        className="rehber-search-result"
                        onClick={() => sonucaGit(konu.baslik)}
                      >
                        <strong>{konu.baslik}</strong>
                        <span>{konu.kategori}</span>
                      </button>
                    ))
                  ) : (
                    <p className="rehber-search-no-result">
                      Bu kelimeyle ilgili konu bulunamadı.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="rehber-categories">
              {kategoriler.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setKategori(item);
                    setAramaAcik(true);
                  }}
                  className={`rehber-category-button ${
                    kategori === item ? "rehber-active" : ""
                  }`}
                  aria-pressed={kategori === item}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Meteoroloji sözlüğü */}
        <section className="rehber-section">
          <div className="rehber-section-heading">
            <div>
              <p className="rehber-eyebrow">
                TEMEL KAVRAMLAR
              </p>

              <h2>Meteoroloji Sözlüğü</h2>
            </div>

            <span>
              {filtrelenmisKonular.length} konu bulundu
            </span>
          </div>

          {filtrelenmisKonular.length > 0 ? (
            <div className="rehber-grid">
              {filtrelenmisKonular.map((konu, index) => (
                <article
                  key={konu.baslik}
                  id={konuId(konu.baslik)}
                  className="rehber-card"
                >
                  <div className="rehber-card-top">
                    <span className="rehber-card-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="rehber-card-symbol">
                      {konu.kisaltma}
                    </span>
                  </div>

                  <span className="rehber-card-category">
                    {konu.kategori}
                  </span>

                  <h3>{konu.baslik}</h3>

                  <p className="rehber-card-description">
                    {konu.aciklama}
                  </p>

                  <div className="rehber-card-info">
                    <span>EK BİLGİ</span>
                    <p>{konu.bilgi}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rehber-empty">
              <h3>Aradığın konu bulunamadı.</h3>

              <p>
                Farklı bir kelime arayabilir veya
                kategori filtresini değiştirebilirsin.
              </p>

              <button
                type="button"
                onClick={() => {
                  setArama("");
                  setKategori("Tümü");
                  setAramaAcik(false);
                }}
              >
                Filtreleri Temizle
              </button>
            </div>
          )}
        </section>

        {/* Sıkça sorulan sorular */}
        <section className="rehber-section">
          <div className="rehber-section-heading">
            <div>
              <p className="rehber-eyebrow">
                MERAK EDİLENLER
              </p>

              <h2>Sıkça Sorulan Sorular</h2>
            </div>

            <span>{sorular.length} soru ve cevap</span>
          </div>

          <div className="rehber-faq-list">
            {sorular.map((item, index) => (
              <div
                key={item.soru}
                className={`rehber-faq-item ${
                  acikSoru === index ? "rehber-faq-open" : ""
                }`}
              >
                <button
                  type="button"
                  className="rehber-faq-question"
                  aria-expanded={acikSoru === index}
                  onClick={() =>
                    setAcikSoru(
                      acikSoru === index ? null : index
                    )
                  }
                >
                  <span className="rehber-faq-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="rehber-faq-title">
                    {item.soru}
                  </span>

                  <span
                    className="rehber-faq-toggle"
                    aria-hidden="true"
                  >
                    {acikSoru === index ? "−" : "+"}
                  </span>
                </button>

                {acikSoru === index && (
                  <div className="rehber-faq-answer">
                    <p>{item.cevap}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Ana sayfaya dönüş */}
        <div className="rehber-back">
          <Link href="/">Ana Sayfaya Dön</Link>
        </div>

        <footer className="rehber-footer">
          <strong>METEOROLOJİ</strong>
          <span>Meteoroloji Bilgi Merkezi</span>
        </footer>

      </div>
    </main>
  );
}
