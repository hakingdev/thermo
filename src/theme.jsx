import { useEffect, useState } from "react";

// Тема: по умолчанию системная; выбор посетителя хранится в localStorage и ставится на <html data-theme>.
// Ранний скрипт в index.html применяет сохранённую тему до первой отрисовки.
const KEY = "kryga-theme";
const media = () => window.matchMedia("(prefers-color-scheme: dark)");
const COLORS = { light: "#f7f9f8", dark: "#071b1f" };

export function currentTheme() {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return media().matches ? "dark" : "light";
}

function paintChrome(theme) {
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", COLORS[theme]));
}

export function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(KEY, theme); } catch {}
  paintChrome(theme);
  window.dispatchEvent(new CustomEvent("kryga-theme", { detail: theme }));
}

export function useTheme() {
  const [theme, set] = useState(currentTheme);
  useEffect(() => {
    const sync = () => { const t = currentTheme(); set(t); paintChrome(t); };
    const m = media();
    m.addEventListener("change", sync);
    window.addEventListener("kryga-theme", sync);
    return () => { m.removeEventListener("change", sync); window.removeEventListener("kryga-theme", sync); };
  }, []);
  return theme;
}

export function ThemeToggle({ t }) {
  const theme = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? t.theme.toLight : t.theme.toDark}
      title={dark ? t.theme.toLight : t.theme.toDark}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4.2" fill="currentColor" />
            <path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
          </>
        ) : (
          <path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6z" fill="currentColor" />
        )}
      </svg>
    </button>
  );
}
