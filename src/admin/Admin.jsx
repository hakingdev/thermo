import { useEffect, useRef, useState } from "react";
import "./admin.css";

const sites = [
  { id: "columbia", name: "Columbia", description: "Термобельё Omni-Heat", detail: "Мужская и женская коллекции" },
  { id: "kryga", name: "KRYGA", description: "Тепло в движении", detail: "Комплекты для активной зимы" },
];
const bootsSites = [{ id: "columbia", name: "Columbia Track" }, { id: "kryga", name: "KRYGA Boots" }];
const bootsName = (id) => bootsSites.find(site => site.id === id)?.name || "KRYGA Boots";
const nameOf = (id) => sites.find((site) => site.id === id)?.name || (id === "boots" ? "Boots" : "—");

function Icon({ name, ...props }) {
  const paths = {
    sites: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 9v11" /></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    globe: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>,
    swap: <><path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4" /></>,
  };
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}

export default function Admin({ onLogout, onUnauthorized, logoutBusy, authError }) {
  const [state, setState] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedBoots, setSelectedBoots] = useState("kryga");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const requestVersion = useRef(0);

  async function load() {
    const version = ++requestVersion.current;
    setLoading(true); setMessage(null);
    try {
      const session = await fetch("/api/admin", { cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (version !== requestVersion.current) return;
      if (session.status === 401) { onUnauthorized(); return; }
      if (!session.ok) throw new Error();
      const response = await fetch("/api/site", { cache: "no-store", signal: AbortSignal.timeout(8000) });
      const data = await response.json();
      if (version !== requestVersion.current) return;
      if (!response.ok || !["columbia", "kryga", "boots"].includes(data.site)) throw new Error();
      setState(data); setSelected(data.site === "boots" ? "kryga" : data.site); setSelectedBoots(data.bootsSite || "kryga");
    } catch { if (version === requestVersion.current) setMessage({ error: true, text: "Не удалось получить текущий сайт. Проверьте соединение и повторите загрузку." }); }
    finally { if (version === requestVersion.current) setLoading(false); }
  }

  useEffect(() => {
    document.documentElement.lang = "ru";
    document.documentElement.dataset.theme = "light";
    document.title = "Управление сайтами · Columbia / KRYGA / Boots";
    const robots = document.createElement("meta");
    robots.name = "robots"; robots.content = "noindex, nofollow"; document.head.appendChild(robots);
    load();
    return () => { requestVersion.current++; robots.remove(); };
  }, []);

  async function apply(event) {
    event.preventDefault();
    if (loading || saving || !state || (selected === state.site && selectedBoots === (state.bootsSite || "kryga"))) return;
    requestVersion.current++;
    setSaving(true); setMessage(null);
    try {
      const response = await fetch("/api/site", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: selected, bootsSite: selectedBoots }), signal: AbortSignal.timeout(10000),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) { onUnauthorized(); return; }
        if (data.error === "not_configured") throw new Error("Переключение ещё не настроено на сервере. Подключите хранилище и пароль администратора по инструкции в README.");
        throw new Error("Не удалось подтвердить переключение. Обновите статус перед повторной попыткой.");
      }
      setState(data); setSelected(data.site === "boots" ? "kryga" : data.site); setSelectedBoots(data.bootsSite || "kryga");
      setMessage({ error: false, text: `Сохранено. Главная: ${nameOf(data.site)}. Boots: ${bootsName(data.bootsSite)}.` });
    } catch (error) { setMessage({ error: true, text: error.name === "TimeoutError" || error.name === "TypeError" ? "Связь с сервером прервалась. Обновите статус, чтобы проверить, сохранилось ли изменение." : error.message }); }
    finally { setSaving(false); }
  }

  const changed = state && (selected !== state.site || selectedBoots !== (state.bootsSite || "kryga"));
  return (
    <div className="admin-shell">
      <a className="admin-skip" href="#admin-main">Перейти к выбору сайта</a>
      <aside className="admin-sidebar">
        <a href="/admin" className="admin-brand"><Icon name="swap" /><span>Управление<span>Columbia / KRYGA / Boots</span></span></a>
        <nav aria-label="Админка"><a href="/admin" className="admin-nav-link" aria-current="page"><Icon name="sites" />Сайты<span>{sites.length}</span></a></nav>
        <div className="admin-sidebar-bottom"><span className="admin-dot" />Главная и Boots — отдельный выбор.</div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar"><span>Рабочее пространство <span className="admin-slash">/</span> <strong>Сайты</strong></span><div className="admin-account-actions"><a href="/" target="_blank" rel="noreferrer">Открыть сайт <Icon name="arrow" /></a><button className="admin-text-button" type="button" onClick={onLogout} disabled={logoutBusy || saving}>{logoutBusy ? "Выходим…" : "Выйти"}</button></div></header>
        <main id="admin-main" className="admin-main">
          <div className="admin-heading"><div><h1>Управление сайтами</h1><p>Выберите главную витрину и бренд обуви для страницы Boots.</p></div><span className="admin-version">Панель управления</span></div>
          <section className="admin-live" aria-label="Текущий сайт" aria-busy={loading}>
            <div className="admin-live-icon"><Icon name="globe" /></div>
            <div className="admin-live-copy"><span>Сейчас на основном адресе</span><strong>{loading ? "Загружаем статус…" : nameOf(state?.site)}{state && !loading && <span className="admin-live-status"><span className="admin-dot" />Активен</span>}</strong></div>
            <button className="admin-text-button" type="button" disabled={loading || saving} onClick={load}>Обновить статус</button>
          </section>
          <form onSubmit={apply}>
            <fieldset disabled={loading || saving || !state} className="admin-site-fieldset">
              <legend>Главная · термобельё <span>{sites.length}</span></legend>
              <div className="admin-sites">
                {sites.map((site) => (
                  <article key={site.id} className={`admin-site${selected === site.id ? " is-selected" : ""}`}>
                    <label className="admin-site-choice">
                      <input type="radio" name="site" value={site.id} checked={selected === site.id} onChange={() => { setSelected(site.id); setMessage(null); }} aria-label={`Выбрать ${site.name}`} />
                      <span className="admin-choice-copy">{site.name}<span>{site.description}</span></span>
                      <span className="admin-choice-indicator" aria-hidden="true">{selected === site.id && <Icon name="check" />}</span>
                      <div className={`admin-site-preview admin-site-preview--${site.id}`} aria-hidden="true">
                        {site.id === "columbia" ? <><span className="admin-preview-columbia">Columbia</span><div className="admin-preview-products"><img src="/img/columbia/men-front-640.webp" alt="" /><img src="/img/columbia/women-front-640.webp" alt="" /></div><span className="admin-preview-caption">Omni-Heat™</span></> : <><img src="/img/hero-runner-900.webp" alt="" /><span className="admin-preview-kryga">KRYGA</span></>}
                      </div>
                    </label>
                    <div className="admin-site-bottom"><span>{state?.site === site.id ? <><span className="admin-dot" />Сейчас активен</> : site.detail}</span><a href={`/?preview=${site.id}`} target="_blank" rel="noreferrer" aria-label={`Предпросмотр ${site.name}`}>Предпросмотр <Icon name="arrow" /></a></div>
                  </article>
                ))}
              </div>
            </fieldset>
            <fieldset disabled={loading || saving || !state} className="admin-site-fieldset admin-boots-fieldset">
              <legend>Страница Boots <span>/boots</span></legend>
              <p className="admin-boots-description">Один адрес для обуви: выберите Columbia Track или KRYGA Boots. Сейчас: <strong>{loading ? "загружаем…" : bootsName(state?.bootsSite)}</strong>.</p>
              <div className="admin-boots-options">
                {bootsSites.map(brand => <article key={brand.id} className={`admin-site${selectedBoots === brand.id ? " is-selected" : ""}`}>
                  <label className="admin-site-choice">
                    <input type="radio" name="bootsSite" value={brand.id} checked={selectedBoots === brand.id} onChange={() => { setSelectedBoots(brand.id); setMessage(null); }} aria-label={`Boots: ${brand.name}`} />
                    <span className="admin-choice-copy">{brand.name}<span>{brand.id === "columbia" ? "Зимняя обувь Columbia Track" : "Зимние кожаные кроссовки KRYGA"}</span></span>
                    <span className="admin-choice-indicator" aria-hidden="true">{selectedBoots === brand.id && <Icon name="check" />}</span>
                  </label>
                  <div className="admin-site-bottom"><span>{(state?.bootsSite || "kryga") === brand.id ? "Сейчас на /boots" : "2490 грн"}</span><a href={`/boots?preview=boots-${brand.id}`} target="_blank" rel="noreferrer" aria-label={`Предпросмотр ${brand.name}`}>Предпросмотр <Icon name="arrow" /></a></div>
                </article>)}
              </div>
            </fieldset>
            <div className="admin-apply-area">
              <div className="admin-apply-description"><h2>{changed ? "Сохранить выбор витрин" : "Всё готово к работе"}</h2><p>{changed ? `Главная: ${nameOf(selected)}. Boots: ${bootsName(selectedBoots)}.` : "Главная и Boots настраиваются независимо."}</p></div>
              <div className="admin-apply-controls">
                <button className="admin-primary" type="submit" disabled={loading || !changed || saving || !state?.configured}>{saving ? "Переключаем…" : changed ? "Применить переключение" : "Изменений нет"}{changed && <Icon name="swap" />}</button>
              </div>
            </div>
          </form>
          <div className="admin-message" role={message?.error ? "alert" : "status"} aria-live="polite">{message && <p className={message.error ? "admin-error" : "admin-success"}>{message.text}</p>}</div>
          {authError && <p className="admin-error" role="alert">{authError}</p>}
          {state && !state.configured && <p className="admin-configuration">Просмотр доступен. Для переключения настройте пароль и серверное хранилище по инструкции в README.</p>}
          <footer className="admin-footer"><p>Изменение общее для всех посетителей и вступает в силу при открытии или обновлении страницы.</p><span>{state?.local ? "Локальная среда" : "Общий серверный выбор"}</span></footer>
        </main>
      </div>
    </div>
  );
}
