// Sostenibilità: nastro di velluto 3D (three.js) davanti alle parole giganti della hero (rif. protection.gr).
// Stesso tessuto della home (fur.js): pelo a strati ("shell texturing"), qui come 16 copie del nastro sollevate lungo
// la normale; in ogni strato restano solo i ciuffi abbastanza alti, radici in ombra, riflesso del velluto di taglio.
// La hero resta ferma per qualche schermata: le parole si alternano e il nastro, senza attorcigliarsi, si allarga e
// si stende (onda → onda più larga → più piatta → fascia dritta). La forma è una curva morbida (Catmull-Rom) per
// 12 punti: ogni parola ha i suoi punti e tra una e l'altra si passa con gradualità. Senza WebGL restano le parole.
const RIBBON_VERT = `
uniform float uL, uPile;
varying vec2 vUv;
varying vec3 vN, vV;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position + normal * uL * uPile, 1.);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const RIBBON_FRAG = `
uniform float uL, uTime, uLen, uWid, uCell;
uniform vec3 uColor, uLight;
varying vec2 vUv;
varying vec3 vN, vV;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 hash2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + 1.), f.x), f.y);
}
void main() {
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  float diff = .72 + .4 * max(dot(N, normalize(uLight)), 0.);
  float rim = pow(1. - abs(dot(N, normalize(vV))), 2.); // il velluto si schiarisce dove lo si guarda di taglio
  // come in home (fur.js): pelo lungo pettinato lungo il nastro, la punta si piega più della radice; il verso
  // cambia piano a chiazze (velluto "schiacciato") e con lui il riflesso
  vec2 q = vec2(vUv.x * uLen, vUv.y * uWid);
  float ang = (noise(q * .9) - .5) * 2.2 + .25 * sin(uTime * .5 + vUv.x * 30.);
  vec2 lean = vec2(cos(ang), sin(ang) * .6);
  vec2 g = q / uCell - lean * 2. * pow(uL, 1.5);
  vec2 c = floor(g), f = fract(g);
  vec3 col;
  if (uL == 0.) {
    col = uColor * (gl_FrontFacing ? .5 : .8 + .15 * hash(c)); // fondo tra i ciuffi, in ombra; sul retro velluto piatto
  } else {
    float edge = smoothstep(0., .06, min(vUv.y, 1. - vUv.y)); // ai bordi il pelo è più corto: niente spine sul profilo
    float h = (.5 + .5 * hash(c + 7.)) * (.35 + .65 * edge);    // ogni ciuffo ha la sua altezza
    if (uL > h) discard;
    float r = .5 * (1. - .8 * uL / h);                           // e si assottiglia verso la punta
    if (length(f - (.3 + .4 * hash2(c))) > r) discard;
    float t = uL / h;
    float ao = .55 + .5 * pow(t, 1.1);                          // radici in ombra (meno che in home: il beige chiaro sul verde scuro farebbe graffi)
    float tint = .9 + .2 * hash(c + 3.);
    float d = dot(lean, normalize(vec2(.8, .6)));               // verso del pelo rispetto alla luce: chiazze chiare e scure
    float sheen = (d > 0. ? .4 : .22) * d * t + rim * t * .3;
    col = uColor * ao * tint + sheen * (.35 + .65 * uColor);
  }
  gl_FragColor = vec4(col * diff, 1.);
}`;

function initRibbon() {
  const root = document.querySelector("[data-ribbon]");
  if (!root || typeof THREE === "undefined") return;
  const words = [...root.querySelectorAll(".ghero__words span")];
  const n = words.length;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // parole: la hero si aggancia e lo scroll sceglie la parola (senza GSAP resta la prima)
  let prog = 0;
  const showWord = (k) => words.forEach((w, i) => w.classList.toggle("is-active", i === k));
  showWord(0);
  if (typeof ScrollTrigger !== "undefined" && !reduced) {
    ScrollTrigger.create({
      trigger: root, start: "top top", end: () => `+=${innerHeight * (n - 1) * 0.9}`, pin: true, refreshPriority: 1,
      onUpdate: (st) => { prog = st.progress * (n - 1); showWord(Math.round(prog)); },
    });
    ScrollTrigger.sort(); // creato dopo gli altri pin della pagina ma sta più in alto: va ricalcolato per primo
    ScrollTrigger.refresh();
  }

  const canvas = root.querySelector("canvas");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (e) {
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.z = 16;

  // punti di controllo (x, y, z) per parola, solo onde; x da -17 a 17, lo schermo ne mostra circa ±7
  const STAGES = [
    [[-17, -0.4, 0], [-13.5, 0.7, 0.6], [-10, -0.8, -0.6], [-6.8, 0.6, 0.8], [-3.8, -0.9, -0.4], [-1, 0.5, 0.6], [1.8, -0.6, -0.6], [4.6, 0.8, 0.4], [7.4, -0.7, -0.8], [10.4, 0.6, 0.6], [13.6, -0.5, -0.4], [17, 0.3, 0]],
    [[-17, 0.5, 0], [-13.5, -0.5, 0.5], [-10, 0.7, -0.5], [-6.8, -0.5, 0.6], [-3.8, 0.6, -0.4], [-1, -0.6, 0.5], [1.8, 0.5, -0.5], [4.6, -0.6, 0.4], [7.4, 0.6, -0.6], [10.4, -0.5, 0.5], [13.6, 0.4, -0.4], [17, -0.3, 0]],
    [[-17, -0.5, 0], [-13.5, 0.1, 0.3], [-10, -0.55, -0.3], [-6.8, 0, 0.3], [-3.8, -0.5, -0.2], [-1, -0.05, 0.3], [1.8, -0.5, -0.3], [4.6, 0, 0.2], [7.4, -0.5, -0.3], [10.4, -0.05, 0.3], [13.6, -0.4, -0.2], [17, -0.2, 0]],
    [[-17, -0.8, 0], [-13.5, -0.78, 0], [-10, -0.75, 0], [-6.8, -0.72, 0], [-3.8, -0.7, 0], [-1, -0.67, 0], [1.8, -0.64, 0], [4.6, -0.61, 0], [7.4, -0.58, 0], [10.4, -0.55, 0], [13.6, -0.52, 0], [17, -0.5, 0]],
  ];
  // per parola: w = larghezza (× H), tw = torsione di base (0 = rivolto allo schermo), wob = quanto ondeggia da solo.
  // Alla fine la fascia stesa resta sotto la parola e sopra il testo in basso.
  const LOOK = [
    { w: 1, tw: 0.85, wob: 1 },
    { w: 1.3, tw: 0.6, wob: 0.8 },
    { w: 1.7, tw: 0.3, wob: 0.5 },
    { w: 2.1, tw: 0, wob: 0.15 },
  ];
  const ctrl = STAGES[0].map(() => new THREE.Vector3());
  const curve = new THREE.CatmullRomCurve3(ctrl, false, "centripetal");

  const H = 1, SEG = innerWidth <= 700 ? 240 : 420, SHELLS = innerWidth <= 700 ? 16 : 24;
  const geo = new THREE.PlaneGeometry(1, H, SEG, 1); // due file di vertici lungo il nastro, riscritte a ogni fotogramma
  const pos = geo.attributes.position;
  // colore del velluto come in home: media della miniatura Aragon 01 Beige
  const shared = {
    uTime: { value: 0 }, uLen: { value: 40 }, uWid: { value: H }, uCell: { value: 0.055 }, uPile: { value: 0.045 },
    uColor: { value: new THREE.Color(0.826, 0.801, 0.769) }, uLight: { value: new THREE.Vector3(-3, 5, 6) },
  };
  const group = new THREE.Group();
  for (let i = 0; i <= SHELLS; i++) {
    const mat = new THREE.ShaderMaterial({ uniforms: { ...shared, uL: { value: i / SHELLS } }, vertexShader: RIBBON_VERT, fragmentShader: RIBBON_FRAG, side: THREE.DoubleSide });
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    m.renderOrder = i;
    group.add(m);
  }
  scene.add(group);

  let mouse = 0, mouseTo = 0;
  addEventListener("pointermove", (e) => (mouseTo = 0.5 - e.clientY / innerHeight), { passive: true });

  const T = new THREE.Vector3(), N = new THREE.Vector3(0, 1, 0), B = new THREE.Vector3(), Wv = new THREE.Vector3();
  let morph = 0;
  const shape = (t) => {
    morph += (prog - morph) * 0.06;
    const p = Math.min(morph, STAGES.length - 1);
    const i0 = Math.min(STAGES.length - 2, Math.floor(p)), f = p - i0, e = f * f * (3 - 2 * f);
    const lk = (key) => LOOK[i0][key] + (LOOK[i0 + 1][key] - LOOK[i0][key]) * e;
    const wid = H * lk("w"), base = lk("tw"), wob = lk("wob");
    ctrl.forEach((v, i) => {
      const a = STAGES[i0][i], b = STAGES[i0 + 1][i];
      v.set(a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e);
      v.y += wob * (0.22 * Math.sin(t * 0.6 + i * 1.7) + mouse * 1.2 * Math.exp((-v.x * v.x) / 30));
      v.z += wob * 0.35 * Math.sin(t * 0.45 + i * 1.1);
    });
    curve.needsUpdate = true;
    const pts = curve.getSpacedPoints(SEG);
    shared.uLen.value = curve.getLength();
    shared.uWid.value = wid;
    shared.uTime.value = t;
    // sezione trasportata lungo la curva (niente scatti di orientamento), con una torsione lenta
    N.set(0, 1, 0);
    const a = pos.array, row = (SEG + 1) * 3;
    for (let j = 0; j <= SEG; j++) {
      T.subVectors(pts[Math.min(SEG, j + 1)], pts[Math.max(0, j - 1)]).normalize();
      N.addScaledVector(T, -N.dot(T)).normalize();
      B.crossVectors(T, N);
      const tw = base + 0.5 * wob * Math.sin((j / SEG) * 7 + t * 0.4); // di tre quarti all'inizio, poi piatto verso lo schermo
      Wv.copy(N).multiplyScalar(Math.cos(tw) * wid * 0.5).addScaledVector(B, Math.sin(tw) * wid * 0.5);
      const P = pts[j], k = j * 3;
      a[k] = P.x + Wv.x; a[k + 1] = P.y + Wv.y; a[k + 2] = P.z + Wv.z;
      a[row + k] = P.x - Wv.x; a[row + k + 1] = P.y - Wv.y; a[row + k + 2] = P.z - Wv.z;
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  };
  const resize = () => {
    const w = root.clientWidth, h = root.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // schermo stretto: forme più basse e nastro più sottile, vicino alla parola (sennò copre il testo sotto)
    const k = Math.min(1, 0.35 + camera.aspect * 0.5);
    group.scale.set(k < 1 ? 0.6 : 1, k, k);
    group.position.y = camera.aspect < 1 ? -0.1 : -0.9;
  };
  const t0 = performance.now();
  const frame = () => {
    mouse += (mouseTo - mouse) * 0.05;
    shape((performance.now() - t0) / 1000);
    renderer.render(scene, camera);
    root.classList.add("is-ready");
  };
  resize();
  addEventListener("resize", resize);
  if (reduced) {
    frame(); // un solo fotogramma, fermo
    return;
  }
  let raf = 0, visible = true;
  const tick = () => {
    cancelAnimationFrame(raf);
    if (!visible) return;
    frame();
    raf = requestAnimationFrame(tick);
  };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; tick(); }).observe(root);
}
