import { useEffect, useLayoutEffect, useRef } from "react";

// Подгоняет размер шрифта так, чтобы строка заняла ровно ширину контейнера (слово-монумент)
export function useFitText(deps = []) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const box = el.parentElement;
    const fit = () => {
      el.style.fontSize = "100px";
      const w = el.scrollWidth;
      const avail = box.clientWidth;
      if (w && avail) el.style.fontSize = `${(avail / w) * 100}px`;
    };
    fit();
    document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return ref;
}

// Появление частей секции: [data-reveal] получают .is-in при входе в экран (один раз).
// Без JS всё видно: прятать начинаем только когда на <html> есть класс .js.
export function useReveal(deps = []) {
  useEffect(() => {
    const els = [...document.querySelectorAll("[data-reveal]:not(.is-in)")];
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
