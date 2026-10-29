import { lazy, Suspense, useEffect, useState } from "react";
import "./admin.css";

const Admin = lazy(() => import("./Admin.jsx"));

export default function AdminEntry() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.lang = "ru";
    document.documentElement.dataset.theme = "light";
    document.title = "Вход в админку · Columbia / KRYGA / Boots";
    const robots = document.createElement("meta");
    robots.name = "robots"; robots.content = "noindex, nofollow";
    document.head.appendChild(robots);
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    fetch("/api/admin", { cache: "no-store", credentials: "same-origin", signal: controller.signal })
      .then(async (response) => {
        if (!active) return;
        if (response.ok) setSession(await response.json());
        else if (response.status !== 401) setError("Вход временно недоступен. Попробуйте позже.");
      })
      .catch(() => { if (active) setError("Не удалось связаться с сервером. Проверьте соединение и попробуйте войти."); })
      .finally(() => { clearTimeout(timeout); if (active) setChecking(false); });
    return () => { active = false; controller.abort(); clearTimeout(timeout); robots.remove(); };
  }, []);

  async function login(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }), signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) {
        setError(response.status === 401 ? "Неверный логин или пароль. Проверьте данные и попробуйте ещё раз." : response.status === 429 ? "Слишком много попыток входа. Попробуйте через 15 минут." : "Вход временно недоступен. Попробуйте позже.");
        return;
      }
      setSession(await response.json()); setPassword("");
    } catch { setError("Не удалось связаться с сервером. Проверьте соединение и попробуйте ещё раз."); }
    finally { setBusy(false); }
  }

  async function logout() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin", { method: "DELETE", credentials: "same-origin", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error();
      setSession(null); setPassword("");
      document.title = "Вход в админку · Columbia / KRYGA / Boots";
    } catch { setError("Не удалось выйти. Проверьте соединение и повторите попытку."); }
    finally { setBusy(false); }
  }

  function expired() {
    setSession(null); setPassword("");
    setError("Сеанс завершён. Войдите ещё раз.");
  }

  if (checking) return <main className="admin-login"><p role="status">Проверяем вход…</p></main>;
  if (session) return <Suspense fallback={<main className="admin-login"><p role="status">Открываем панель…</p></main>}><Admin onLogout={logout} onUnauthorized={expired} logoutBusy={busy} authError={error} /></Suspense>;
  return <main className="admin-login">
    <section className="admin-login-sheet" aria-labelledby="login-title">
      <h1 id="login-title">Вход в админку</h1>
      <p className="admin-login-description">Управление сайтами Columbia, KRYGA и Boots.</p>
      <form onSubmit={login} aria-busy={busy}>
        <label className="admin-password" htmlFor="admin-username">Логин<input id="admin-username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={(event) => setUsername(event.target.value)} required maxLength={128} disabled={busy} /></label>
        <label className="admin-password" htmlFor="admin-password">Пароль<input id="admin-password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required maxLength={256} disabled={busy} /></label>
        {error && <p id="login-error" className="admin-error" role="alert">{error}</p>}
        <button className="admin-primary" type="submit" disabled={busy}>{busy ? "Входим…" : "Войти"}</button>
      </form>
      <a className="admin-login-back" href="/">Вернуться на сайт</a>
    </section>
  </main>;
}
