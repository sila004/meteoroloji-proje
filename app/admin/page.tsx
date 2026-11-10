"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AccountApiError } from "../lib/account";
import { adminRequest, deliveryError, type AdminOverview, type AdminAccount, type AdminDelivery, type AdminPage } from "../lib/admin";
import "./admin.css";

const dateTime = (value: string | null) => value ? new Date(value).toLocaleString("tr-TR", {
  timeZone: "Europe/Istanbul", dateStyle: "short", timeStyle: "short",
}) : "—";

export default function AdminPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [accounts, setAccounts] = useState<AdminPage<AdminAccount> | null>(null);
  const [deliveries, setDeliveries] = useState<AdminPage<AdminDelivery> | null>(null);
  const [tab, setTab] = useState<"accounts" | "deliveries">("accounts");
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [enabled, setEnabled] = useState("");
  const [result, setResult] = useState("");
  const [accountPage, setAccountPage] = useState(1);
  const [deliveryPage, setDeliveryPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [access, setAccess] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<AdminAccount | null>(null);
  const editor = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (editing && !editor.current?.open) editor.current?.showModal();
    if (!editing && editor.current?.open) editor.current.close();
  }, [editing]);

  useEffect(() => {
    const timer = setTimeout(() => { setTerm(search.trim()); setAccountPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const accountQuery = new URLSearchParams({ search: term, page: String(accountPage) });
        if (enabled) accountQuery.set("enabled", enabled);
        const deliveryQuery = new URLSearchParams({ page: String(deliveryPage) });
        if (result) deliveryQuery.set("succeeded", result);
        const [summary, members, history] = await Promise.all([
          adminRequest<AdminOverview>("/overview", "GET", undefined, controller.signal),
          adminRequest<AdminPage<AdminAccount>>(`/accounts?${accountQuery}`, "GET", undefined, controller.signal),
          adminRequest<AdminPage<AdminDelivery>>(`/deliveries?${deliveryQuery}`, "GET", undefined, controller.signal),
        ]);
        if (controller.signal.aborted) return;
        setOverview(summary); setAccounts(members); setDeliveries(history); setAccess(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof AccountApiError && [401, 403].includes(err.status)) {
          setAccess(err.status); setOverview(null); setAccounts(null); setDeliveries(null); setEditing(null);
        }
        setError(err instanceof Error ? err.message : "Panel şu anda yüklenemiyor.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [term, enabled, result, accountPage, deliveryPage, refresh]);

  async function action(work: () => Promise<{ message: string }>) {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await work();
      setNotice(response.message); setEditing(null); setRefresh(value => value + 1);
    } catch (err) {
      if (err instanceof AccountApiError && [401, 403].includes(err.status)) {
        setAccess(err.status); setOverview(null); setAccounts(null); setDeliveries(null); setEditing(null);
      }
      setError(err instanceof Error ? err.message : "İşlem tamamlanamadı.");
    } finally { setBusy(false); }
  }

  return (
    <main className="admin-page">
      <div className="admin-shell">
        <header className="admin-header">
          <div><p className="admin-eyebrow">METEOROLOJİ / YÖNETİM</p><h1>Yönetim Merkezi</h1>
            <p>Hava postası abonelikleri ve gönderimler, tek bir yerde.</p></div>
          <div className="admin-header-actions"><Link href="/">Siteyi görüntüle ↗</Link>
            <button disabled={loading || busy} onClick={() => setRefresh(value => value + 1)}>{loading ? "Yükleniyor…" : "Verileri yenile ↻"}</button></div>
        </header>

        {error && <p className="admin-alert admin-alert-error" role="alert">{error}</p>}
        {notice && <p className="admin-alert admin-alert-success" role="status">{notice}</p>}

        {!overview && <section className="admin-panel admin-gate">
          <span className="admin-gate-icon" aria-hidden="true">◇</span>
          <h2>{loading ? "Yönetici erişimi kontrol ediliyor" : access === 403 ? "Yönetici yetkisi gerekiyor" : access === 401 ? "Yönetici hesabınla giriş yap" : "Panele bağlanılamadı"}</h2>
          <p>{loading ? "Oturumun ve erişim iznin doğrulanıyor…" : access === 403 ? "Giriş yaptığın adresin sunucudaki yönetici listesinde tanımlanmış olması gerekiyor." : access === 401 ? "E-postana gelen kodla giriş yaptıktan sonra bu sayfaya dönebilirsin." : "API bağlantısını kontrol edip yeniden deneyebilirsin."}</p>
          {!loading && <Link className="admin-primary" href="/hesabim?next=%2Fadmin">{access === 403 ? "Hesabımı görüntüle" : "Yönetici hesabımla giriş yap"} →</Link>}
        </section>}

        {overview && <>
          <section className="admin-metrics" aria-label="Bugünün özeti">
            {[
              ["Toplam hesap", overview.totalAccounts, "Kayıtlı e-posta hesabı"],
              ["Aktif abonelik", overview.activeSubscriptions, "Günlük hava postası açık"],
              ["Bugün gönderilen", overview.sentToday, "Başarılı günlük gönderim"],
              ["Bugünkü hatalar", overview.failedToday, "Başarısız günlük deneme"],
            ].map(([label, value, hint], index) => <article className={`admin-metric admin-metric-${index}`} key={label}>
              <span>{label}</span><strong>{Number(value).toLocaleString("tr-TR")}</strong><small>{hint}</small>
            </article>)}
          </section>

          <div className="admin-service"><span className={`admin-dot ${overview.mailReady ? "admin-dot-ready" : ""}`} />
            <strong>{overview.developmentPickup ? "Yerel posta kutusu" : overview.mailReady ? "Mail gönderici hazır" : "Mail gönderici kapalı"}</strong>
            <span>{overview.developmentPickup ? "Geliştirme modu · gerçek mail gönderilmez" : "Günlük görev uygun kayıtları dakikada bir kontrol eder"}</span>
          </div>

          <section className="admin-panel" aria-busy={loading}>
            <nav className="admin-tabs" aria-label="Yönetim bölümleri">
              <button aria-current={tab === "accounts" ? "page" : undefined} onClick={() => setTab("accounts")}>Abonelikler <span>{overview.totalAccounts}</span></button>
              <button aria-current={tab === "deliveries" ? "page" : undefined} onClick={() => setTab("deliveries")}>Gönderim geçmişi</button>
            </nav>

            {tab === "accounts" && <>
              <div className="admin-section-header"><div><h2>Hava postası abonelikleri</h2><p>Hesapları bul, tercihleri düzenle ve gönderimleri takip et.</p></div></div>
              <div className="admin-filters"><label className="admin-search">Hesap veya şehir ara<input type="search" placeholder="E-posta adresi veya şehir…" maxLength={254} value={search} onChange={event => setSearch(event.target.value)} /></label>
                <label>Abonelik durumu<select value={enabled} onChange={event => { setEnabled(event.target.value); setAccountPage(1); }}><option value="">Tüm hesaplar</option><option value="true">Aktif abonelikler</option><option value="false">Kapalı abonelikler</option></select></label></div>
              <div className="admin-table-wrap"><table><caption className="admin-sr-only">Hava postası hesapları</caption><thead><tr><th scope="col">Hesap / şehir</th><th scope="col">Abonelik</th><th scope="col">Saat</th><th scope="col">Son günlük gönderim</th><th scope="col">İşlem</th></tr></thead>
                <tbody>{accounts?.items.map(account => <tr key={account.id}>
                  <td><strong>{account.email}</strong><small>{account.city}</small></td>
                  <td><span className={`admin-badge ${account.dailyEnabled ? "admin-badge-success" : ""}`}>{account.dailyEnabled ? "Aktif" : "Kapalı"}</span>{account.processing && <small>Gönderiliyor…</small>}</td>
                  <td>{account.deliveryTime}<small>Türkiye saati</small></td>
                  <td>{account.lastDelivery ? <><span className={`admin-badge ${account.lastDelivery.succeeded ? "admin-badge-success" : "admin-badge-error"}`}>{account.lastDelivery.succeeded ? "Başarılı" : "Başarısız"}</span><small>{dateTime(account.lastDelivery.attemptedUtc)}</small>{!account.lastDelivery.succeeded && <small>{deliveryError(account.lastDelivery.errorCode)}</small>}</> : <span className="admin-muted">Henüz kayıt yok</span>}</td>
                  <td><div className="admin-row-actions"><button disabled={busy || loading || account.processing} onClick={() => { setEditing(account); setNotice(""); }}>Düzenle</button>
                    {account.dailyEnabled && account.lastDelivery?.succeeded === false && <button disabled={busy || loading || account.processing || !overview.mailReady} onClick={() => void action(() => adminRequest(`/accounts/${account.id}/retry`, "POST"))}>Yeniden dene</button>}</div></td>
                </tr>)}</tbody></table></div>
              {accounts?.items.length === 0 && <div className="admin-empty"><h3>{term || enabled ? "Eşleşen hesap bulunamadı" : "Henüz bir hesap yok"}</h3><p>{term || enabled ? "Aramanı veya durum filtresini değiştirebilirsin." : "E-posta koduyla giriş yapan kullanıcılar burada listelenecek."}</p></div>}
              {accounts && <Pagination page={accountPage} total={accounts.total} pageSize={accounts.pageSize} disabled={loading || busy} onChange={setAccountPage} />}
            </>}

            {tab === "deliveries" && <>
              <div className="admin-section-header"><div><h2>Gönderim geçmişi</h2><p>Günlük ve test gönderimlerinin kaydedilen sonuçları.</p></div>
                <label>Gönderim sonucu<select value={result} onChange={event => { setResult(event.target.value); setDeliveryPage(1); }}><option value="">Tüm sonuçlar</option><option value="true">Başarılı</option><option value="false">Başarısız</option></select></label></div>
              <div className="admin-table-wrap"><table><caption className="admin-sr-only">Mail gönderim geçmişi</caption><thead><tr><th scope="col">Alıcı / şehir</th><th scope="col">Tür</th><th scope="col">Tarih · Türkiye saati</th><th scope="col">Sonuç</th><th scope="col">Açıklama</th></tr></thead>
                <tbody>{deliveries?.items.map(delivery => <tr key={delivery.id}><td><strong>{delivery.email}</strong><small>{delivery.city}</small></td><td>{delivery.kind === "Test" ? "Test" : "Günlük"}</td><td>{dateTime(delivery.attemptedUtc)}</td><td><span className={`admin-badge ${delivery.succeeded ? "admin-badge-success" : "admin-badge-error"}`}>{delivery.succeeded ? "Başarılı" : "Başarısız"}</span></td><td>{delivery.succeeded ? overview.developmentPickup ? "Yerel posta kutusuna yazıldı" : "Mail sunucusu kabul etti" : deliveryError(delivery.errorCode)}</td></tr>)}</tbody></table></div>
              {deliveries?.items.length === 0 && <div className="admin-empty"><h3>Gönderim kaydı bulunamadı</h3><p>Bu özellik eklendikten sonraki günlük ve test gönderimleri burada görünecek.</p></div>}
              {deliveries && <Pagination page={deliveryPage} total={deliveries.total} pageSize={deliveries.pageSize} disabled={loading || busy} onChange={setDeliveryPage} />}
            </>}
          </section>

          <dialog ref={editor} className="admin-panel admin-editor" aria-labelledby="edit-heading" onCancel={event => { if (busy) event.preventDefault(); else setEditing(null); }}>
          {editing && <>
            <div className="admin-section-header"><div><p className="admin-eyebrow">ABONELİK TERCİHLERİ</p><h2 id="edit-heading">{editing.email}</h2></div><button disabled={busy} onClick={() => setEditing(null)}>Vazgeç</button></div>
            <form onSubmit={event => { event.preventDefault(); void action(() => adminRequest(`/accounts/${editing.id}/subscription`, "PUT", { city: editing.city, deliveryTime: editing.deliveryTime, dailyEnabled: editing.dailyEnabled })); }}>
              <label>Şehir<select disabled={busy} value={editing.city} onChange={event => setEditing({ ...editing, city: event.target.value })}>{overview.cities.map(city => <option key={city}>{city}</option>)}</select></label>
              <label>Gönderim saati · Türkiye<input type="time" required disabled={busy} value={editing.deliveryTime} onChange={event => setEditing({ ...editing, deliveryTime: event.target.value })} /></label>
              <label className="admin-checkbox"><input type="checkbox" disabled={busy} checked={editing.dailyEnabled} onChange={event => setEditing({ ...editing, dailyEnabled: event.target.checked })} />Günlük hava postası açık</label>
              <button type="submit" className="admin-primary" disabled={busy || loading}>{busy ? "Kaydediliyor…" : "Değişiklikleri kaydet"}</button>
            </form>
          </>}
          </dialog>

          <footer className="admin-footer"><span>Son güncelleme: {dateTime(overview.updatedUtc)} · Türkiye saati</span><span>Yalnızca yetkili yöneticiler erişebilir.</span></footer>
        </>}
      </div>
    </main>
  );
}

function Pagination({ page, total, pageSize, disabled, onChange }: { page: number; total: number; pageSize: number; disabled: boolean; onChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <div className="admin-pagination"><span>{total.toLocaleString("tr-TR")} kayıt · Sayfa {page} / {pages}</span><div><button disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>← Önceki</button><button disabled={disabled || page >= pages} onClick={() => onChange(page + 1)}>Sonraki →</button></div></div>;
}
