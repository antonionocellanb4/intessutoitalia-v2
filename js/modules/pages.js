// Pagine istituzionali: video YouTube caricati solo al click e form senza invio reale.

// [data-yt="ID"]: mostra la copertina; al click la sostituisce con il player (niente iframe pesanti al caricamento)
function initVideos() {
  document.querySelectorAll("[data-yt]").forEach((box) => box.addEventListener("click", () => {
    box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${box.dataset.yt}?autoplay=1&rel=0" title="${box.getAttribute("aria-label") || "Video"}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  }, { once: true }));
}

// il prototipo non invia nulla: dopo i controlli nativi del browser mostra solo la conferma
function initForms() {
  document.querySelectorAll("[data-form]").forEach((form) => form.addEventListener("submit", (e) => {
    e.preventDefault();
    form.querySelector("[data-form-done]").hidden = false;
    form.querySelector("[type=submit]").disabled = true;
  }));
}

// Chi siamo: la foto ferma a sinistra; a ogni capitolo la foto nuova si apre dal centro sopra la precedente
// (legata allo scroll, come gli "sticky features" di Osmo). Senza GSAP: cambio a dissolvenza.
function initChapters() {
  const root = document.querySelector("[data-chapters]");
  if (!root) return;
  const imgs = [...root.querySelectorAll(".chapters__frame img")];
  const chapters = [...root.querySelectorAll("[data-chapter]")];
  const era = root.querySelector("[data-chapter-era]");
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const k = +e.target.dataset.chapter;
    imgs.forEach((img, i) => { img.classList.toggle("is-active", i === k); if (i === k + 1) img.loading = "eager"; });
    era.textContent = e.target.querySelector(".caps").textContent.split("· ")[1];
  }), { rootMargin: "-65% 0px -35% 0px" }); // linea al 65%: su telefono la metà alta è occupata dalla foto
  chapters.forEach((c) => io.observe(c));

  if (typeof gsap === "undefined" || document.documentElement.classList.contains("js") === false) return;
  root.classList.add("is-scrubbed");
  imgs.forEach((img) => (img.loading = "eager")); // le foto si vedono mentre si aprono: devono esserci già
  imgs.slice(1).forEach((img, i) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: chapters[i + 1], start: "top bottom", end: "top 40%", scrub: 0.4 } });
    tl.fromTo(img, { clipPath: "inset(50% 50% 50% 50% round 6px)" }, { clipPath: "inset(0% 0% 0% 0% round 6px)", ease: "power2.inOut" }, 0);
    tl.fromTo(img, { scale: 1.25 }, { scale: 1, ease: "power2.out" }, 0); // dentro il riquadro la foto si assesta mentre si apre
  });
}

// Chi siamo, ricerca e sviluppo: due sezioni di fila

// 1. la sezione resta agganciata; la foto zooma nella trama e al centro le fasi (titolo, poi i tre test) si danno il cambio
function initDeep() {
  const root = document.querySelector("[data-deep]");
  if (!root) return;
  const phases = [...root.querySelectorAll("[data-phase]")];
  const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: root, start: "top top", end: `+=${innerHeight * phases.length}`, pin: true, scrub: 0.5 } });
  tl.fromTo(root.querySelector(".deep__img"), { scale: 1 }, { scale: 2.6, duration: phases.length }, 0);
  phases.forEach((p, k) => {
    if (k) tl.fromTo(p, { autoAlpha: 0, y: 40, scale: .96 }, { autoAlpha: 1, y: 0, scale: 1, duration: .35, ease: "power2.out" }, k);
    if (k < phases.length - 1) tl.to(p, { autoAlpha: 0, y: -40, duration: .3, ease: "power2.in" }, k + .65);
  });
}

// 2. le parole scorrono in orizzontale mentre la sezione passa (versi alterni), la trama dentro le lettere va più piano
function initFwords() {
  document.querySelectorAll("[data-fwords]:not([hidden]) [data-fword]").forEach((row, k) => {
    const word = row.querySelector(".fword__word");
    const dir = k % 2 ? 1 : -1;
    gsap.fromTo(word, { xPercent: -dir * 8, backgroundPosition: "30% 50%" }, {
      xPercent: dir * 8, backgroundPosition: "70% 50%", ease: "none",
      scrollTrigger: { trigger: row, start: "top bottom", end: "bottom top", scrub: true },
    });
  });
}

// La nostra storia, tappe: la sezione resta agganciata; a ogni tappa la foto nuova si srotola dal basso sopra la
// precedente, il nome gigante sale e il metro da sarta scorre sotto l'ago fino al segno della tappa.
function initTape() {
  const root = document.querySelector("[data-tape]");
  if (!root) return;
  const imgs = [...root.querySelectorAll(".tape__img")];
  const eras = [...root.querySelectorAll(".tape__era")];
  const texts = [...root.querySelectorAll(".tape__text")];
  const marks = [...root.querySelectorAll("[data-tape-mark]")];
  const n = imgs.length;
  imgs.forEach((img) => (img.loading = "eager"));
  gsap.set(imgs.slice(1), { clipPath: "inset(100% 0% 0% 0%)" });
  gsap.set(eras.slice(1), { yPercent: 110 });
  gsap.set(texts.slice(1), { autoAlpha: 0 });
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: root, start: "top top", end: () => `+=${innerHeight * (n - 1)}`, pin: true, scrub: 0.6, invalidateOnRefresh: true,
      onUpdate: (st) => { const k = Math.round(st.progress * (n - 1)); marks.forEach((m, i) => m.classList.toggle("is-active", i === k)); },
    },
  });
  tl.to(root.querySelector(".tape__strip"), { x: () => -marks[n - 1].offsetLeft, duration: n - 1 }, 0);
  for (let k = 1; k < n; k++) {
    const at = k - 0.8;
    tl.to(imgs[k], { clipPath: "inset(0% 0% 0% 0%)", duration: 0.6, ease: "power2.inOut" }, at)
      .fromTo(imgs[k], { scale: 1.18 }, { scale: 1, duration: 0.8, ease: "power2.out" }, at)
      .to(eras[k - 1], { yPercent: -110, duration: 0.35, ease: "power2.in" }, at)
      .to(eras[k], { yPercent: 0, duration: 0.4, ease: "power2.out" }, at + 0.3)
      .to(texts[k - 1], { autoAlpha: 0, duration: 0.2 }, at)
      .to(texts[k], { autoAlpha: 1, duration: 0.3 }, at + 0.35);
  }
}

// La nostra storia, cucitura (sezione nascosta): il filo segue un'onda tra le tappe; la parte cucita arriva al 60% dello schermo,
// l'ago (punto rame) ne segna la testa. Il percorso si ricalcola quando cambia l'altezza della lista.
function initSeam() {
  const root = document.querySelector("[data-seam]:not([hidden])");
  if (!root) return;
  const list = root.querySelector(".seam__list");
  const svg = list.querySelector(".seam__line");
  const paths = [...svg.querySelectorAll("path")];
  const [reveal] = paths;
  const needle = svg.querySelector(".seam__needle");
  let len = 0, p = 0;
  const draw = () => {
    reveal.style.strokeDasharray = len;
    reveal.style.strokeDashoffset = len * (1 - p);
    const pt = reveal.getPointAtLength(len * p);
    needle.setAttribute("cx", pt.x);
    needle.setAttribute("cy", pt.y);
  };
  const build = () => {
    const w = list.clientWidth, h = list.clientHeight, narrow = innerWidth <= 1000;
    const cx = narrow ? 8 : w / 2, amp = narrow ? 10 : 90, seg = narrow ? 180 : 320;
    let d = `M${cx} 0`;
    for (let y = 0, s = 1; y < h; y += seg, s = -s) d += ` Q${cx + amp * s} ${y + seg / 2} ${cx} ${Math.min(h, y + seg)}`;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    paths.forEach((el) => el.setAttribute("d", d));
    len = reveal.getTotalLength();
    draw();
  };
  build();
  new ResizeObserver(build).observe(list);
  ScrollTrigger.create({ trigger: list, start: "top 60%", end: "bottom 60%", onUpdate: (st) => { p = st.progress; draw(); } });
  list.querySelectorAll("[data-seam-item]").forEach((item) =>
    ScrollTrigger.create({ trigger: item, start: "top 60%", onEnter: () => item.classList.add("is-on"), onLeaveBack: () => item.classList.remove("is-on") }));
}

// Mission, Vision e Valori: la Vision parte da una foto piccola al centro, tra le due metà del titolo; con lo scroll
// la foto si apre a tutto schermo, le righe si allontanano e compare il testo sulla foto.
function initVzoom() {
  const root = document.querySelector("[data-vzoom]");
  if (!root) return;
  const frame = root.querySelector(".vzoom__img");
  const img = frame.querySelector("img");
  const [top, bottom] = root.querySelectorAll(".vzoom__line");
  const copy = root.querySelector(".vzoom__copy");
  const small = innerWidth <= 1000 ? "inset(28% 10% 28% 10% round 6px)" : "inset(22% 36% 22% 36% round 6px)";
  img.loading = "eager";
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: root, start: "top top", end: () => `+=${innerHeight * 1.6}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
  });
  // il ritaglio sta sulla cornice e lo zoom sulla foto: così lo zoom non allarga il riquadro piccolo
  tl.fromTo(frame, { clipPath: small }, { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1, ease: "power2.inOut" }, 0)
    .fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1, ease: "power2.inOut" }, 0)
    .to(top, { yPercent: -160, autoAlpha: 0, duration: 0.7, ease: "power2.in" }, 0.1)
    .to(bottom, { yPercent: 160, autoAlpha: 0, duration: 0.7, ease: "power2.in" }, 0.1)
    .fromTo(root, { "--shade": 0 }, { "--shade": 1, duration: 0.4 }, 0.75)
    .fromTo(copy.children, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.08, ease: "power2.out" }, 0.85)
    .to({}, { duration: 0.3 });
}

// Mission, Vision e Valori: la riga si apre quando la sua parola sale oltre il 40% dello schermo, e resta aperta
// (richiudere quelle sopra farebbe saltare la pagina). Funziona anche senza GSAP.
function initVrows() {
  const rows = document.querySelectorAll("[data-vrow]");
  if (!rows.length) return;
  let refresh = 0;
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting && e.boundingClientRect.top > 0) return; // già sopra lo schermo (ricarica a metà pagina): aperta
    e.target.closest("[data-vrow]").classList.add("is-open");
    io.unobserve(e.target);
    // la riga aperta allunga la pagina: finita l'apertura (1,1 s) si ricalcolano le sezioni sotto (footer compreso)
    clearTimeout(refresh); refresh = setTimeout(() => window.ScrollTrigger && ScrollTrigger.refresh(), 1200);
  }), { rootMargin: "0px 0px -60% 0px" });
  rows.forEach((r) => io.observe(r.querySelector(".vrow__word")));
}

// Sostenibilità, dal filo al divano: sezione ferma; a ogni tappa la foto in cima si rimpicciolisce al centro e sparisce,
// mentre quella sotto (più "larga": filo, tessuto, collezione, seduta) si allarga da 1.6 a 1. Il testo cambia con la tappa.
function initGsteps() {
  const root = document.querySelector("[data-gsteps]");
  if (!root) return;
  const frames = [...root.querySelectorAll(".gsteps__frame")];
  const texts = [...root.querySelectorAll(".gsteps__text")];
  const n = frames.length;
  frames.forEach((f, k) => { f.style.zIndex = n - k; f.querySelector("img").loading = "eager"; });
  gsap.set(frames.slice(1).map((f) => f.querySelector("img")), { scale: 1.6 });
  gsap.set(texts.slice(1), { autoAlpha: 0 });
  const tl = gsap.timeline({ scrollTrigger: { trigger: root, start: "top top", end: () => `+=${innerHeight * (n - 1) * 1.1}`, pin: true, scrub: 0.6, invalidateOnRefresh: true } });
  for (let k = 0; k < n - 1; k++) {
    const at = k + 0.15;
    tl.to(frames[k], { scale: 0.22, borderRadius: 28, duration: 0.75, ease: "power2.inOut" }, at)
      .to(frames[k], { autoAlpha: 0, duration: 0.15 }, at + 0.65)
      .to(frames[k + 1].querySelector("img"), { scale: 1, duration: 0.8, ease: "power2.inOut" }, at)
      .to(texts[k], { autoAlpha: 0, y: -20, duration: 0.2 }, at)
      .fromTo(texts[k + 1], { y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3 }, at + 0.45);
  }
  tl.to({}, { duration: 0.25 });
}

// Sostenibilità: le etichette entrano più inclinate e più in basso e si posano sulla loro inclinazione (--r).
function initGlabels() {
  const row = document.querySelector("[data-glabels]");
  if (!row) return;
  row.querySelectorAll(".glabel").forEach((el, i) => {
    const r = parseFloat(getComputedStyle(el).getPropertyValue("--r")) || 0;
    gsap.fromTo(el, { rotation: r * (innerWidth <= 1000 ? 2 : 4), y: 90 + i * 40 }, { rotation: r, y: 0, ease: "none", scrollTrigger: { trigger: row, start: "top bottom", end: "top 35%", scrub: 0.6 } });
  });
}

// Sostenibilità: i numeri salgono da zero mentre la riga entra (con lo scroll, anche all'indietro); la virgola resta
// all'italiana.
function initGnums() {
  document.querySelectorAll(".gnum__n [data-count]").forEach((el) => { // solo i numeri di Sostenibilità (l'archivio usa data-count per il totale)
    const end = parseFloat(el.dataset.count.replace(",", "."));
    const dec = (el.dataset.count.split(",")[1] || "").length;
    if (end < 10 && !dec) return; // numeri piccoli (1 sede, 7 articoli): contarli non dice niente
    const v = { n: 0 };
    gsap.to(v, {
      n: end, ease: "none",
      onUpdate: () => (el.textContent = v.n.toFixed(dec).replace(".", ",")),
      scrollTrigger: { trigger: el.closest("[data-gnum], li") || el, start: "top 90%", end: "top 45%", scrub: 0.6 },
    });
  });
}

// Sostenibilità, la collezione (rif. xiloteca.it): i campioni sono immagini piatte, sempre rivolte verso lo schermo,
// che girano lungo una spirale attorno all'asse verticale (quelli dietro più scuri). La sezione si ferma e lo scroll fa
// girare e salire la spirale; mentre scorrono le immagini si piegano e ondeggiano come un liquido, tanto più quanto più
// si scorre veloce. Telecamera lontana con teleobiettivo: scena quasi piatta. Serve three.js (solo in questa pagina).
const GFLOAT_VERT = `
uniform float uVel;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  p.y += sin(uv.x * 3.1416) * uVel * .25;          // si incurva nel verso dello scroll
  p.x += sin(uv.y * 3.1416 * 2.) * uVel * .03;    // e ondeggia di lato
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;
const GFLOAT_FRAG = `
uniform sampler2D uMap;
uniform vec2 uRepeat, uOffset, uSize;
uniform float uVel, uTime, uShade;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  uv.x += sin(uv.y * 14. + uTime * 2.) * uVel * .005;   // increspatura liquida
  uv.y += sin(uv.x * 10. - uTime * 1.6) * uVel * .004;
  // angoli arrotondati (radius del sito, in proporzione)
  vec2 q = abs(vUv - .5) * uSize - (uSize * .5 - .06);
  if (length(max(q, 0.)) > .06) discard;
  vec3 col = texture2D(uMap, uv * uRepeat + uOffset).rgb;
  gl_FragColor = vec4(col * uShade, 1.);
}`;

function initGfloat() {
  const root = document.querySelector("[data-gfloat]");
  if (!root || typeof THREE === "undefined") return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: root.querySelector("canvas"), alpha: true, antialias: true });
  } catch (e) {
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(10, 1, 1, 400);
  camera.position.z = 100;

  const R = 6, SPAN = 14, TURNS = 1.6, N = 26, W = 1.9, H = 3; // raggio, mezza altezza, giri, campioni, misure
  const loader = new THREE.TextureLoader();
  const shared = { uVel: { value: 0 }, uTime: { value: 0 } };
  const srcs = root.dataset.swatches.split(",");
  const textures = srcs.map((src) => {
    const u = { uMap: { value: null }, uRepeat: { value: new THREE.Vector2(1, 1) }, uOffset: { value: new THREE.Vector2(0, 0) } };
    u.uMap.value = loader.load(src, (t) => {
      // la foto copre il campione senza deformarsi (come object-fit: cover)
      const a = t.image.width / t.image.height, b = W / H;
      if (a > b) { u.uRepeat.value.set(b / a, 1); u.uOffset.value.set((1 - b / a) / 2, 0); } else { u.uRepeat.value.set(1, a / b); u.uOffset.value.set(0, (1 - a / b) / 2); }
    });
    u.uMap.value.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return u;
  });
  const geo = new THREE.PlaneGeometry(W, H, 24, 24);
  const rand = (k) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const cards = [];
  for (let k = 0; k < N; k++) {
    const t = textures[k % textures.length];
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...shared, uMap: t.uMap, uRepeat: t.uRepeat, uOffset: t.uOffset, uSize: { value: new THREE.Vector2(W, H) }, uShade: { value: 1 } },
      vertexShader: GFLOAT_VERT, fragmentShader: GFLOAT_FRAG,
    });
    const m = new THREE.Mesh(geo, mat);
    const s = 0.85 + 0.3 * rand(k);
    m.scale.set(s, s, 1);
    m.userData = { l: (k / (N - 1) - 0.5) * 2, dy: (rand(k + 50) - 0.5) * 0.8, dr: (rand(k + 90) - 0.5) * 0.8 };
    scene.add(m);
    cards.push(m);
  }

  let target = 0, cur = 0, vel = 0, offX = 0;
  ScrollTrigger.create({ trigger: root, start: "top top", end: () => `+=${innerHeight * 2.2}`, pin: true, onUpdate: (st) => (target = st.progress) });
  const resize = () => {
    const w = root.clientWidth, h = root.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const viewW = camera.aspect < 1 ? 15 : 20; // larghezza visibile in unità della scena
    camera.fov = 2 * Math.atan(viewW / camera.aspect / 2 / camera.position.z) * (180 / Math.PI);
    camera.updateProjectionMatrix();
    offX = camera.aspect < 1 ? 0 : 4; // a destra: a sinistra c'è il testo
  };
  resize();
  addEventListener("resize", resize);
  const t0 = performance.now();
  const frame = () => {
    const prev = cur;
    cur += (target - cur) * 0.08;
    vel += (Math.max(-1, Math.min(1, (cur - prev) * 90)) - vel) * 0.15; // velocità dello scroll, smorzata
    shared.uVel.value = vel;
    shared.uTime.value = (performance.now() - t0) / 1000;
    const a = cur * 2 - 1;
    cards.forEach((m) => {
      const { l, dy, dr } = m.userData;
      const ang = l * TURNS * Math.PI - a * 0.9 * Math.PI;
      const r = R + dr;
      m.position.set(offX + r * Math.sin(ang), l * SPAN + dy - a * 8, r * Math.cos(ang));
      m.material.uniforms.uShade.value = 0.5 + 0.5 * (0.5 + 0.5 * Math.cos(ang)); // dietro più scuri
    });
    renderer.render(scene, camera);
  };
  let raf = 0, visible = false;
  const tick = () => { cancelAnimationFrame(raf); if (!visible) return; frame(); raf = requestAnimationFrame(tick); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; tick(); }).observe(root);
  frame();
}

// Sostenibilità, Pianeta: la sezione si ferma e i pannelli si aprono uno alla volta (flex-grow 4 per quello aperto);
// il contenuto compare quando il pannello è il più largo. Su telefono niente aggancio: pannelli in colonna, già aperti.
function initGplanet() {
  const root = document.querySelector("[data-gplanet]");
  if (!root || innerWidth <= 1000) return;
  const pans = [...root.querySelectorAll("[data-gpan]")];
  const open = () => {
    const g = pans.map((p) => parseFloat(p.style.flexGrow || getComputedStyle(p).flexGrow));
    const k = g.indexOf(Math.max(...g));
    pans.forEach((p, i) => p.classList.toggle("is-open", i === k));
  };
  const tl = gsap.timeline({ defaults: { ease: "power2.inOut", duration: 0.6 }, onUpdate: open, scrollTrigger: { trigger: root, start: "top top", end: () => `+=${innerHeight * 1.6}`, pin: true, scrub: 0.6, invalidateOnRefresh: true } });
  gsap.set(pans, { flexGrow: (i) => (i ? 1 : 4) });
  for (let k = 1; k < pans.length; k++) tl.to(pans[k - 1], { flexGrow: 1 }, k).to(pans[k], { flexGrow: 4 }, k);
  tl.to({}, { duration: 0.4 });
}

// Aquaclean, collezioni a lamelle (rif. elementis.co): ogni foto dopo la prima è tagliata in strisce orizzontali di
// spessore irregolare; al cambio di collezione le strisce si aprono dall'alto una dopo l'altra, sullo sfondo e nella
// carta insieme, e il testo della carta cambia.
const BLINDS = [7, 3, 11, 5, 9, 2, 13, 6, 4, 10, 3, 8, 12, 7]; // spessori in %, somma 100
function initBlinds() {
  const root = document.querySelector("[data-blinds]");
  if (!root) return;
  const stacks = [...root.querySelectorAll("[data-blinds-stack]")];
  const texts = [...root.querySelectorAll(".blinds__text")];
  const count = root.querySelector("[data-blinds-n]");
  const n = texts.length;
  stacks.forEach((stack) => [...stack.children].forEach((layer, k) => {
    const img = layer.querySelector("img");
    img.loading = "eager";
    if (!k) return;
    // ogni striscia è la foto intera ritagliata alla sua fascia: le copie restano allineate per forza
    let y = 0;
    layer.replaceChildren(...BLINDS.map((h) => {
      const strip = img.cloneNode();
      strip.dataset.from = `inset(${y}% 0% ${100 - y}% 0%)`;
      strip.dataset.to = `inset(${y}% 0% ${Math.max(0, 100 - y - h - 0.2)}% 0%)`; // -0,2: si sovrappone alla successiva, niente righine
      y += h;
      return strip;
    }));
  }));
  root.classList.add("is-live");
  const at = (k) => k - 0.6; // inizio del passaggio alla collezione k
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    onUpdate: () => { let k = 0; while (k < n - 1 && tl.time() >= at(k + 1) + 0.15) k++; count.textContent = String(k + 1).padStart(2, "0"); },
    scrollTrigger: { trigger: root, start: "top top", end: () => `+=${innerHeight * (n - 1) * 0.9}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
  });
  for (let k = 1; k < n; k++) {
    stacks.forEach((stack) => tl.fromTo(stack.children[k].children, { clipPath: (i, el) => el.dataset.from }, { clipPath: (i, el) => el.dataset.to, duration: 0.25, stagger: 0.025, ease: "power2.out" }, at(k)));
    tl.to(texts[k - 1], { autoAlpha: 0, y: -16, duration: 0.2 }, at(k))
      .fromTo(texts[k], { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.25 }, at(k) + 0.15);
  }
  tl.to({}, { duration: 0.3 });
}

// Aquaclean, video: la sezione si ferma e la fila di video scorre in orizzontale; il video più vicino al centro
// è a grandezza piena, gli altri un po' più piccoli. Su telefono i video sono impilati (CSS, position: sticky).
function initVreel() {
  const root = document.querySelector("[data-vreel]");
  if (!root) return;
  const track = root.querySelector(".vreel__track");
  const cards = [...root.querySelectorAll(".vreel__card")];
  const dist = () => track.scrollWidth - innerWidth;
  // solo da 901px in su; se la finestra si stringe (o si allarga) l'effetto si toglie (o si crea) da solo
  gsap.matchMedia().add("(min-width: 901px)", () => {
    root.classList.add("is-live");
    const update = () => {
      const c = innerWidth / 2;
      cards.forEach((card) => {
        const r = card.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - c);
        card.style.setProperty("--f", Math.min(d / (innerWidth * 0.6), 1).toFixed(3));
      });
    };
    gsap.to(track, {
      x: () => -dist(), ease: "none", onUpdate: update,
      scrollTrigger: {
        trigger: root, start: "top top", end: () => `+=${dist()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true,
      },
    });
    update();
    // creato dopo il caricamento (finestra allargata): va rimesso in ordine di pagina, prima delle collezioni sotto
    if (vreelReady) { ScrollTrigger.sort(); requestAnimationFrame(() => ScrollTrigger.refresh()); }
    return () => {
      root.classList.remove("is-live");
      cards.forEach((card) => card.style.removeProperty("--f"));
      // la sezione cambia altezza: le sezioni agganciate sotto vanno rimisurate
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };
  });
  vreelReady = true;
}
let vreelReady = false;

// Aquaclean, hero: lo spot in loop, muto e senza comandi, dietro il titolo. Riparte prima della chiusura col logo
// (da 18,06 s). Su schermi piccoli il file a 720p; senza movimento resta la foto.
const HERO_VIDEO_END = 17.95;
function initHeroVideo() {
  const v = document.querySelector("[data-hero-video]");
  if (!v || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  v.muted = true;
  v.src = `assets/video/aquaclean-spot-${innerWidth <= 900 ? 720 : 1080}.mp4`;
  const rewind = (t) => { if (t >= HERO_VIDEO_END) v.currentTime = 0; };
  if ("requestVideoFrameCallback" in v) {
    const each = (now, meta) => { rewind(meta.mediaTime); v.requestVideoFrameCallback(each); };
    v.requestVideoFrameCallback(each);
  } else {
    v.addEventListener("timeupdate", () => rewind(v.currentTime + 0.3)); // senza controllo per fotogramma: un po' prima
  }
  v.addEventListener("ended", () => { v.currentTime = 0; v.play(); });
  v.addEventListener("playing", () => v.classList.add("is-on"), { once: true });
  v.play().catch(() => {}); // se il browser blocca l'autoplay resta la foto
}

// ---------- Aquaclean, "Cosa toglie": sezione ferma ----------
// 1) "Cosa toglie Aquaclean" parte enorme al centro dello schermo e si posa al suo posto come titolo
// 2) le macchie passano al centro una alla volta, enormi, e si sciolgono come inchiostro bagnato  3) la frase finale
function initAqList() {
  const root = document.querySelector("[data-aqa]"); if (!root) return;
  const title = root.querySelector(".aqa__title"), items = root.querySelectorAll(".aqa__list li");
  // posizione di partenza del titolo, calcolata dal suo posto finale (il pin tiene la sezione in cima allo schermo)
  const big = () => {
    const w = title.offsetWidth, h = title.offsetHeight; // offset*: senza la trasformazione in corso
    return { scale: Math.min((innerWidth * 0.9) / w, (innerHeight * 0.5) / h), x: innerWidth / 2 - (title.offsetLeft + w / 2), y: innerHeight / 2 - (title.offsetTop + h / 2) };
  };
  // acqua sulla parola: rumore + spostamento (feDisplacementMap) e sfocatura che crescono, come inchiostro che si scioglie
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", 0); svg.setAttribute("height", 0); svg.style.position = "absolute";
  root.append(svg);
  const water = (el, i) => {
    svg.insertAdjacentHTML("beforeend", `<filter id="aqw${i}" x="-20%" y="-60%" width="140%" height="220%"><feTurbulence type="fractalNoise" baseFrequency="0.009 0.03" numOctaves="2" seed="${i * 7 + 3}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation="0"/></filter>`);
    el.style.filter = `url(#aqw${i})`;
    const f = svg.lastElementChild;
    return { map: f.querySelector("feDisplacementMap"), blur: f.querySelector("feGaussianBlur") };
  };
  const words = [...root.querySelectorAll(".aqa__list span")];
  const say = root.querySelector(".aqa__say"), text = root.querySelector(".aqa__side .mvv-mission__text");
  const tl = gsap.timeline({ scrollTrigger: { trigger: root, start: "top top", end: () => `+=${innerHeight * 3.4}`, pin: true, scrub: 0.6, invalidateOnRefresh: true } });
  tl.fromTo(title, { x: () => big().x, y: () => big().y, scale: () => big().scale }, { x: 0, y: 0, scale: 1, ease: "power2.inOut", duration: 1.2 })
    .fromTo(text, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 1);
  // una parola enorme alla volta al centro: entra, poi si scioglie e lascia il posto alla successiva
  words.forEach((w, i) => {
    const f = water(w, i), at = 1.1 + i * 1.1;
    tl.fromTo(items[i], { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, ease: "power2.out", duration: 0.45 }, at)
      .to(f.map, { attr: { scale: 180 }, ease: "power1.in", duration: 0.6 }, at + 0.5)
      .to(f.blur, { attr: { stdDeviation: 14 }, ease: "power1.in", duration: 0.6 }, at + 0.5)
      .to(w, { autoAlpha: 0, ease: "power1.in", duration: 0.6 }, at + 0.5);
  });
  tl.fromTo(say, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1 }, "-=0.4");
}

// Hero di Aquaclean, Chi siamo e Mission (scelte dalle prove del 16 ott): all'ingresso il video entra a lamelle, strisce di spessore diverso
// che si aprono dall'alto, poi sale il titolo; allo scroll la hero resta ferma, il video si stringe in una carta verso
// l'alto e la sezione dopo le sale sopra. Va chiamata dopo initReveal (ritarda il titolo) e initHero (toglie la parallasse)
function initHeroFx() {
  const hero = document.querySelector("[data-hero-fx]"); if (!hero) return;
  const media = hero.querySelector(".hero__media"), img = media.querySelector("img");
  const strips = document.createElement("div");
  strips.className = "hero__blinds";
  strips.setAttribute("aria-hidden", "true");
  strips.innerHTML = [13, 7, 11, 5, 14, 8, 12, 6, 10, 14].map((h) => `<i style="flex:${h}"></i>`).join("");
  media.append(strips);
  gsap.to(strips.children, { scaleY: 0, duration: 0.9, ease: "power3.inOut", stagger: 0.07, delay: 0.4, onComplete: () => strips.remove() });
  gsap.getTweensOf(hero.querySelectorAll(".line > span")).forEach((t) => t.delay(1.1).restart(true));
  gsap.getTweensOf(img).forEach((t) => { if (t.scrollTrigger) { t.scrollTrigger.kill(); t.kill(); gsap.set(img, { yPercent: 0 }); } });
  // tutte le sezioni dopo la hero la coprono quando ci salgono sopra (la prima può essere più bassa dello schermo)
  for (let el = hero.nextElementSibling; el; el = el.nextElementSibling) el.classList.add("hero-next");
  // un solo ScrollTrigger per pin e animazioni: un secondo trigger sullo stesso elemento fissato calcola male l'inizio
  const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: {
    trigger: hero, start: "top top", end: "bottom top", scrub: true, pin: true, pinSpacing: false,
    // rilasciata, la hero resterebbe spostata in giù sopra le sezioni seguenti: finita la carta si nasconde
    // (controllato a ogni aggiornamento e ricalcolo, anche se la pagina si apre già scrollata più in basso)
    onUpdate: (st) => (hero.style.visibility = st.progress >= 1 ? "hidden" : ""),
    onRefresh: (st) => (hero.style.visibility = st.progress >= 1 ? "hidden" : ""),
  } })
    .fromTo(media, { clipPath: "inset(0% 0% 0% 0% round 0px)" }, { clipPath: "inset(8% 30% 52% 30% round 12px)", duration: 0.6 }, 0)
    .to(hero.querySelectorAll(".hero__content, .hero__text"), { autoAlpha: 0, y: -60, duration: 0.4 }, 0);
  // intorno alla carta il fondo nero diventa bianco, subito (a metà sarebbe un grigio spento); l'header passa al vetro chiaro (header.js)
  tl.fromTo(hero, { backgroundColor: "#151311" }, { backgroundColor: "#ffffff", duration: 0.1 }, 0);
}

// ---------- Showroom ----------
// "Entra nello showroom": "Noci" bucato in un piano bianco sopra la foto; lo scroll stringe il viewBox dentro l'asta della i (zoom nitido,
// niente testo ingrandito a pixel) finché il buco riempie lo schermo e resta la foto
function initSrZoom() {
  const root = document.querySelector("[data-srzoom]"); if (!root) return;
  const glyphs = root.querySelector(".srzoom__glyphs"), cap = root.querySelector(".srzoom__caption");
  const [sx0, sx1, sy0, sy1] = glyphs.dataset.stem.split(" ").map(Number);
  const bb = glyphs.getBBox(); // del tracciato, in unità del font: affidabile (a differenza del testo)
  let W = 0, H = 0, k = 1, x0 = 0, yb = 0, Px = 0, Py = 0, smax = 1;
  const fit = () => {
    W = root.clientWidth; H = root.clientHeight;
    k = Math.min(W * (W < H ? 0.45 : 0.42), H * 0.75) / 1000; // 1 em = come il vecchio corpo del testo
    x0 = W / 2 - k * (bb.x + bb.width / 2); yb = H / 2 - k * (bb.y + bb.height / 2); // centrato sulla forma vera
    Px = x0 + k * (sx0 + sx1) / 2; Py = yb + k * (sy0 + sy1) / 2; // centro dell'asta della i, a schermo
    smax = Math.max(W / (k * (sx1 - sx0)), H / (k * (sy1 - sy0))) * 1.08; // l'asta copre tutto lo schermo
  };
  fit();
  const z = { u: 0 };
  const draw = () => {
    const s = Math.pow(smax, z.u), t = Math.sqrt(z.u); // zoom esponenziale (ritmo costante); la i va presto al centro
    const px = Px + (W / 2 - Px) * t, py = Py + (H / 2 - Py) * t;
    glyphs.setAttribute("transform", `translate(${px} ${py}) scale(${s}) translate(${-Px} ${-Py}) translate(${x0} ${yb}) scale(${k})`);
  };
  draw();
  const tl = gsap.timeline({ scrollTrigger: { trigger: root, start: "top top", end: () => `+=${innerHeight * 1.6}`, pin: true, scrub: 0.6, invalidateOnRefresh: true, onRefresh: () => { fit(); draw(); } } });
  tl.fromTo(z, { u: 0 }, { u: 1, ease: "power1.in", duration: 0.85, onUpdate: draw })
    .fromTo(cap, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.2 }, 0.85);
}

// Parete dei campioni: campioni appesi, già al loro posto; oscillano (molla) quando il mouse passa veloce vicino
function initSrWall() {
  const root = document.querySelector("[data-srwall]"); if (!root) return;
  const sws = [...root.querySelectorAll(".srwall__sw")];
  const st = sws.map(() => ({ a: 0, v: 0 }));
  let px = 0, py = 0, pvx = 0, raf = 0, last = 0;
  const loop = () => {
    let moving = false;
    sws.forEach((s, i) => {
      const k = st[i];
      k.v += -0.06 * k.a; k.v *= 0.92; k.a += k.v;
      if (Math.abs(k.a) > 0.05 || Math.abs(k.v) > 0.05) moving = true;
      s.style.transform = k.a ? `rotate(${k.a.toFixed(2)}deg)` : "";
    });
    raf = moving ? requestAnimationFrame(loop) : 0;
  };
  root.addEventListener("pointermove", (e) => {
    pvx = e.clientX - (px || e.clientX); px = e.clientX; py = e.clientY;
    sws.forEach((s, i) => {
      const r = s.getBoundingClientRect(), dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
      const f = Math.exp(-(dx * dx + dy * dy) / (r.width * r.width * 1.2));
      if (f > 0.02) st[i].v += pvx * 0.035 * f;
    });
    if (!raf) raf = requestAnimationFrame(loop);
  });
  root.addEventListener("pointerleave", () => { px = 0; });
}

// Footer: il contenuto parte più in alto e scende al suo posto mentre entra (sembra fermo sotto la
// pagina che sale); la scritta gigante è divisa in lettere che salgono una alla volta
function initFooterFx() {
  const foot = document.querySelector(".footer2"); if (!foot) return;
  const word = foot.querySelector("[data-footer-word]");
  // stesso spostamento in px per tutti i blocchi (con yPercent ognuno si muoverebbe secondo la sua altezza e si sovrapporrebbero)
  gsap.fromTo(foot.children, { y: () => -innerHeight * 0.3 }, { y: 0, ease: "none", scrollTrigger: { trigger: foot, start: "top bottom", end: "bottom bottom", scrub: true, invalidateOnRefresh: true } });
  // la scritta è un solo tracciato: lo si divide nei contorni (M...) e li si raggruppa per lettera (contorni che si sovrappongono in x)
  fetch(word.querySelector("img").src).then((r) => r.text()).then((txt) => {
    const src = new DOMParser().parseFromString(txt, "image/svg+xml").querySelector("svg");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", src.getAttribute("viewBox")); svg.setAttribute("aria-hidden", "true");
    word.replaceChildren(svg);
    const mk = (d) => { const p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", d); svg.append(p); return p; };
    const parts = src.querySelector("path").getAttribute("d").split(/(?=M)/).map((d) => {
      const p = mk(d), b = p.getBBox(); p.remove(); return { d, x0: b.x, x1: b.x + b.width };
    }).sort((a, b) => a.x0 - b.x0);
    const letters = [];
    parts.forEach((q) => { const last = letters[letters.length - 1]; if (last && q.x0 < last.x1 - 1) { last.d += q.d; last.x1 = Math.max(last.x1, q.x1); } else letters.push({ ...q }); });
    gsap.fromTo(letters.map((l) => mk(l.d)), { yPercent: 105 }, { yPercent: 0, ease: "power3.out", duration: 1, stagger: 0.05, scrollTrigger: { trigger: word, start: "top 95%", once: true } });
  }).catch(() => {});
}

// Certificazioni: i fogli arrivano impilati al centro del tavolo, un po' storti; scorrendo vengono distribuiti uno alla
// volta al loro posto (il primo è in cima alla pila) e sotto compaiono nome e download. Su telefono niente aggancio.
function initCerts() {
  const desk = document.querySelector("[data-certs] .certs__desk");
  if (!desk) return;
  const sheets = [...desk.querySelectorAll(".sheet")];
  const papers = sheets.map((s) => s.querySelector(".sheet__paper")), infos = sheets.map((s) => s.querySelector(".sheet__info"));
  const tilt = [-5, 4, -2.5, 6];
  papers.forEach((p, i) => (p.style.zIndex = papers.length - i));
  gsap.matchMedia().add("(min-width: 901px)", () => {
    // distanza tra il centro di ogni foglio e il centro della fila: lì sta la pila
    // posizioni nel tavolo (offset*, che ignorano le trasformazioni già applicate)
    const off = (p, axis) => {
      const last = papers[papers.length - 1];
      return axis === "x" ? (papers[0].offsetLeft + last.offsetLeft + last.offsetWidth) / 2 - (p.offsetLeft + p.offsetWidth / 2)
        : desk.clientHeight / 2 - (p.offsetTop + p.offsetHeight / 2) + 20;
    };
    const tl = gsap.timeline({ defaults: { ease: "power2.inOut" }, scrollTrigger: { trigger: desk.parentNode, start: "top top", end: () => "+=" + innerHeight * 1.8, pin: true, scrub: 0.6, invalidateOnRefresh: true } });
    tl.set(infos, { autoAlpha: 0, y: 12 }, 0);
    papers.forEach((p, i) => {
      tl.fromTo(p, { x: () => off(p, "x") + i * 6, y: () => off(p, "y") - i * 4, rotation: tilt[i] }, { x: 0, y: 0, rotation: 0, duration: 1 }, i * 0.75)
        .to(infos[i], { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" }, i * 0.75 + 0.8);
    });
    tl.to({}, { duration: 0.4 }); // un attimo fermi a fila completa prima di sganciare
    return () => gsap.set([...papers, ...infos], { clearProps: "all" });
  });
  // telefono: ogni foglio arriva un po' storto e si posa quando entra nello schermo
  gsap.matchMedia().add("(max-width: 900px)", () => {
    papers.forEach((p, i) => gsap.from(p, { y: 70, rotation: tilt[i] * 1.4, autoAlpha: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: p, start: "top 92%", once: true } }));
  });
}

// Fabrics: una proprietà alla volta enorme al centro; sopra, i suoi tessuti salgono e si aprono a ventaglio, poi volano
// via in alto mentre arriva la successiva (stesso principio di "Cosa toglie" in Aquaclean: una cosa grande alla volta)
function initFprops() {
  const sec = document.querySelector("[data-fprops]");
  if (!sec) return;
  const props = [...sec.querySelectorAll(".fprop")];
  const FAN = { 2: [[-58, -7], [58, 7]], 3: [[-78, -11], [0, 0], [78, 11]] }; // [xPercent, gradi] per numero di tessuti
  const title = sec.querySelector(".fprops__title");
  // il titolo parte enorme al centro (calcolato dal suo posto finale, offset* = senza trasformazioni) e si posa in alto a sinistra
  const big = () => {
    const w = title.offsetWidth, h = title.offsetHeight;
    return { scale: Math.min((innerWidth * 0.86) / w, (innerHeight * 0.55) / h), x: innerWidth / 2 - (title.offsetLeft + w / 2), y: innerHeight / 2 - (title.offsetTop + h / 2) };
  };
  gsap.set(props, { autoAlpha: 0 });
  const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + innerHeight * (props.length * 0.9 + 0.6), pin: true, scrub: 0.6, invalidateOnRefresh: true } });
  tl.fromTo(title, { x: () => big().x, y: () => big().y, scale: () => big().scale }, { x: 0, y: 0, scale: 1, ease: "power2.inOut", duration: 1.2 });
  props.forEach((p, i) => {
    const t = 1 + i * 2, word = p.querySelector(".fprop__word"), text = p.querySelector(".fprop__text"), cards = [...p.querySelectorAll(".fprop__card")];
    const fan = FAN[cards.length] || cards.map(() => [0, 0]);
    tl.set(p, { autoAlpha: 1 }, t)
      .fromTo(word, { yPercent: 70, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: "power3.out" }, t)
      .fromTo(cards, { yPercent: 90, xPercent: 0, rotation: 0, autoAlpha: 0 },
        { yPercent: (j) => Math.abs(fan[j][1]) * 0.6, xPercent: (j) => fan[j][0], rotation: (j) => fan[j][1], autoAlpha: 1, duration: 0.8, stagger: 0.08, ease: "power3.out" }, t)
      .fromTo(text, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.4 }, t + 0.45);
    if (i < props.length - 1)
      tl.to(word, { yPercent: -70, autoAlpha: 0, duration: 0.5, ease: "power2.in" }, t + 1.5)
        .to(cards, { yPercent: -160, rotation: (j) => fan[j][1] * 2.5, autoAlpha: 0, duration: 0.5, stagger: 0.05, ease: "power2.in" }, t + 1.45)
        .to(text, { autoAlpha: 0, duration: 0.3 }, t + 1.5)
        .set(p, { autoAlpha: 0 }, t + 2);
    else tl.to({}, { duration: 0.6 }); // l'ultima resta un attimo prima di sganciare
  });
}

// GreenFabrics: la foto di Alma viene tessuta. L'ordito (fili verticali) entra alternato dall'alto e dal basso, poi la
// trama (fili orizzontali, visibili a celle alterne = sopra/sotto) entra da sinistra e da destra; alla fine le fessure
// si chiudono, il rilievo si spegne e resta il tessuto intero. Sotto, la didascalia cambia con la fase.
function initWeave() {
  const sec = document.querySelector("[data-weave]");
  if (!sec) return;
  const warps = [...sec.querySelectorAll(".weave__warp")], wefts = [...sec.querySelectorAll(".weave__weft")];
  const caps = [...sec.querySelectorAll(".weave__caps span")];
  const tl = gsap.timeline({ defaults: { ease: "power2.out" }, scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + innerHeight * 2.6, pin: true, scrub: 0.6 } });
  tl.set(caps, { autoAlpha: 0 }, 0).set(caps[0], { autoAlpha: 1 }, 0)
    .set([...warps, ...wefts], { "--relief": 1 }, 0)
    .fromTo(warps, { yPercent: (j) => (j % 2 ? 105 : -105), scaleX: 0.72 }, { yPercent: 0, duration: 0.6, stagger: 0.05 }, 0)
    .to(caps[0], { autoAlpha: 0, duration: 0.15 }, 1.2).to(caps[1], { autoAlpha: 1, duration: 0.15 }, 1.3)
    .fromTo(wefts, { xPercent: (i) => (i % 2 ? 105 : -105), scaleY: 0.72 }, { xPercent: 0, duration: 0.6, stagger: 0.07 }, 1.25)
    .to(warps, { scaleX: 1, duration: 0.5, ease: "power2.inOut" }, 2.6)
    .to(wefts, { scaleY: 1, duration: 0.5, ease: "power2.inOut" }, 2.6)
    .to([...warps, ...wefts], { "--relief": 0, duration: 0.5 }, 2.7)
    .to(sec.querySelector(".weave__whole"), { opacity: 1, duration: 0.2 }, 3)
    .to(caps[1], { autoAlpha: 0, duration: 0.15 }, 2.7).to(caps[2], { autoAlpha: 1, duration: 0.15 }, 2.8)
    .to({}, { duration: 0.4 });
}

// Contatti: la scelta nella frase decide a quale ufficio arriva la richiesta e, per il campionario, chiede dove spedirlo
function initAsk() {
  const form = document.querySelector("[data-ask]");
  if (!form) return;
  const pick = form.querySelector("[data-ask-pick]"), ship = form.querySelector("[data-ask-ship]"), to = form.querySelector("[data-ask-to]");
  const OFFICE = { vendite: "Ufficio Vendite", info: "Info line", stampa: "Ufficio Stampa & P.R." };
  const update = () => {
    const sample = pick.selectedIndex === 0;
    ship.hidden = !sample;
    ship.querySelector("input").required = sample;
    to.textContent = OFFICE[pick.value];
  };
  pick.addEventListener("change", update);
  update();
}
