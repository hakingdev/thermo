// Кросівок KRYGA збоку, намальований у коді: чорна шкіра, руда вставка з хутром на кісточці,
// медова хвиляста підошва ТЕП. Без логотипів. variant="sole" — тільки підошва для блоку матеріалів.
const C = {
  leather: "#1c1511",
  shine: "#3a2c22",
  heel: "#120d0a",
  camel: "#b8712e",
  camelDark: "#93561f",
  fur: "#e2d6c3",
  sole: "#e3a857",
  soleDark: "#c4893a",
  lace: "#0d0a07",
};

// Хвиля по верхньому краю підошви: чорна шкіра «заходить» у медову підошву півколами
function waveEdge(x0, x1, y, depth, step) {
  let d = `M${x1},${y}`;
  for (let x = x1; x > x0; x -= step) {
    const nx = Math.max(x - step, x0);
    d += ` Q${(x + nx) / 2},${y + depth} ${nx},${y}`;
  }
  return d;
}

function Sole({ y = 0 }) {
  return (
    <g transform={`translate(0 ${y})`}>
      <path d="M52,262 L566,262 C584,264 590,284 576,296 C566,305 544,308 520,308 L86,308 C66,308 50,296 50,280 Z" fill={C.sole} />
      <path d="M86,308 L520,308 C544,308 566,305 576,296 L576,300 C566,310 544,314 520,314 L86,314 C66,314 50,302 50,288 L50,280 C50,296 66,308 86,308 Z" fill={C.soleDark} />
      <path d={`${waveEdge(56, 566, 262, 26, 46)} L56,256 L566,256 Z`} fill={C.leather} />
      {[110, 200, 290, 380, 470].map((x) => (
        <path key={x} d={`M${x},300 l18,-10 l18,10`} fill="none" stroke={C.soleDark} strokeWidth="4" strokeLinecap="square" />
      ))}
    </g>
  );
}

export default function BootDrawing({ variant = "boot", title }) {
  if (variant === "sole") {
    return (
      <svg viewBox="40 230 560 100" role="img" aria-label={title} className="boot-art boot-art--sole">
        <Sole />
      </svg>
    );
  }
  return (
    <svg viewBox="20 40 590 290" role="img" aria-label={title} className="boot-art">
      {/* верх */}
      <path
        d="M68,266 C56,206 66,146 98,100 L250,108 C270,100 284,82 300,66 L332,62 C342,92 352,122 382,152 C432,192 502,206 548,226 C568,236 572,256 560,266 Z"
        fill={C.leather}
      />
      {/* задник */}
      <path d="M68,266 C60,214 68,170 90,138 L150,148 C138,190 138,230 150,266 Z" fill={C.heel} />
      {/* відблиск шкіри */}
      <path d="M392,168 C440,198 498,212 540,232" fill="none" stroke={C.shine} strokeWidth="6" strokeLinecap="round" />
      <path d="M168,160 C220,166 270,166 330,156" fill="none" stroke={C.shine} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
      {/* руда вставка на кісточці */}
      <path d="M98,100 L250,108 C262,104 274,94 286,82 L296,120 C274,132 252,138 228,140 L124,138 C108,136 96,122 98,100 Z" fill={C.camel} />
      <path d="M300,66 L332,62 L338,88 L306,94 Z" fill={C.camel} />
      {/* хутро по краю */}
      {Array.from({ length: 15 }, (_, i) => {
        const t = i / 14;
        const x = 102 + t * 182;
        const y = 99 + t * 9 - Math.sin(t * Math.PI) * 4 - (t > 0.85 ? (t - 0.85) * 60 : 0);
        return <circle key={i} cx={x} cy={y} r="8" fill={C.fur} />;
      })}
      {/* строчка */}
      <path d="M126,146 L230,148 C256,146 280,138 300,128" fill="none" stroke={C.camel} strokeWidth="2.5" strokeDasharray="7 6" />
      <path d="M150,252 C200,250 300,250 420,248 C470,246 520,244 552,250" fill="none" stroke={C.camelDark} strokeWidth="2.5" strokeDasharray="7 6" />
      {/* шнурівка */}
      {[0, 1, 2, 3, 4].map((i) => {
        const x = 312 + i * 24;
        const y = 104 + i * 15;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="4.5" fill={C.camelDark} />
            <circle cx={x + 26} cy={y - 10} r="4.5" fill={C.camelDark} />
            <path d={`M${x},${y} L${x + 26},${y - 10}`} stroke={C.lace} strokeWidth="6" strokeLinecap="round" />
          </g>
        );
      })}
      <Sole />
    </svg>
  );
}
