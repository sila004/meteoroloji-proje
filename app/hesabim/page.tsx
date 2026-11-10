"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { accountRequest, AccountApiError, notifyAccountChanged, type MailStatus, type WeatherAccount } from "../lib/account";
import "./hesabim.css";

export default function WeatherAccountPage() {
  return <Suspense fallback={<main className="account-page"><p role="status">Hesap yükleniyor…</p></main>}><WeatherAccountContent /></Suspense>;
}

function WeatherAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminLogin = searchParams.get("next") === "/admin";
  const [account, setAccount] = useState<WeatherAccount | null>(null);
  const [status, setStatus] = useState<MailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [city, setCity] = useState("İstanbul");
  const [deliveryTime, setDeliveryTime] = useState("07:00");
  const [dailyEnabled, setDailyEnabled] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const service = await accountRequest<MailStatus>("/status", "GET", undefined, controller.signal);
        if (controller.signal.aborted) return;
        setStatus(service);
        try {
          const profile = await accountRequest<WeatherAccount>("/me", "GET", undefined, controller.signal);
          if (controller.signal.aborted) return;
          setAccount(profile);
          setCity(profile.city);
          setDeliveryTime(profile.deliveryTime);
          setDailyEnabled(profile.dailyEnabled);
          if (adminLogin && profile.isAdmin) router.replace("/admin");
        } catch (err) {
          if (!(err instanceof AccountApiError && err.status === 401)) throw err;
          if (!controller.signal.aborted) setAccount(null);
        }
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof AccountApiError ? err.message : "Hesap bilgileri şu anda yüklenemiyor. Biraz sonra tekrar dene.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [reload, adminLogin, router]);

  useEffect(() => {
    const update = () => setCountdown(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [resendAt]);

  async function action(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try { await work(); }
    catch (err) {
      if (err instanceof AccountApiError && err.status === 401) { setAccount(null); setChallengeId(""); }
      setError(err instanceof Error ? err.message : "İşlem tamamlanamadı.");
    } finally { setBusy(false); }
  }

  async function requestCode() {
    await action(async () => {
      const result = await accountRequest<{ challengeId: string; message: string }>("/request-code", "POST", { email });
      setChallengeId(result.challengeId);
      setCode("");
      setResendAt(Date.now() + 60000);
      setNotice(result.message);
    });
  }

  async function verify() {
    await action(async () => {
      const profile = await accountRequest<WeatherAccount>("/verify", "POST", { challengeId, code });
      notifyAccountChanged();
      setAccount(profile);
      setCity(profile.city);
      setDeliveryTime(profile.deliveryTime);
      setDailyEnabled(profile.dailyEnabled);
      setChallengeId("");
      setCode("");
      if (adminLogin && profile.isAdmin) {
        router.replace("/admin");
        return;
      }
      if (adminLogin) {
        setNotice("Giriş yaptın. Bu hesabın yönetici yetkisi bulunmuyor; hesap tercihlerini buradan yönetebilirsin.");
        return;
      }
      setNotice("Giriş yaptın. Şehrini seçip günlük mail tercihini kaydedebilirsin.");
    });
  }

  async function save() {
    await action(async () => {
      const profile = await accountRequest<WeatherAccount>("/subscription", "PUT", { city, deliveryTime, dailyEnabled });
      setAccount(profile);
      setNotice(profile.dailyEnabled ? "Tercihlerin kaydedildi. Hava özetin seçtiğin saatte gelecek." : "Tercihlerin kaydedildi. Günlük mailler kapalı.");
    });
  }

  const dirty = account && (city !== account.city || deliveryTime !== account.deliveryTime || dailyEnabled !== account.dailyEnabled);

  return (
    <main className="account-page">
      <div className="account-container">
        <header className="account-header">
          <p className="eyebrow">{adminLogin ? "METEOROLOJİ / YÖNETİCİ GİRİŞİ" : "SANA ÖZEL METEOROLOJİ"}</p>
          <h1>{adminLogin ? "Yönetici hesabına giriş yap." : "Güne hazırlıklı başla."}</h1>
          <p>{adminLogin ? "Yetkili e-posta adresine gelen kodla giriş yap. Doğrulama sonrası Yönetim Merkezi açılır." : "Yaşadığın şehrin hava durumu, her sabah mail kutunda."}</p>
        </header>

          <section className="account-panel" aria-labelledby="account-title">
            <p className="eyebrow">{account ? "HAVA POSTASI" : "MAİL İLE GİRİŞ"}</p>
            <h2 id="account-title">{account ? "Günlük hava özetim" : "Hava durumun sana gelsin."}</h2>
            {loading && <p role="status" className="account-message">Hesabın kontrol ediliyor…</p>}
            {!loading && !status && <button className="account-button" onClick={() => setReload(value => value + 1)}>Tekrar dene</button>}

            {!loading && status && !status.mailReady && (
              <div className="account-setup" role="status">
                <strong>Mail ile giriş şu anda kullanılamıyor.</strong>
                <p>Lütfen daha sonra tekrar dene.</p>
              </div>
            )}
            {status?.developmentPickup && <p className="account-setup">Geliştirme modu: mailler yalnız sunucudaki yerel klasöre yazılır, gerçek gönderim yapılmaz.</p>}

            {!loading && status && !account && (
              <form onSubmit={event => { event.preventDefault(); if (challengeId) void verify(); else void requestCode(); }}>
                <p className="account-description">Şifre hatırlamana gerek yok. Mailine gelen 6 haneli kodla giriş yap.</p>
                <label htmlFor="account-email">Mail adresin</label>
                <input id="account-email" type="email" autoComplete="email" required maxLength={254}
                  placeholder="ornek@mail.com" value={email} readOnly={!!challengeId} disabled={busy}
                  onChange={event => setEmail(event.target.value)} />
                {challengeId && (
                  <>
                    <label htmlFor="account-code">6 haneli giriş kodu</label>
                    <input id="account-code" className="account-code" type="text" inputMode="numeric"
                      autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required
                      value={code} disabled={busy} onChange={event => setCode(event.target.value.replace(/\D/g, ""))} />
                    <p className="account-hint">Kod 10 dakika geçerli. Spam klasörünü de kontrol edebilirsin.</p>
                  </>
                )}
                <button className="account-button" type="submit" disabled={busy || !status.mailReady}>
                  {busy ? "İşlem yapılıyor…" : challengeId ? "Doğrula ve giriş yap" : "Giriş kodu gönder"}
                </button>
                {challengeId && <div className="account-secondary-actions">
                  <button type="button" disabled={busy || countdown > 0} onClick={() => void requestCode()}>
                    {countdown > 0 ? `Tekrar gönder (${countdown} sn)` : "Kodu tekrar gönder"}
                  </button>
                  <button type="button" disabled={busy} onClick={() => { setChallengeId(""); setCode(""); setNotice(""); setError(""); }}>Mail adresini değiştir</button>
                </div>}
                <p className="account-hint">Giriş yapmak günlük maili otomatik açmaz. Bu tercihi hesabından sen belirlersin.</p>
              </form>
            )}

            {!loading && account && status && (
              <form onSubmit={event => { event.preventDefault(); void save(); }}>
                <div className="account-identity"><span>Giriş yapılan adres</span><strong>{account.email}</strong></div>
                {account.isAdmin && <Link href="/admin" className="account-button account-button-secondary" style={{ textAlign: "center" }}>Yönetim Merkezi’ni aç →</Link>}
                <label htmlFor="account-city">Yaşadığın şehir</label>
                <select id="account-city" value={city} disabled={busy} onChange={event => setCity(event.target.value)}>
                  {status.cities.map(name => <option key={name}>{name}</option>)}
                </select>
                <label htmlFor="account-time">Mailin gelsin istediğin saat</label>
                <input id="account-time" type="time" required value={deliveryTime} disabled={busy} onChange={event => setDeliveryTime(event.target.value)} />
                <p className="account-hint">Türkiye saati (Europe/Istanbul). Varsayılan: her sabah 07:00.</p>
                <label className="account-checkbox">
                  <input type="checkbox" checked={dailyEnabled} disabled={busy} onChange={event => setDailyEnabled(event.target.checked)} />
                  <span><strong>Her gün hava özeti almak istiyorum</strong><small>Seçtiğim şehrin günlük tahmini mail adresime gönderilsin.</small></span>
                </label>
                {dirty && <p className="account-hint">Kaydedilmemiş değişikliklerin var.</p>}
                <button className="account-button" type="submit" disabled={busy}>{busy ? "İşlem yapılıyor…" : "Tercihlerimi kaydet"}</button>
                {account.dailyEnabled && account.nextDeliveryUtc && !dirty && (
                  <p className="account-hint">İlk / sonraki gönderim: {new Date(account.nextDeliveryUtc).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "long", timeStyle: "short" })}</p>
                )}
                <button className="account-button account-button-secondary" type="button" disabled={busy || !!dirty || !status.mailReady}
                  onClick={() => void action(async () => {
                    const result = await accountRequest<{ message: string }>("/test-mail", "POST"); setNotice(result.message);
                  })}>Bana bir test maili gönder</button>
                <p className="account-hint">Günlük mailleri buradan veya gelen maildeki bağlantıdan istediğin zaman durdurabilirsin.</p>
                <button className="account-logout" type="button" disabled={busy} onClick={() => void action(async () => {
                  await accountRequest("/logout", "POST"); notifyAccountChanged(); setAccount(null); setEmail(""); setNotice("Çıkış yapıldı.");
                })}>Hesaptan çıkış yap</button>
              </form>
            )}

            {error && <p className="account-error" role="alert">{error}</p>}
            {notice && <p className="account-success" role="status">{notice}</p>}
          </section>

      </div>
    </main>
  );
}
