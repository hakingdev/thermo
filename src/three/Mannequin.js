// 3D-примерочная KRYGA: безликий витринный манекен, построенный из lathe-профилей.
// Кофта и штаны — те же профили с небольшим отступом; надеваются через плоскости отсечения.
// Тепловизор — шейдер с квантованной «тепловой» шкалой по атрибуту heat на каждой вершине.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, LatheGeometry, SphereGeometry, TorusGeometry,
  Vector2, Vector3, Plane, MeshStandardMaterial, ShaderMaterial, HemisphereLight, DirectionalLight,
  CanvasTexture, RepeatWrapping, SRGBColorSpace, Color, BufferAttribute, MathUtils,
} from "three";

// ---------- профили (радиус, высота), метры ----------
const BODY = {
  male: {
    torso: [[0, 0.8], [0.1, 0.805], [0.15, 0.84], [0.172, 0.9], [0.175, 0.96], [0.165, 1.02], [0.152, 1.07], [0.155, 1.12], [0.168, 1.19], [0.18, 1.26], [0.186, 1.32], [0.19, 1.38], [0.175, 1.425], [0.13, 1.455], [0.075, 1.475], [0.055, 1.49], [0, 1.492]],
    depth: 0.6,
    shoulderX: 0.178,
    shoulderY: 1.395,
    armR: 1,
    hipX: 0.092,
    legR: 1,
    scale: 1,
  },
  female: {
    torso: [[0, 0.8], [0.1, 0.805], [0.155, 0.84], [0.178, 0.9], [0.18, 0.95], [0.165, 1.0], [0.14, 1.06], [0.132, 1.1], [0.142, 1.16], [0.162, 1.22], [0.17, 1.27], [0.16, 1.31], [0.16, 1.36], [0.156, 1.4], [0.12, 1.44], [0.07, 1.47], [0.05, 1.485], [0, 1.49]],
    depth: 0.64,
    shoulderX: 0.152,
    shoulderY: 1.39,
    armR: 0.86,
    hipX: 0.094,
    legR: 0.97,
    scale: 0.95,
  },
};
const NECK = [[0, 1.47], [0.058, 1.47], [0.052, 1.52], [0.05, 1.58], [0, 1.6]];
// руки и ноги: профиль вдоль локальной оси Y (вниз отрицательно), по возрастанию Y
const ARM = [[0, -0.585], [0.026, -0.572], [0.029, -0.55], [0.036, -0.45], [0.04, -0.35], [0.037, -0.3], [0.041, -0.27], [0.048, -0.15], [0.052, -0.05], [0.045, -0.01], [0, 0]];
const LEG = [[0, -0.8], [0.032, -0.79], [0.036, -0.76], [0.05, -0.62], [0.058, -0.54], [0.052, -0.44], [0.05, -0.4], [0.06, -0.32], [0.075, -0.18], [0.085, -0.06], [0.08, 0], [0, 0.02]];

const TOP_RANGE = [0.93, 1.475];
const PANTS_RANGE = [0.8, 1.0];
const SLEEVE_RANGE = [-0.556, 0];
const LEG_RANGE = [-0.752, 0.02];

function radiusAt(profile, y) {
  for (let i = 0; i < profile.length - 1; i++) {
    const [r0, y0] = profile[i];
    const [r1, y1] = profile[i + 1];
    if (y >= y0 && y <= y1) return MathUtils.lerp(r0, r1, (y - y0) / (y1 - y0 || 1));
  }
  return profile[y < profile[0][1] ? 0 : profile.length - 1][0];
}

function scaleProfile(profile, k) {
  return profile.map(([r, y]) => [r * k, y]);
}

// Отрезок профиля [y0, y1] с отступом d (одежда поверх тела)
function garmentProfile(profile, [y0, y1], d) {
  const pts = [[radiusAt(profile, y0) + d, y0]];
  for (const [r, y] of profile) if (y > y0 && y < y1) pts.push([r < 1e-3 ? 0 : r + d, y]);
  pts.push([radiusAt(profile, y1) + d, y1]);
  return pts;
}

function lathe(points, segments = 64) {
  return new LatheGeometry(points.map(([r, y]) => new Vector2(Math.max(r, 0.0001), y)), segments);
}

// ---------- ткань: швы на боках + рубчик ----------
function fabricTextures() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 512, 64);
  g.fillStyle = "rgba(0,0,0,0.28)";
  for (const x of [128, 384]) g.fillRect(x - 2, 0, 4, 64);
  const map = new CanvasTexture(c);
  map.colorSpace = SRGBColorSpace;

  const b = document.createElement("canvas");
  b.width = 64; b.height = 8;
  const h = b.getContext("2d");
  for (let x = 0; x < 64; x++) {
    const v = 128 + Math.round(70 * Math.sin((x / 64) * Math.PI * 8));
    h.fillStyle = `rgb(${v},${v},${v})`; h.fillRect(x, 0, 1, 8);
  }
  const bump = new CanvasTexture(b);
  bump.wrapS = bump.wrapT = RepeatWrapping;
  bump.repeat.set(18, 1);
  return { map, bump };
}

// ---------- тепловизор ----------
// Холод — цвета льда бренда, тепло — жёлто-оранжево-красное. 7 ступеней, как у реальной камеры.
const RAMP = ["#0b2f3a", "#0e5a66", "#2f8f8a", "#9cc9a0", "#f2d36b", "#f39a3d", "#e2552d"];

function thermalMaterial(planes) {
  const cols = RAMP.map((h) => new Color(h));
  return new ShaderMaterial({
    clipping: true,
    clippingPlanes: planes,
    uniforms: { uRamp: { value: cols }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      #include <clipping_planes_pars_vertex>
      attribute float heat;
      varying float vHeat;
      varying vec3 vN;
      varying vec3 vView;
      void main() {
        vHeat = heat;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vView = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
        #include <clipping_planes_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <clipping_planes_pars_fragment>
      uniform vec3 uRamp[7];
      uniform float uTime;
      varying float vHeat;
      varying vec3 vN;
      varying vec3 vView;
      void main() {
        #include <clipping_planes_fragment>
        float rim = 1.0 - max(dot(normalize(vN), normalize(vView)), 0.0);
        float h = clamp(vHeat - rim * rim * 0.22 + sin(uTime * 1.6 + vHeat * 9.0) * 0.012, 0.0, 0.999);
        int i = int(floor(h * 7.0));
        vec3 c = uRamp[0];
        for (int k = 1; k < 7; k++) if (k == i) c = uRamp[k];
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}

function hash3(p) {
  const s = Math.sin(p.x * 127.1 + p.y * 311.7 + p.z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

function heatFor(tag, p) {
  let h;
  switch (tag) {
    case "top":
      h = 0.88 - 0.85 * Math.abs(p.y - 1.25);
      if (p.z < 0 && p.y < 1.13) h += 0.1; // подовжена спинка
      break;
    case "sleeve": h = 0.6 + 0.24 * MathUtils.clamp((p.y - 0.84) / 0.56, 0, 1); break;
    case "cuff": h = 0.66; break;
    case "collar": h = 0.72; break;
    case "pants": h = p.y > 0.8 ? 0.84 : 0.54 + 0.3 * MathUtils.clamp((p.y - 0.08) / 0.78, 0, 1) - (Math.abs(p.y - 0.46) < 0.05 ? 0.04 : 0); break;
    case "head": h = 0.5; break;
    case "neck": h = 0.4; break;
    case "torso": h = 0.3; break;
    case "hand":
    case "foot": h = 0.08; break;
    default: h = 0.2; // голые руки и ноги
  }
  return MathUtils.clamp(h + (hash3(p) - 0.5) * 0.025, 0, 0.99);
}

// ---------- сборка фигуры ----------
function buildFigure(kind, mats) {
  const cfg = BODY[kind];
  const root = new Group();
  const parts = { body: [], top: [], bottom: [] };
  const add = (geo, mat, tag, layer, parent = root) => {
    const m = new Mesh(geo, mat);
    m.userData = { tag, layer };
    parent.add(m);
    parts[layer].push(m);
    return m;
  };

  const torsoGeo = lathe(cfg.torso);
  add(torsoGeo, mats.body, "torso", "body").scale.z = cfg.depth;
  add(lathe(NECK, 40), mats.body, "neck", "body").scale.z = 0.9;
  const head = add(new SphereGeometry(0.1, 40, 28), mats.body, "head", "body");
  head.position.set(0, 1.69, 0.005);
  head.scale.set(0.9, 1.15, 1);

  // кофта: корпус, ворот, низ
  add(lathe(garmentProfile(cfg.torso, TOP_RANGE, 0.014)), mats.top, "top", "top").scale.z = cfg.depth + 0.04;
  add(lathe(garmentProfile(NECK, [1.47, 1.525], 0.008), 40), mats.top, "collar", "top").scale.z = 0.92;
  const hem = add(new TorusGeometry(radiusAt(cfg.torso, TOP_RANGE[0]) + 0.016, 0.008, 8, 64), mats.top, "cuff", "top");
  hem.rotation.x = Math.PI / 2; hem.position.y = TOP_RANGE[0]; hem.scale.y = cfg.depth + 0.04;

  // штаны: таз и пояс
  add(lathe(garmentProfile(cfg.torso, PANTS_RANGE, 0.008)), mats.bottom, "pants", "bottom").scale.z = cfg.depth + 0.02;
  const waist = add(new TorusGeometry(radiusAt(cfg.torso, PANTS_RANGE[1]) + 0.01, 0.009, 8, 64), mats.bottom, "pants", "bottom");
  waist.rotation.x = Math.PI / 2; waist.position.y = PANTS_RANGE[1]; waist.scale.y = cfg.depth + 0.02;

  const limbs = {};
  for (const side of [1, -1]) {
    // рука
    const arm = new Group();
    arm.position.set(side * cfg.shoulderX, cfg.shoulderY, 0);
    arm.rotation.z = side * 0.13;
    root.add(arm);
    const armProfile = scaleProfile(ARM, cfg.armR);
    add(lathe(armProfile, 40), mats.body, "arm", "body", arm);
    const shoulder = add(new SphereGeometry(0.056 * cfg.armR, 28, 20), mats.body, "torso", "body", arm);
    shoulder.position.y = -0.02;
    const hand = add(new SphereGeometry(0.05 * cfg.armR, 24, 16), mats.body, "hand", "body", arm);
    hand.position.set(0, -0.665, 0.005); hand.scale.set(0.6, 1.55, 0.95);
    add(lathe(garmentProfile(armProfile, SLEEVE_RANGE, 0.008), 40), mats.top, "sleeve", "top", arm);
    const sleeveCap = add(new SphereGeometry(0.056 * cfg.armR + 0.012, 28, 20), mats.top, "sleeve", "top", arm);
    sleeveCap.position.y = -0.02;
    const cuff = add(new TorusGeometry(radiusAt(armProfile, SLEEVE_RANGE[0]) + 0.011, 0.007, 8, 32), mats.top, "cuff", "top", arm);
    cuff.rotation.x = Math.PI / 2; cuff.position.y = SLEEVE_RANGE[0];

    // нога
    const leg = new Group();
    leg.position.set(side * cfg.hipX, 0.86, 0);
    leg.rotation.z = side * 0.035;
    root.add(leg);
    const legProfile = scaleProfile(LEG, cfg.legR);
    add(lathe(legProfile, 40), mats.body, "leg", "body", leg);
    const foot = add(new SphereGeometry(0.05, 24, 16), mats.body, "foot", "body", leg);
    foot.position.set(0, -0.815, 0.05); foot.scale.set(0.9, 0.7, 2.1);
    add(lathe(garmentProfile(legProfile, LEG_RANGE, 0.009), 40), mats.bottom, "pants", "bottom", leg);
    const ankle = add(new TorusGeometry(radiusAt(legProfile, LEG_RANGE[0]) + 0.011, 0.007, 8, 32), mats.bottom, "cuff", "bottom", leg);
    ankle.rotation.x = Math.PI / 2; ankle.position.y = LEG_RANGE[0];

    limbs[side > 0 ? "armR" : "armL"] = { group: arm, profile: armProfile };
    limbs[side > 0 ? "legR" : "legL"] = { group: leg, profile: legProfile };
  }

  root.scale.setScalar(cfg.scale);
  root.updateMatrixWorld(true);

  // тепло на каждой вершине — в координатах фигуры
  const v = new Vector3();
  for (const layer of Object.values(parts)) {
    for (const mesh of layer) {
      const pos = mesh.geometry.attributes.position;
      const heat = new Float32Array(pos.count);
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld).divideScalar(cfg.scale);
        heat[i] = heatFor(mesh.userData.tag, v);
      }
      mesh.geometry.setAttribute("heat", new BufferAttribute(heat, 1));
    }
  }

  // точки тепловизора: позиция и наружная нормаль в координатах фигуры
  const torsoPt = (y, angle, d) => {
    const r = radiusAt(cfg.torso, y) + d;
    return new Vector3(Math.sin(angle) * r, y, Math.cos(angle) * r * (cfg.depth + 0.04));
  };
  const limbPt = (limb, y, angle, d) => {
    const r = radiusAt(limb.profile, y) + d;
    return new Vector3(Math.sin(angle) * r, y, Math.cos(angle) * r).applyMatrix4(limb.group.matrix);
  };
  const limbCenter = (limb, y) => new Vector3(0, y, 0).applyMatrix4(limb.group.matrix);
  const dirOf = (p, center) => p.clone().sub(center).setY(0).normalize();
  const anchors = [];
  const pushA = (id, layer, p, n) => anchors.push({ id, layer, p, n });
  const neckP = new Vector3(0, 1.505, (radiusAt(NECK, 1.505) + 0.012) * 0.92);
  pushA("neck", "top", neckP, new Vector3(0, 0.2, 1).normalize());
  pushA("chest", "top", torsoPt(1.28, 0.5, 0.016), new Vector3(0.45, 0, 1).normalize());
  pushA("lowback", "top", torsoPt(1.0, Math.PI, 0.016), new Vector3(0, 0, -1));
  pushA("seam", "top", torsoPt(1.13, Math.PI / 2, 0.016), new Vector3(1, 0, 0));
  const wrist = limbPt(limbs.armL, -0.54, 0.4, 0.012);
  pushA("wrist", "top", wrist, dirOf(wrist, limbCenter(limbs.armL, -0.54)).add(new Vector3(0, 0, 0.6)).normalize());
  const knee = limbPt(limbs.legR, -0.42, 0.2, 0.01);
  pushA("knee", "bottom", knee, new Vector3(0.2, 0, 1).normalize());
  const ankleP = limbPt(limbs.legL, -0.72, 0.1, 0.012);
  pushA("ankle", "bottom", ankleP, new Vector3(-0.1, 0, 1).normalize());

  return { root, parts, anchors, height: 1.81 * cfg.scale };
}

// ---------- примерочная ----------
export function createFittingRoom(canvas, { color = "#1b1e21", gender = "male", reducedMotion = false } = {}) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.localClippingEnabled = true;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const camera = new PerspectiveCamera(26, 1, 0.1, 20);
  camera.position.set(0, 1.02, 4.6);
  camera.lookAt(0, 0.92, 0);

  scene.add(new HemisphereLight("#ffffff", "#8fb3b0", 1.5));
  const key = new DirectionalLight("#ffffff", 2.1);
  key.position.set(2.2, 3, 3.2);
  scene.add(key);
  const rim = new DirectionalLight("#cfe8ec", 1.6);
  rim.position.set(-2.5, 2.2, -3);
  scene.add(rim);
  // второй контровой свет — включается в тёмной теме, чтобы чёрный комплект не сливался с фоном
  const rim2 = new DirectionalLight("#bfe6ea", 0);
  rim2.position.set(2.6, 1.6, -2.4);
  scene.add(rim2);

  const topPlane = new Plane(new Vector3(0, 1, 0), -2);   // видно y > h
  const bottomPlane = new Plane(new Vector3(0, -1, 0), -0.2); // видно y < h
  const { map, bump } = fabricTextures();
  const mats = {
    body: new MeshStandardMaterial({ color: "#dde7e5", roughness: 0.55, metalness: 0 }),
    top: new MeshStandardMaterial({ color, roughness: 0.88, map, bumpMap: bump, bumpScale: 0.6, clippingPlanes: [topPlane] }),
    bottom: new MeshStandardMaterial({ color, roughness: 0.88, map, bumpMap: bump, bumpScale: 0.6, clippingPlanes: [bottomPlane] }),
  };
  const thermal = {
    body: thermalMaterial([]),
    top: thermalMaterial([topPlane]),
    bottom: thermalMaterial([bottomPlane]),
  };

  const stage = new Group();
  scene.add(stage);
  let figure = null;

  const state = {
    angle: 0.45,
    velocity: 0,
    dragging: false,
    autoRotate: !reducedMotion,
    onInteract: null,
    thermal: false,
    dressed: { top: 0, bottom: 0 },   // текущее 0..1
    target: { top: 0, bottom: 0 },
    color: new Color(color),
    targetColor: new Color(color),
    gender,
  };

  function mount(kind) {
    if (figure) {
      stage.remove(figure.root);
      figure.root.traverse((o) => o.geometry?.dispose());
    }
    figure = buildFigure(kind, mats);
    stage.add(figure.root);
    applyMaterials();
  }

  function applyMaterials() {
    for (const layer of ["body", "top", "bottom"]) {
      for (const m of figure.parts[layer]) m.material = state.thermal ? thermal[layer] : mats[layer];
    }
  }

  mount(gender);

  // ---------- вращение ----------
  // Первое касание останавливает автоповорот насовсем (WCAG 2.2.2); второй палец во время жеста игнорируется.
  let pointerId = null;
  let startX = 0, startY = 0, lastX = 0, lastT = 0, decided = false, horizontal = false;
  const stopAuto = () => {
    if (!state.autoRotate) return;
    state.autoRotate = false;
    state.onInteract?.();
  };
  const onDown = (e) => {
    if (pointerId !== null) return;
    pointerId = e.pointerId; startX = lastX = e.clientX; startY = e.clientY; lastT = performance.now();
    decided = e.pointerType === "mouse"; horizontal = decided;
    state.velocity = 0;
    if (horizontal) { state.dragging = true; canvas.setPointerCapture(pointerId); stopAuto(); }
  };
  const onMove = (e) => {
    if (e.pointerId !== pointerId) return;
    if (!decided) {
      const dx = Math.abs(e.clientX - startX), dy = Math.abs(e.clientY - startY);
      if (dx + dy < 6) return;
      decided = true; horizontal = dx > dy;
      if (!horizontal) { pointerId = null; return; }
      state.dragging = true; canvas.setPointerCapture(pointerId); stopAuto();
    }
    if (!state.dragging) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    state.angle += dx * 0.012;
    state.velocity = (dx * 0.012) / Math.max(now - lastT, 8) * 16;
    lastX = e.clientX; lastT = now;
  };
  const release = () => {
    if (pointerId !== null && canvas.hasPointerCapture?.(pointerId)) canvas.releasePointerCapture(pointerId);
    state.dragging = false; pointerId = null;
  };
  const onUp = (e) => { if (e.pointerId === pointerId) release(); };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("lostpointercapture", onUp);
  window.addEventListener("blur", release);

  // ---------- размер ----------
  let width = 1, height = 1;
  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    width = Math.max(1, r.width); height = Math.max(1, r.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement);
  resize();

  // ---------- цикл ----------
  let raf = 0, running = false, last = performance.now();
  const ease = (x) => 1 - Math.pow(1 - x, 3);
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    if (!state.dragging) {
      state.angle += state.velocity;
      state.velocity *= 0.92;
      if (state.autoRotate && Math.abs(state.velocity) < 0.001) state.angle += dt * 0.28;
    }
    stage.rotation.y = state.angle;

    // надевание: кофта сверху вниз, штаны снизу вверх
    for (const k of ["top", "bottom"]) {
      const d = state.target[k] - state.dressed[k];
      state.dressed[k] += reducedMotion ? d : Math.sign(d) * Math.min(Math.abs(d), dt * 0.9);
    }
    const H = figure.height;
    const t = ease(state.dressed.top), b = ease(state.dressed.bottom);
    topPlane.constant = -MathUtils.lerp(H + 0.05, -0.05, t);
    bottomPlane.constant = MathUtils.lerp(-0.05, H + 0.05, b);
    for (const m of figure.parts.top) m.visible = state.dressed.top > 0.001;
    for (const m of figure.parts.bottom) m.visible = state.dressed.bottom > 0.001;

    state.color.lerp(state.targetColor, reducedMotion ? 1 : Math.min(1, dt * 6));
    mats.top.color.copy(state.color);
    mats.bottom.color.copy(state.color);
    for (const m of Object.values(thermal)) m.uniforms.uTime.value = now / 1000;

    renderer.render(scene, camera);
  }

  function start() {
    if (running) return;
    running = true; last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  const tmp = new Vector3(), nrm = new Vector3(), toCam = new Vector3();
  return {
    start,
    stop,
    setGender(kind) { if (kind !== state.gender) { state.gender = kind; mount(kind); } },
    setColor(hex) { state.targetColor.set(hex); },
    setDressed({ top, bottom }) {
      if (top !== undefined) state.target.top = top ? 1 : 0;
      if (bottom !== undefined) state.target.bottom = bottom ? 1 : 0;
    },
    setThermal(on) { state.thermal = on; applyMaterials(); },
    rotateBy(rad) { state.velocity = 0; stopAuto(); state.angle += rad; },
    setAutoRotate(on) { state.autoRotate = on; },
    setTheme(theme) {
      const dark = theme === "dark";
      rim.intensity = dark ? 3.4 : 1.6;
      rim2.intensity = dark ? 2.6 : 0;
      key.intensity = dark ? 2.5 : 2.1;
    },
    onInteract(fn) { state.onInteract = fn; },
    // экранные координаты точек тепловизора (px внутри canvas) и насколько точка смотрит на камеру
    anchors() {
      if (!figure) return [];
      figure.root.updateMatrixWorld(true);
      const mw = figure.root.matrixWorld;
      return figure.anchors.map((a) => {
        tmp.copy(a.p).applyMatrix4(mw);
        nrm.copy(a.n).transformDirection(mw);
        toCam.copy(camera.position).sub(tmp).normalize();
        const facing = nrm.dot(toCam);
        tmp.project(camera);
        return {
          id: a.id,
          layer: a.layer,
          on: state.dressed[a.layer] > 0.98,
          x: (tmp.x * 0.5 + 0.5) * width,
          y: (-tmp.y * 0.5 + 0.5) * height,
          facing,
        };
      });
    },
    dispose() {
      stop();
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("lostpointercapture", onUp);
      window.removeEventListener("blur", release);
      scene.traverse((o) => o.geometry?.dispose());
      [...Object.values(mats), ...Object.values(thermal)].forEach((m) => m.dispose());
      map.dispose(); bump.dispose();
      renderer.dispose();
    },
  };
}
