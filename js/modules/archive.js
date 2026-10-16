// Archivio tessuti: barra filtri a pillole agganciata sotto l'header, griglia a tutta larghezza con tessere editoriali.
// Filtri: OR dentro lo stesso gruppo, AND tra gruppi.
// ponytail: tutto lato client sulle card presenti in pagina; in WooCommerce lo farà il plugin filtri.
function initArchive() {
  const root = document.querySelector("[data-archive]");
  if (!root) return;
  const grid = root.querySelector("[data-grid]");
  const cards = [...grid.querySelectorAll(".fabric-card")], tiles = [...grid.querySelectorAll(".archive__tile")];
  const pills = [...root.querySelectorAll(".fpill")];
  const boxes = [...root.querySelectorAll("[data-filters] input")];
  const G = typeof gsap !== "undefined";

  // ordine con la proprietà CSS order (card su numeri pari, tessere sui dispari): così ordinare non sposta le tessere nel DOM
  const place = (list) => list.forEach((c, i) => (c.style.order = i * 2));
  place(cards);
  tiles.forEach((t) => (t.style.order = t.dataset.at * 2 - 1));

  // comparsa: la foto si scopre dal basso come una tendina e si assesta, poi nome e prezzo
  const media = (el) => el.querySelector(".fabric-card__media") || el;
  const show = (el, delay = 0) => {
    if (el._shown || !G) return; el._shown = true;
    gsap.to(media(el), { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "power3.inOut", delay, clearProps: "clipPath" });
    gsap.fromTo(media(el).querySelector("img"), { scale: 1.25 }, { scale: 1, duration: 1.5, ease: "power3.out", delay, clearProps: "transform" });
    gsap.fromTo(el.querySelectorAll(".fabric-card__title, .fabric-card__price, .fabric-card__meta, .archive__tile-text"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.7, delay: delay + 0.45, stagger: 0.05, clearProps: "all" });
  };
  if (G) {
    const items = [...tiles, ...cards];
    gsap.set(items.map(media), { clipPath: "inset(100% 0% 0% 0%)" });
    ScrollTrigger.batch(items, { start: "top 92%", once: true, onEnter: (batch) => batch.sort((a, b) => a.style.order - b.style.order).forEach((el, i) => show(el, i * 0.08)) });
  }

  // FLIP: si misura prima e dopo il cambio e ogni card parte da dov'era; quelle che ricompaiono (o arrivano da lontano) salgono in dissolvenza
  const flip = (change) => {
    if (!G) return change();
    const before = new Map(cards.map((c) => [c, c.hidden ? null : c.getBoundingClientRect()]));
    gsap.set(cards, { clearProps: "x,y,scale,opacity,visibility" });
    change();
    cards.forEach((c) => {
      if (c.hidden) return;
      const a = before.get(c), b = c.getBoundingClientRect();
      show(c);
      if (!a || Math.abs(a.top - b.top) > innerHeight * 0.8) return gsap.from(c, { autoAlpha: 0, y: 40, duration: 0.7, ease: "power3.out", delay: 0.15 });
      if (Math.abs(a.left - b.left) + Math.abs(a.top - b.top) + Math.abs(a.width - b.width) < 1) return;
      gsap.from(c, { x: a.left - b.left, y: a.top - b.top, scale: a.width / b.width, transformOrigin: "0 0", duration: 0.8, ease: "power3.inOut" });
    });
  };

  // barra agganciata: si misura sulla sezione (la barra sticky darebbe misure sbagliate) e si avvisa header e barra
  const bar = root.querySelector(".archive__bar");
  if (G) ScrollTrigger.create({ trigger: root, start: () => `top ${document.querySelector(".header").offsetHeight}px`, end: () => `bottom ${document.querySelector(".header").offsetHeight + bar.offsetHeight}px`,
    onToggle: (st) => [bar, document.body].forEach((el) => el.classList.toggle("bar-stuck", st.isActive)) });

  // filtri preimpostati da URL, es. tessuti.html?collezione=Aquaclean
  const params = new URLSearchParams(location.search);
  boxes.forEach((b) => (b.checked = params.getAll(b.name).includes(b.value)));

  const apply = () => {
    const chosen = {};
    boxes.filter((b) => b.checked).forEach((b) => (chosen[b.name] ??= []).push(b.value));
    let shown = 0;
    cards.forEach((card) => {
      card.hidden = !Object.entries(chosen).every(([key, values]) => values.includes(card.dataset[key]));
      shown += !card.hidden;
    });
    pills.forEach((p) => { const n = p.querySelectorAll("input:checked").length, el = p.querySelector("[data-n]"); el.textContent = n; el.hidden = !n; });
    grid.classList.toggle("is-filtered", Object.keys(chosen).length > 0);
    root.querySelector("[data-count]").textContent = shown;
    root.querySelector("[data-empty]").hidden = shown > 0;
    root.querySelector("[data-filters] [data-reset]").hidden = !Object.keys(chosen).length;
    if (G) ScrollTrigger.refresh();
  };
  boxes.forEach((b) => b.addEventListener("change", () => flip(apply)));
  if (params.size) apply();
  root.querySelectorAll("[data-reset]").forEach((r) => r.addEventListener("click", () => flip(() => {
    boxes.forEach((b) => (b.checked = false));
    apply();
  })));

  // tendine: una aperta alla volta, si chiudono cliccando fuori o con Esc
  pills.forEach((p) => p.addEventListener("toggle", () => p.open && pills.forEach((o) => o !== p && (o.open = false))));
  document.addEventListener("click", (e) => !e.target.closest(".fpill") && pills.forEach((p) => (p.open = false)));
  document.addEventListener("keydown", (e) => e.key === "Escape" && pills.forEach((p) => (p.open = false)));

  root.querySelector("[data-sort]").addEventListener("change", (e) => {
    const by = {
      az: (a, b) => a.dataset.name.localeCompare(b.dataset.name),
      za: (a, b) => b.dataset.name.localeCompare(a.dataset.name),
      colors: (a, b) => b.dataset.colors - a.dataset.colors,
    }[e.target.value];
    flip(() => { place(by ? [...cards].sort(by) : cards); grid.classList.toggle("is-sorted", !!by); });
  });

  root.querySelectorAll("[data-cols]").forEach((btn, _, all) => btn.addEventListener("click", () => flip(() => {
    grid.style.setProperty("--cols", btn.dataset.cols);
    grid.classList.toggle("is-dense", btn.dataset.cols === "6");
    all.forEach((b) => b.classList.toggle("is-active", b === btn));
  })));
}

// lente sulla trama in ogni griglia di prodotti (archivio, pagine collezione): un cerchio che segue il mouse e
// ingrandisce la foto 2,5 volte. Solo con mouse; il cursore sparisce solo dove la lente c'è (.has-lens)
function initLens() {
  if (!matchMedia("(hover: hover)").matches) return;
  const Z = 2.5;
  document.querySelectorAll(".archive__grid .fabric-card__media").forEach((m) => {
    const lens = document.createElement("span"), big = m.querySelector("img").cloneNode();
    lens.className = "lens"; big.removeAttribute("loading"); lens.append(big); m.append(lens); m.classList.add("has-lens");
    m.addEventListener("pointermove", (e) => {
      const r = m.getBoundingClientRect(), L = lens.offsetWidth, x = e.clientX - r.left, y = e.clientY - r.top;
      lens.style.transform = `translate(${x - L / 2}px, ${y - L / 2}px)`;
      Object.assign(big.style, { width: r.width * Z + "px", height: r.height * Z + "px", transform: `translate(${L / 2 - x * Z}px, ${L / 2 - y * Z}px)` });
    });
  });
}
