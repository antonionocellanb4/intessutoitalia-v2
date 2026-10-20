// Mega menu + header sempre visibile, col vetro dopo la hero.
function initHeader() {
  const root = document.documentElement;
  const header = document.querySelector(".header");
  const toggles = document.querySelectorAll("[data-menu-toggle]");
  const panels = document.querySelectorAll(".mega");

  // menu a pillole: voci staccate unite da colli "liquidi" (forme + filtro #goo in layout.js, ricalcolate dalle misure vere
  // delle voci mentre si spostano). In hover lo spazio ai lati della voce si allarga e il collo si allunga, come un filo
  // che si tende. Una luce rame segue il cursore; a riposo sta sulla voce aperta o sulla pagina corrente.
  const pills = [...document.querySelectorAll(".header__links, .header__right")].map((group) => {
    const bg = document.createElement("span");
    const glow = document.createElement("span");
    bg.className = "pills__bg";
    glow.className = "pills__glow";
    bg.setAttribute("aria-hidden", "true");
    glow.setAttribute("aria-hidden", "true");
    group.prepend(bg, glow);
    const items = [...group.querySelectorAll(".header__link")];
    let glowX = null, raf = 0;
    const place = () => {
      const el = group.querySelector('.header__link[aria-expanded="true"], .header__link.is-current');
      const x = glowX ?? (el && el.offsetParent ? el.offsetLeft + el.offsetWidth / 2 : null);
      glow.style.opacity = x === null ? 0 : 1;
      if (x !== null) glow.style.transform = `translateX(${x}px)`;
    };
    const build = () => {
      const o = bg.getBoundingClientRect();
      const rs = items.filter((el) => el.offsetParent).map((el) => el.getBoundingClientRect());
      bg.innerHTML = rs.map((r, i) => {
        const next = rs[i + 1], y = r.top - o.top + r.height / 2;
        return `<i style="left:${r.left - o.left}px;top:${r.top - o.top}px;width:${r.width}px;height:${r.height}px"></i>` +
          (next ? `<b style="left:${r.right - o.left - 4}px;top:${y - 5}px;width:${next.left - r.right + 8}px;height:10px"></b>` : "");
      }).join("");
      place();
    };
    // spazio ai lati della voce in hover (transizione CSS sui margini) e forme ridisegnate a ogni fotogramma finché si muovono
    const spread = (on) => {
      const vis = items.filter((el) => el.offsetParent);
      vis.forEach((el, i) => {
        el.style.marginLeft = el === on && i > 0 ? ".6rem" : "";
        el.style.marginRight = el === on && i < vis.length - 1 ? ".6rem" : "";
      });
      const t0 = performance.now();
      cancelAnimationFrame(raf);
      const loop = () => { build(); if (performance.now() - t0 < 650) raf = requestAnimationFrame(loop); };
      loop();
    };
    items.forEach((el) => el.addEventListener("pointerenter", () => spread(el)));
    group.addEventListener("pointermove", (e) => { glowX = e.clientX - group.getBoundingClientRect().left; place(); });
    group.addEventListener("pointerleave", () => { glowX = null; spread(null); });
    build();
    document.fonts?.ready.then(build);
    addEventListener("resize", build);
    return place;
  });

  // id del pannello da aprire, o null per chiudere
  let openId = null;
  const setOpen = (id) => {
    openId = id;
    // chiudendo, l'header resta "da menu" finché il pannello bianco non è risalito sopra il logo
    root.classList.toggle("menu-closing", !id && root.classList.contains("menu-open"));
    const was = [...panels].find((p) => p.classList.contains("is-open"));
    if (!id && was) {
      // il bordo del pannello che risale passa sopra il logo: da lì l'header torna normale (logo bianco/scuro della pagina)
      const watch = () => {
        if (openId) return;
        const cut = parseFloat(getComputedStyle(was).clipPath.split(" ")[2]) || 0; // inset(0 0 X% 0)
        if (was.offsetHeight * (1 - cut / 100) <= header.offsetHeight / 2) root.classList.remove("menu-closing");
        else requestAnimationFrame(watch);
      };
      requestAnimationFrame(watch);
    }
    root.classList.toggle("menu-open", !!id);
    panels.forEach((p) => p.classList.toggle("is-open", p.id === id));
    if (!id) panels.forEach((p) => p.classList.remove("is-sub")); // chiudendo, si riparte dal primo livello
    toggles.forEach((t) => t.setAttribute("aria-expanded", t.dataset.menuToggle === id));
    pills.forEach((place) => place());
    id ? lenis?.stop() : lenis?.start();
  };
  toggles.forEach((t) => t.addEventListener("click", () => setOpen(openId === t.dataset.menuToggle ? null : t.dataset.menuToggle)));

  document.querySelectorAll("[data-menu-close]").forEach((b) => b.addEventListener("click", () => setOpen(null)));

  // telefono, menu a livelli: Prodotti e Azienda entrano da destra sopra il primo livello; "Menu" li riporta indietro
  document.querySelectorAll("[data-sub]").forEach((b) => b.addEventListener("click", () => {
    const sub = document.getElementById(b.dataset.sub);
    sub.scrollTop = 0;
    sub.classList.add("is-sub");
    b.setAttribute("aria-expanded", true);
    sub.querySelector("[data-sub-back]").focus({ preventScroll: true });
  }));
  document.querySelectorAll("[data-sub-back]").forEach((b) => b.addEventListener("click", () => {
    const sub = b.closest(".mega");
    sub.classList.remove("is-sub");
    const opener = document.querySelector(`[data-sub="${sub.id}"]`);
    opener.setAttribute("aria-expanded", false);
    opener.focus({ preventScroll: true });
  }));
  addEventListener("keydown", (e) => e.key === "Escape" && setOpen(null));

  // voci grandi del menu: la foto a destra e la didascalia seguono la voce sotto il mouse (o col fuoco da tastiera)
  document.querySelectorAll("[data-mega-img]").forEach((a) => ["pointerenter", "focus"].forEach((ev) => a.addEventListener(ev, () => {
    const panel = a.closest(".mega");
    panel.querySelectorAll(".mega__preview img").forEach((img, i) => img.classList.toggle("is-active", i === +a.dataset.megaImg));
    panel.querySelector(".mega__caption").innerHTML = `<strong>${a.textContent}</strong><span>${a.dataset.desc}</span>`;
  })));

  // header sempre visibile; il vetro compare oltre la hero (o subito se non c'è)
  const hero = document.querySelector("[data-hero]");
  // vetro scuro quando sotto l'header c'è un fondo scuro (pannello nero, footer, sezioni a tutta foto): si legge il colore vero
  // del primo elemento con un fondo pieno appena sotto la barra
  const darkUnder = () => {
    const y = header.offsetHeight + 2;
    for (const el of document.elementsFromPoint(innerWidth / 2, y)) {
      if (header.contains(el) || el.closest(".mega, .mega-backdrop")) continue;
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        const m = getComputedStyle(n).backgroundColor.match(/[\d.]+/g);
        if (m && (m[3] === undefined || +m[3] > 0.5)) return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2] < 128;
      }
      return false;
    }
    return false;
  };
  let raf = 0;
  const onScroll = () => {
    // hero con data-hero-fx: diventa bianca appena si scrolla (pages.js initHeroFx), quindi l'header passa subito al vetro
    const limit = !hero ? 10 : hero.hasAttribute("data-hero-fx") ? 2 : hero.offsetHeight - header.offsetHeight;
    header.classList.toggle("is-solid", scrollY > limit);
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => header.classList.toggle("is-dark", darkUnder())); // dopo l'aggiornamento delle animazioni
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
