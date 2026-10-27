// Всё, что может поменяться по данным магазина, — здесь.
// ЗАПОЛНИТЬ: реальные цены магазина. OLD_PRICE = 0 убирает зачёркнутую цену и плашку скидки.
export const PRICE = 1199;
export const OLD_PRICE = 2398;
export const DISCOUNT = OLD_PRICE > PRICE ? Math.round((1 - PRICE / OLD_PRICE) * 100) : 0;

// «1 199 грн» с неразрывным пробелом
export const money = (n) => `${n.toLocaleString("uk-UA")} грн`;

// Columbia Omni-Heat Midweight Baselayer: мужская линейка S–XXL, женская XS–XXL
export const SIZES = {
  male: ["S", "M", "L", "XL", "XXL"],
  female: ["XS", "S", "M", "L", "XL", "XXL"],
};

// Сверить наличие цветов со складом магазина.
// Чёрный есть в обеих линейках; темно-синий — Collegiate Navy (муж.) / Nocturnal (жен.); графит — только мужские штаны.
export const COLORS = [
  { id: "black", hex: "#1b1e21", inStock: true },
  { id: "graphite", hex: "#5b6168", inStock: false },
  { id: "navy", hex: "#1f2c4c", inStock: false },
];

// Ориентировочная размерная сетка по росту и весу (сверить с таблицей Columbia для конкретной партии).
// Подбор: первый размер, в который укладываются и рост, и вес.
export const SIZE_CHART = {
  male: [
    { size: "S", height: [162, 174], weight: [52, 66] },
    { size: "M", height: [168, 180], weight: [64, 77] },
    { size: "L", height: [174, 186], weight: [75, 88] },
    { size: "XL", height: [178, 192], weight: [86, 100] },
    { size: "XXL", height: [182, 200], weight: [98, 118] },
  ],
  female: [
    { size: "XS", height: [148, 160], weight: [40, 49] },
    { size: "S", height: [154, 166], weight: [47, 56] },
    { size: "M", height: [160, 172], weight: [54, 64] },
    { size: "L", height: [164, 176], weight: [62, 72] },
    { size: "XL", height: [168, 180], weight: [70, 82] },
    { size: "XXL", height: [170, 186], weight: [80, 96] },
  ],
};

// Подсказываем только для правдоподобных значений, иначе «1 см / 7 кг» давало бы XS
export const HEIGHT_RANGE = [140, 210];
export const WEIGHT_RANGE = [35, 160];
const inRange = (v, [a, b]) => v >= a && v <= b;

export function suggestSize(gender, height, weight) {
  const rows = SIZE_CHART[gender] || SIZE_CHART.male;
  if (!inRange(height, HEIGHT_RANGE) || !inRange(weight, WEIGHT_RANGE)) return null;
  const byWeight = rows.findIndex((r) => weight <= r.weight[1]);
  const byHeight = rows.findIndex((r) => height <= r.height[1]);
  const idx = Math.max(byWeight === -1 ? rows.length - 1 : byWeight, byHeight === -1 ? rows.length - 1 : byHeight);
  return rows[Math.min(idx, rows.length - 1)].size;
}

// Размер, которого нет в линейке выбранной модели, сбрасываем (XS есть только у женской)
export const sizeFor = (gender, size) => ((SIZES[gender] || SIZES.male).includes(size) ? size : null);

export const PIXEL_ID = import.meta.env.VITE_MULTISITE ? (import.meta.env.VITE_COLUMBIA_FB_PIXEL_ID || "") : (import.meta.env.VITE_FB_PIXEL_ID || "");
export const API_URL = import.meta.env.VITE_MULTISITE ? "/api/columbia-lead" : (import.meta.env.VITE_API_URL || "/api/lead");
