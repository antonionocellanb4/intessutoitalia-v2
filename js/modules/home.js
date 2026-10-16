// Home: hero e sezione "Nuovi tessuti" (titolo fermo, le card scorrono in orizzontale).
function initHero() {
  const media = document.querySelector(".hero__media img");
  if (!media) return;
  gsap.from(media, { scale: 1.15, duration: 2.4, ease: "power3.out" });
  gsap.to(media, {
    yPercent: 18, ease: "none",
    scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true },
  });
}

function initFabrics() {
  const section = document.querySelector("[data-fabrics]");
  if (!section) return;
  const track = section.querySelector(".fabrics__track");
  const title = section.querySelector(".fabrics__title");
  const fill = section.querySelector(".fabrics__fill");
  const tiles = [...track.querySelectorAll(".fabric-tile")];
  const end = tiles[tiles.length - 1];
  section.classList.add("is-pinned");

  // Tre tempi, misurati in pixel di scroll:
  //   1. le card scorrono; l'ultima (scura) cancella la scritta, si raddrizza e cresce fino al centro
  //   2. ferma al centro, si apre a tutto schermo (un pannello scuro che parte dal suo rettangolo)
  //   3. PROVA: nel pannello salgono le collezioni impilate (copie dei pannelli della sezione sotto), poi la pagina prosegue
  // partenza oltre il bordo destro con margine, altrimenti l'angolo della card ruotata si intravede
  const startX = () => innerWidth * 1.15;
  const centerX = () => section.offsetWidth / 2 - (end.offsetLeft + end.offsetWidth / 2); // senza la barra di scorrimento
  const GROW = 1.2;
  // PROVA: collezioni in orizzontale dentro il pannello. Copie dei pannelli della sezione sotto
  // (senza data-stack, così initStack non le tocca), con il nome sopra la foto per la fase "foto intera".
  const rail = document.createElement("div");
  rail.className = "coll-rail";
  fill.append(rail);
  const colls = [...document.querySelectorAll("[data-stack]")].map((p) => {
    const c = p.cloneNode(true);
    c.removeAttribute("data-stack");
    c.removeAttribute("style");
    c.classList.add("coll-slide");
    c.querySelectorAll("img").forEach((img) => (img.loading = "eager"));
    const tag = document.createElement("div");
    tag.className = "coll-slide__tag";
    tag.innerHTML = `<p class="caps">${c.querySelector(".caps").textContent}</p><p class="coll-slide__name">${c.querySelector(".stack__name").textContent}</p>`;
    c.querySelector(".stack__media").append(tag);
    const slot = document.createElement("div");
    slot.className = "coll-rail__slot";
    slot.append(c);
    rail.append(slot);
    return c;
  });
  // dS = scorrimento a una collezione, dO = la foto si stringe e compaiono i dettagli, dH = pausa sui dettagli
  const d1 = startX() - centerX(), d2 = innerHeight * 0.9, d5 = innerHeight * 0.6, d3 = innerHeight * 0.3;
  const dS = innerHeight * 0.8, dO = innerHeight * 0.7, dH = innerHeight * 0.3, dC = dS + dO + dH;
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: section, start: "top top", end: `+=${d1 + d2 + d5 + dC * colls.length + d3}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
  });
  tl.fromTo(track, { x: startX }, { x: centerX, ease: "power1.out", duration: d1 }, 0);
  tiles.forEach((card, k) =>
    tl.fromTo(card, { rotate: k % 2 ? 9 : -7 }, { rotate: card === end ? 0 : k % 2 ? -5 : 6, duration: d1 }, 0)
  );
  tl.to(end, { scale: GROW, duration: d1 * 0.35 }, d1 * 0.65);
  tl.to(end.children, { autoAlpha: 0, duration: d1 * 0.08 }, d1 * 0.9);

  // il pannello parte esattamente dal rettangolo della card (stesso colore) e si allarga a tutto schermo
  const rect = () => {
    const w = end.offsetWidth * GROW, h = end.offsetHeight * GROW;
    const y = (section.offsetHeight - h) / 2, x = (section.offsetWidth - w) / 2;
    return `inset(${y}px ${x}px ${y}px ${x}px round 8px)`;
  };
  tl.fromTo(fill, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, d1);
  tl.fromTo(fill, { clipPath: rect }, { clipPath: "inset(0px 0px 0px 0px round 0px)", ease: "power2.inOut", duration: d2 }, d1);
  // prima il titolo al centro del pannello; la prima collezione arriva da destra e lui arretra
  const head = fill.querySelector(".fabrics__fill-head");
  tl.fromTo(head.children, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, stagger: d2 * 0.1, duration: d2 * 0.4, ease: "power2.out" }, d1 + d2 * 0.55);
  const t0 = d1 + d2 + d5;
  tl.to(head, { scale: 0.9, autoAlpha: 0, duration: dS }, t0);
  // per ogni collezione: arriva a foto intera (nome sopra), la foto si stringe e compaiono i dettagli, pausa, poi la prossima
  colls.forEach((c, k) => {
    const at = t0 + dC * k;
    tl.fromTo(rail, { xPercent: -100 * (k - 1) }, { xPercent: -100 * k, ease: "power2.inOut", duration: dS, immediateRender: !k }, at);
    tl.fromTo(c, { "--open": 0 }, { "--open": 1, ease: "power2.inOut", duration: dO }, at + dS);
  });
  tl.to({}, { duration: dH + d3 }); // pausa sull'ultima collezione: la timeline dura quanto lo scroll

  // Copia bianca del titolo dentro ogni foto, riallineata all'originale a ogni frame.
  // La card è ruotata: la distanza tra i due centri va riportata nel sistema della card (rotazione inversa).
  const ghosts = tiles
    .map((tile) => ({ tile, img: tile.querySelector(".fabric-tile__img"), ghost: tile.querySelector(".fabrics__ghost") }))
    .filter((g) => g.ghost);
  const size = () => {
    const cs = getComputedStyle(title);
    ghosts.forEach(({ ghost }) => Object.assign(ghost.style, {
      width: `${title.offsetWidth}px`, fontSize: cs.fontSize, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing, padding: cs.padding,
    }));
  };
  // l'ultima card (quella scura) si porta via la scritta: il titolo resta solo a sinistra del suo bordo
  const align = () => {
    const t = title.getBoundingClientRect();
    const tx = t.left + t.width / 2, ty = t.top + t.height / 2;
    const e = end.getBoundingClientRect();
    // punto più a sinistra della card ruotata: tagliando lì non restano schegge di lettere accanto all'angolo
    const cut = Math.min(t.width, Math.max(0, t.right - e.left));
    title.style.clipPath = cut ? `inset(-20% ${cut}px -20% 0)` : "";
    ghosts.forEach(({ tile, img, ghost }) => {
      const r = tile.getBoundingClientRect();
      if (r.right < 0 || r.left > innerWidth) return;
      const a = (gsap.getProperty(tile, "rotate") * Math.PI) / 180;
      const dx = tx - (r.left + r.width / 2), dy = ty - (r.top + r.height / 2);
      const lx = dx * Math.cos(a) + dy * Math.sin(a), ly = -dx * Math.sin(a) + dy * Math.cos(a);
      const x = tile.offsetWidth / 2 + lx - img.offsetLeft - ghost.offsetWidth / 2;
      const y = tile.offsetHeight / 2 + ly - img.offsetTop - ghost.offsetHeight / 2;
      ghost.style.transform = `translate(${x}px, ${y}px) rotate(${-a}rad)`;
    });
  };
  size();
  ScrollTrigger.addEventListener("refresh", size);
  gsap.ticker.add(align);
}

// Collezioni: quando il pannello successivo sale, quello sotto si rimpicciolisce e si scurisce.
function initStack() {
  if (innerWidth <= 1000 || document.getElementById("collezioni")?.hidden) return; // sotto i 1000px i pannelli sono in colonna, senza aggancio; nascosta durante la prova
  const panels = gsap.utils.toArray("[data-stack]");
  panels.forEach((panel, k) => {
    const next = panels[k + 1];
    gsap.fromTo(panel.querySelector(".stack__media img"), { yPercent: -6 }, {
      yPercent: 6, ease: "none", scrollTrigger: { trigger: panel, start: "top bottom", end: "bottom top", scrub: true },
    });
    if (!next) return;
    gsap.to(panel, {
      scale: 0.94, "--shade": 0.45, ease: "none",
      scrollTrigger: { trigger: next, start: "top bottom", end: "top top+=120", scrub: true },
    });
  });
}

// Configuratore: il divano cambia tessuto da solo ogni 3s mentre è in vista; un clic sul campione lo sceglie
// e ferma il giro automatico.
function initSofa() {
  const root = document.querySelector("[data-sofa]");
  if (!root) return;
  const photos = [...root.querySelectorAll(".sofa__photos img")];
  const buttons = [...root.querySelectorAll(".sofa__swatches button")];
  const name = root.querySelector(".sofa__name");
  let i = 0, timer, visible = false, manual = false;

  const show = (n) => {
    i = (n + photos.length) % photos.length;
    photos.forEach((p, k) => p.classList.toggle("is-active", k === i));
    buttons.forEach((b, k) => b.setAttribute("aria-pressed", k === i));
    name.textContent = buttons[i].dataset.name;
  };
  const loop = () => {
    clearTimeout(timer);
    if (visible && !manual) timer = setTimeout(() => { show(i + 1); loop(); }, 3000);
  };
  buttons.forEach((b, k) => b.addEventListener("click", () => { manual = true; clearTimeout(timer); show(k); }));
  // la foto successiva va precaricata, altrimenti il primo cambio lampeggia
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) photos.forEach((p) => (p.loading = "eager"));
    loop();
  }, { threshold: 0.3 }).observe(root);
}

// Progetti: un progetto alla volta; il punto sulla foto e la riga dell'elenco scelgono lo stesso tessuto
function initSpot() {
  const root = document.querySelector("[data-spot]");
  if (!root) return;
  const photos = [...root.querySelectorAll(".spot__photo")];
  const infos = [...root.querySelectorAll(".spot__info")];
  const thumbs = [...root.querySelectorAll(".spot__thumbs button")];
  const pickFabric = (p, f) => {
    [photos[p], infos[p]].forEach((el) => el.querySelectorAll("[data-f]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.f === String(f))));
    infos[p].querySelector("[data-spot-name]").textContent = photos[p].querySelectorAll(".spot__dot")[f].textContent;
  };
  const pickProject = (p) => {
    [photos, infos].forEach((set) => set.forEach((el, i) => el.classList.toggle("is-active", i === p)));
    thumbs.forEach((t, i) => t.setAttribute("aria-pressed", i === p));
    photos[p].querySelector("img").loading = "eager";
  };
  photos.forEach((ph, p) => [ph, infos[p]].forEach((el) =>
    el.querySelectorAll("[data-f]").forEach((b) => b.addEventListener("click", () => pickFabric(p, +b.dataset.f)))));
  thumbs.forEach((t, p) => t.addEventListener("click", () => pickProject(p)));
}
