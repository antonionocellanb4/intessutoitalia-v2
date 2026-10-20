// Header, menu e footer comuni a tutte le pagine, generati da qui per non duplicarli in ogni HTML.
// <body data-header="over"> = header trasparente sopra la hero (diventa pieno in scroll).
// Le voci senza href sono pagine non ancora previste nel prototipo (link disattivati).

// mega menu "Prodotti": solo link veri. Le collezioni e i filtri portano all'archivio già filtrato (archive.js legge l'URL).
// Ogni collezione ha la sua foto, che compare a destra al passaggio del mouse (header.js).
const MEGA_COLLECTIONS = [
  ["Tutti i tessuti", "tessuti.html", "assets/img/tessuti.jpg", "Il catalogo completo, da filtrare per collezione, composizione e colore."],
  ["Fabrics", "fabrics.html", "assets/img/drappeggio.jpg", "Tessuti d'arredamento per divani, poltrone e sedute."],
  ["GreenFabrics", "greenfabrics.html", "assets/img/green-fabrics-naturel.jpg", "Tessuti da fibre riciclate, con certificazione."],
  ["Aquaclean", "aquaclean.html", "assets/img/aquaclean/oasis.jpg", "Antimacchia: le macchie vanno via con un po' d'acqua."],
];
const MEGA_PROPS = ["Idrorepellente", "Indoor/outdoor", "Ignifugo", "Doppia altezza", "Eco-certified"];
// famiglie di colore dell'archivio, col campione Aragon più vicino
const MEGA_COLORS = [["Neutri", "beige"], ["Grigi", "light-grey"], ["Blu", "ocean"], ["Verdi", "forest"], ["Rossi", "red"], ["Gialli", "yellow"]];
const CONFIGURATOR = "https://intessuto.vercel.app/configuratore";

// mega menu "Azienda": le voci del menu di prima. Senza href = pagina non ancora fatta (link disattivato, didascalia "in preparazione").
const MEGA_COMPANY = [
  ["Chi siamo", "chi-siamo.html", "assets/img/liberty.jpg", "Nuova Pugliatex: tessuti per l'arredamento dagli anni '60, a Noci (BA)."],
  ["La nostra storia", "la-nostra-storia.html", "assets/img/naturel2-1.jpg", "Dal boom degli anni '60 a oggi, in sei tappe."],
  ["Mission, Vision & Valori", "mission-vision-valori.html", "assets/img/dsc02314.jpg", "Cosa facciamo, per chi e con quali valori."],
  ["Qualità e certificazioni", "certificazioni.html", "assets/img/dsc01644-1.jpg", "Le certificazioni dei nostri tessuti, come OEKO-TEX®."],
  ["Sostenibilità", "sostenibilita.html", "assets/img/copertina-green-fabrics.jpg", "GreenFabrics: cotone rigenerato, certificato GRS, Made in Italy."],
  ["News", "", "assets/img/mood-board1-1.jpg"],
  ["Lavora con noi", "", "assets/img/tessuti.jpg"],
];
const MEGA_SERVICES = [["Richiedi un campionario", "contatti.html"], ["Consulenza", "contatti.html"], ["Entra nella Rete vendita", "contatti.html"]];
const MEGA_EXPLORE = [["Showroom", "showroom.html"], ["Applicazioni"], ["Ispirazione"], ["Contatti", "contatti.html"]];
const SOON = "Pagina in preparazione.";

// pannello del mega menu: voci grandi con foto e didascalia a destra (header.js), colonna di link, barra in fondo
const megaPanel = (id, label, items, middle, bar) => `
<div class="mega" id="${id}" data-lenis-prevent>
  <button type="button" class="mega__back" data-sub-back>Menu</button>
  <div class="mega__main">
    <nav class="mega__colls${items.length > 4 ? " mega__colls--long" : ""}" aria-label="${label}">
      ${items.map(([l, h, , d], i) => link(l, h).replace("<a", `<a data-mega-img="${i}" data-desc="${d || SOON}"`)).join("")}
    </nav>
    <div class="mega__filters">${middle}</div>
    <div class="mega__preview" aria-hidden="true">
      ${items.map(([, , img], i) => `<img src="${img}" alt="" loading="lazy"${i ? "" : ' class="is-active"'}>`).join("")}
      <p class="mega__caption"><strong>${items[0][0]}</strong><span>${items[0][3]}</span></p>
    </div>
  </div>
  <div class="mega__bar">${bar}</div>
</div>`;
const megaGroup = (label, links, cls = "") => `
      <div class="mega__group${cls}">
        <p class="mega__label">${label}</p>
        ${links.map(([l, h]) => link(l, h)).join("")}
      </div>`;

const link = (label, href, cls = "") =>
  href ? `<a href="${href}"${cls ? ` class="${cls}"` : ""}>${label}</a>`
       : `<a${cls ? ` class="${cls}"` : ""} aria-disabled="true" title="Pagina non inclusa nel prototipo">${label}</a>`;

// il server può togliere ".html" dagli indirizzi (/chi-siamo): si rimette per confrontare
const PAGE = (location.pathname.split("/").pop() || "index").replace(/(\.html)?$/, ".html");
const current = (h) => (h === PAGE ? "header__link is-current" : "header__link");
const COMPANY_PAGES = ["chi-siamo.html", "la-nostra-storia.html", "mission-vision-valori.html", "certificazioni.html", "sostenibilita.html"];

function header(over) {
  return `
<header class="header${over ? " header--over" : ""}">
  <div class="header__left">
    <button type="button" class="header__burger" aria-label="Apri il menu" aria-controls="menu-m" aria-expanded="false" data-menu-toggle="menu-m"><span></span><span></span></button>
    <nav class="header__links" aria-label="Principale">
      <button type="button" class="header__link" aria-controls="menu" aria-expanded="false" data-menu-toggle="menu">Prodotti</button>
      <button type="button" class="${COMPANY_PAGES.includes(PAGE) ? "header__link is-current" : "header__link"}" aria-controls="menu-azienda" aria-expanded="false" data-menu-toggle="menu-azienda">Azienda</button>
      ${link("Showroom", "showroom.html", current("showroom.html"))}
    </nav>
    <button type="button" class="header__link header__close" data-menu-close>Chiudi</button>
  </div>
  <a href="index.html" class="header__logo" aria-label="intessutoitalia — Home"><img src="assets/logo/intessutoitalia.png" alt="intessutoitalia" width="232" height="120"></a>
  <div class="header__right">
    <span class="header__link header__lang">ITA</span>
    <button type="button" class="header__link header__search">Cerca</button>
    <button type="button" class="header__link header__cart" aria-controls="cart" aria-label="Carrello" data-cart-open><span class="header__cart-txt">Carrello (</span><svg class="header__cart-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg><span data-cart-n>0</span><span class="header__cart-txt">)</span></button>
  </div>
</header>
<!-- filtro "liquido" per le pillole del menu (header.js): sfoca le forme bianche e ne ritaglia il contorno, così i ponti
     tra una pillola e l'altra diventano colli morbidi -->
<svg class="goo-defs" aria-hidden="true" width="0" height="0"><filter id="goo"><feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b"/><feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"/></filter></svg>
<div class="mega-backdrop" data-menu-close></div>
<!-- telefono: primo livello del menu; Prodotti e Azienda aprono il loro pannello che entra da destra (header.js) -->
<div class="mega mega--root" id="menu-m" data-lenis-prevent>
  <div class="mega__main">
    <nav class="mega__colls" aria-label="Menu">
      <button type="button" class="mega__sub" aria-controls="menu" data-sub="menu">Prodotti</button>
      <button type="button" class="mega__sub" aria-controls="menu-azienda" data-sub="menu-azienda">Azienda</button>
      ${link("Showroom", "showroom.html")}
      ${link("Contatti", "contatti.html")}
    </nav>
  </div>
  <div class="mega__bar">
    <p><strong>Non sai quale tessuto scegliere?</strong> Il configuratore ti propone quelli adatti al tuo divano.</p>
    <div class="mega__actions">
      <a href="contatti.html" class="btn btn--light">Richiedi un campionario</a>
      <a href="${CONFIGURATOR}" class="btn btn--white" target="_blank" rel="noopener">Prova il configuratore</a>
    </div>
  </div>
</div>
${megaPanel("menu", "Collezioni", MEGA_COLLECTIONS, `
      <div class="mega__group">
        <p class="mega__label">Per caratteristica</p>
        ${MEGA_PROPS.map((v) => `<a href="tessuti.html?proprieta=${encodeURIComponent(v)}">${v}</a>`).join("")}
      </div>
      <div class="mega__group">
        <p class="mega__label">Per colore</p>
        <div class="mega__colors">
          ${MEGA_COLORS.map(([v, f]) => `<a href="tessuti.html?colore=${v}"><img src="assets/img/aragon/thumbs/${f}.jpg" alt="" loading="lazy">${v}</a>`).join("")}
        </div>
      </div>`, `
    <p><strong>Non sai quale tessuto scegliere?</strong> Il configuratore ti propone quelli adatti al tuo divano.</p>
    <div class="mega__actions">
      <a href="contatti.html" class="btn btn--light">Richiedi un campionario</a>
      <a href="${CONFIGURATOR}" class="btn btn--white" target="_blank" rel="noopener">Prova il configuratore</a>
    </div>`)}
${megaPanel("menu-azienda", "Azienda", MEGA_COMPANY, megaGroup("Servizi", MEGA_SERVICES) + megaGroup("Esplora", MEGA_EXPLORE), `
    <p><strong>Nuova Pugliatex S.r.l.</strong> Via Repubblica, 36/F · 70015 Noci (BA) · <a href="mailto:info@inpelleitalia.it">info@inpelleitalia.it</a> · <a href="tel:+390804977274">+39 080 497 7274</a></p>
    <div class="mega__actions"><a href="contatti.html" class="btn btn--white">Contattaci</a></div>`)}`;
}

// pagine già realizzate: i link verso tutte le altre vengono disattivati (niente 404 nel prototipo).
// Aggiungere qui ogni nuova pagina.
const BUILT = [
  "index.html", "tessuti.html", "scheda-prodotto.html", "aquaclean.html", "fabrics.html", "greenfabrics.html",
  "chi-siamo.html", "la-nostra-storia.html", "mission-vision-valori.html", "certificazioni.html", "sostenibilita.html", "showroom.html", "contatti.html",
];

function disableMissingLinks() {
  document.querySelectorAll('a[href$=".html"]').forEach((a) => {
    if (BUILT.includes(a.getAttribute("href").split(/[?#]/)[0])) return;
    a.removeAttribute("href");
    a.setAttribute("aria-disabled", "true");
    a.title = "Pagina non ancora inclusa nel prototipo";
  });
}

// Footer: chiusura con domanda + CTA, link in 3 colonne, scritta gigante del logo. La pagina finisce con gli angoli
// arrotondati e sale scoprendo il footer, che sembra fermo sotto (pages.js initFooterFx); le lettere salgono una alla volta.
const FOOTER_COLS = [
  ["Prodotti", [["Tessuti", "tessuti.html"], ["Fabrics", "fabrics.html"], ["Microfibre"], ["Pelli"], ["GreenFabrics", "greenfabrics.html"], ["Aquaclean", "aquaclean.html"], ["Configuratore"]]],
  ["Azienda", [["Chi siamo", "chi-siamo.html"], ["La nostra storia", "la-nostra-storia.html"], ["Mission, Vision & Valori", "mission-vision-valori.html"], ["Qualità e certificazioni", "certificazioni.html"], ["Showroom", "showroom.html"], ["Lavora con noi"]]],
  ["Assistenza", [["Richiedi un campionario"], ["Consulenza"], ["Entra nella Rete vendita"], ["Spedizioni e reso"], ["Modalità di pagamento"], ["Termini e condizioni"]]],
];
function footer() {
  return `
<footer class="footer footer2">
  <div class="container footer2__ask">
    <h2 class="footer2__title">Hai un divano<br>da rivestire?</h2>
    <div class="footer2__side">
      <p>Scegli il tessuto dal vivo nel nostro showroom di Noci, oppure fatti spedire i campioni.</p>
      <div class="hero__actions"><a href="contatti.html" class="btn btn--solid">Richiedi i campioni</a><a href="showroom.html" class="btn btn--light">Visita lo showroom</a></div>
    </div>
  </div>
  <div class="container footer2__grid">
    <div class="footer2__contacts">
      <p class="footer__company">Nuova Pugliatex S.r.l.</p>
      <p>Via Repubblica, 36/F<br>70015 Noci (BA)</p>
      <p><a href="mailto:info@inpelleitalia.it">info@inpelleitalia.it</a><br><a href="tel:+390804977274">+39 080 497 7274</a></p>
      <p class="footer2__social"><a href="#">Instagram</a><a href="#">LinkedIn</a><a href="#">Facebook</a></p>
    </div>
    ${FOOTER_COLS.map(([title, links]) => `
    <div>
      <p class="footer__title">${title}</p>
      <div class="footer__links">${links.map(([l, h]) => link(l, h)).join("")}</div>
    </div>`).join("")}
  </div>
  <div class="footer2__word" data-footer-word><img src="assets/logo/wordmark.svg" alt="" aria-hidden="true" loading="lazy"></div>
  <div class="footer__legal">
    <div class="container">
      <p>©2026 Nuova Pugliatex S.r.l. — P.IVA 03982730727 | REA 286424 | Capitale sociale € 258.250,00 i.v. | PEC nuovapugliatex@pec.it<br>Pagamenti: Visa, Mastercard, American Express, PayPal, Apple Pay, Google Pay, Bonifico, Klarna · Spedizioni: BRT, GLS, DHL</p>
      <p><a aria-disabled="true">Privacy Policy</a> — <a aria-disabled="true">Cookie Policy</a><br>Made in Never Before Italia</p>
    </div>
  </div>
</footer>`;
}

function renderLayout() {
  const body = document.body;
  body.insertAdjacentHTML("afterbegin", header(body.dataset.header === "over"));
  body.querySelector("main").insertAdjacentHTML("afterend", footer());
  body.classList.add("footer-reveal");
  // main è ritagliato (clip-path, angoli tondi sopra il footer): gli elementi fissi devono stare fuori, o vengono tagliati
  body.querySelectorAll("main .pd-buy").forEach((el) => body.append(el));
  disableMissingLinks();
}
