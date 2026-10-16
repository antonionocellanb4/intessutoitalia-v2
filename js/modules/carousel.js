// [data-carousel]: binario con scroll orizzontale nativo (scroll-snap), frecce [data-prev]/[data-next]
// cercate nel contenitore [data-carousel-wrap] più vicino.
function initCarousels() {
  document.querySelectorAll("[data-carousel]").forEach((track) => {
    const wrap = track.closest("[data-carousel-wrap]") || track.parentElement;
    const prev = wrap.querySelector("[data-prev]");
    const next = wrap.querySelector("[data-next]");
    const step = () => (track.firstElementChild?.offsetWidth || 300) + parseFloat(getComputedStyle(track).columnGap || 0);
    const update = () => {
      if (prev) prev.disabled = track.scrollLeft < 4;
      if (next) next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 4;
    };
    prev?.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
    next?.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
    track.addEventListener("scroll", update, { passive: true });
    update();
  });
}
