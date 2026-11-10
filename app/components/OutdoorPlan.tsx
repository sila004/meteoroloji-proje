import { bestOutdoorHour, localMinute, type OutdoorForecast } from "../lib/outdoor";

export default function OutdoorPlan({ hourly, selectedDate, timezone, cityName, now }: {
  hourly: OutdoorForecast;
  selectedDate: string;
  timezone: string;
  cityName: string;
  now: number | null;
}) {
  if (now === null) return null;
  const result = bestOutdoorHour(hourly, selectedDate, localMinute(new Date(now), timezone));
  const dateLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", weekday: "long",
  });
  const hour = result.kind === "recommended" ? result.hour : null;
  const level = hour ? (hour.score >= 80 ? "Çok uygun" : hour.score >= 60 ? "Uygun" : "Görece uygun") : "";
  const endHour = hour ? `${String((Number(hour.time.slice(11, 13)) + 1) % 24).padStart(2, "0")}:00` : "";

  return (
    <section className={`outdoor-plan ${hour ? "" : "outdoor-plan-empty"}`} aria-labelledby="outdoor-title">
      <div className="outdoor-heading">
        <div>
          <p className="eyebrow">GÜNÜN PLANI</p>
          <h2 id="outdoor-title">Dışarı çıkmak için en iyi saat</h2>
          <p className="outdoor-location">{cityName} · {dateLabel}</p>
        </div>
        <span className="outdoor-symbol" aria-hidden="true">↗</span>
      </div>

      {hour ? (
        <>
          <div className="outdoor-result">
            <div className="outdoor-time"><time dateTime={hour.time}>{hour.time.slice(11, 16)}</time><span>–</span>{endHour}</div>
            <span className="outdoor-badge">{level}</span>
          </div>
          <p className="outdoor-description">Yürüyüş veya açık hava planın için kalan gündüz saatleri arasındaki en elverişli tahmin.</p>
          <dl className="outdoor-metrics">
            <div><dt>Hissedilen</dt><dd>{Math.round(hour.apparent)}°C</dd></div>
            <div><dt>Yağış olasılığı</dt><dd>%{Math.round(hour.rainProbability)}</dd></div>
            <div><dt>Rüzgâr</dt><dd>{Math.round(hour.wind)} <small>km/sa</small></dd></div>
            <div><dt>UV indeksi</dt><dd>{hour.uv.toFixed(1)}</dd></div>
          </dl>
        </>
      ) : (
        <div className="outdoor-empty" role="status">
          <h3>{result.kind === "no-daylight" ? "Kalan gündüz saati bulunmuyor" :
            result.kind === "missing" ? "Saat önerisi için yeterli veri yok" : "Koşullar dışarı çıkmak için elverişsiz"}</h3>
          <p>{result.kind === "no-daylight" ? "Başka bir günü seçerek uygun saatleri inceleyebilirsin." :
            result.kind === "missing" ? "Tahmin verilerini yenileyebilir veya başka bir gün seçebilirsin." :
            "Yağış, rüzgâr, sıcaklık veya UV nedeniyle kalan saatler için öneri oluşturulamadı. Başka bir güne göz atabilirsin."}</p>
        </div>
      )}
      <p className="outdoor-note">Gündüz saatleri; hissedilen sıcaklık, yağış, rüzgâr ve UV birlikte değerlendirilir. Saatler konumun yerel saatidir. Tahminler değişebilir.</p>
    </section>
  );
}
