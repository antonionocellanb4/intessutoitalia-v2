
renderLayout();
document.documentElement.classList.add("js");

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (typeof gsap !== "undefined" && !reduced) {
  gsap.registerPlugin(ScrollTrigger);
  initSmoothScroll();
  // i pin vanno creati in ordine di pagina e prima dei trigger sottostanti
  initHero();
  initFabrics();
  initStack();
  initDeep(); // Chi siamo
  initFwords();
  initTape(); // La nostra storia
  initVzoom(); // Mission, Vision e Valori
  initGsteps(); // Sostenibilità
  initGlabels();
  initGnums();
  initGplanet();
  initGfloat();
  initAqList(); // Aquaclean
  initFprops(); // Fabrics
  initWeave(); // GreenFabrics
  initSrZoom(); initSrWall(); // Showroom
  initCerts(); // Certificazioni
  if (typeof initWash === "function") initWash(); // Aquaclean, drops.js
  initVreel();
  initBlinds();
  initSeam();
  initReveal();
  initFooterFx();
  initHeroFx(); // hero Aquaclean, dopo initReveal
} else {
  document.documentElement.classList.remove("js"); // senza animazioni tutto resta visibile
}
if (typeof initFur === "function") initFur(); // indipendente da GSAP; fur.js è caricato solo in home
if (typeof initRibbon === "function") initRibbon(); // ribbon.js solo in Sostenibilità
initSofa();
initSpot();
initHeader();
initCart();
initCarousels();
initArchive();
initLens();
initProduct();
initVideos();
initHeroVideo();
initChapters();
initVrows();
initForms();
initAsk();
