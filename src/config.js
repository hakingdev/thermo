// Всё, что может поменяться по данным оффера, — здесь.
export const PRICE = 1199;
export const OLD_PRICE = 2398;
export const DISCOUNT = 50;

export const SIZES = ["M", "L", "XL", "XXL"];

// Сверить наличие цветов с оффером: по сайту оффера подтверждён только чёрный.
export const COLORS = [
  { id: "black", hex: "#1b1e21", inStock: true },
  { id: "graphite", hex: "#4b5258", inStock: false },
  { id: "navy", hex: "#1d2b47", inStock: false },
];

// Ориентировочная размерная сетка (сверить с оффером).
// Подбор: первый размер, в который укладываются и рост, и вес.
export const SIZE_CHART = {
  male: [
    { size: "M", height: [164, 176], weight: [55, 70] },
    { size: "L", height: [170, 182], weight: [68, 80] },
    { size: "XL", height: [176, 188], weight: [78, 92] },
    { size: "XXL", height: [182, 198], weight: [90, 110] },
  ],
  female: [
    { size: "M", height: [154, 166], weight: [45, 58] },
    { size: "L", height: [160, 172], weight: [56, 66] },
    { size: "XL", height: [166, 178], weight: [64, 76] },
    { size: "XXL", height: [170, 184], weight: [74, 90] },
  ],
};

// Подсказываем только для правдоподобных значений, иначе «1 см / 7 кг» давало бы M
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

export const PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID || "";
export const API_URL = import.meta.env.VITE_API_URL || "/api/lead";
