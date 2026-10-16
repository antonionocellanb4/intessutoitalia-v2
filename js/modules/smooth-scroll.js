// Lenis pilota ScrollTrigger tramite il ticker GSAP.
let lenis; // usato dal menu per bloccare lo scroll a menu aperto

function initSmoothScroll() {
  if (typeof Lenis === "undefined") return;
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // ancore interne con scroll morbido (con offset per l'header)
  document.querySelectorAll('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const target = a.getAttribute("href").length > 1 && document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: "full" in target.dataset ? 0 : -90 }); // le sezioni a tutto schermo vanno a filo
    })
  );
}
