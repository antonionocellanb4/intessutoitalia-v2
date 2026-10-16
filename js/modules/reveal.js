// Reveal on scroll. Attributi:
//   data-reveal       fade + slide up
//   data-stagger      figli in cascata
//   data-reveal-img   immagine con clip-path dal basso
//   data-parallax     immagine interna in parallasse (CSS la ingrandisce per coprire)
//   data-split        titolo riga per riga (righe separate da <br>)
//   data-words        testo che si accende parola per parola durante lo scroll
const EASE = "power3.out";

function initReveal() {
  const trigger = (el) => ({ trigger: el, start: "top 88%", once: true });

  gsap.utils.toArray("[data-reveal]").forEach((el) =>
    gsap.fromTo(el, { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: EASE, scrollTrigger: trigger(el) })
  );

  gsap.utils.toArray("[data-stagger]").forEach((wrap) =>
    gsap.fromTo(wrap.children, { autoAlpha: 0, y: 48 }, {
      autoAlpha: 1, y: 0, duration: 1.1, ease: EASE, stagger: 0.1, scrollTrigger: trigger(wrap),
    })
  );

  gsap.utils.toArray("[data-reveal-img]").forEach((el) =>
    gsap.fromTo(el, { clipPath: "inset(100% 0 0 0)" }, {
      clipPath: "inset(0% 0 0 0)", duration: 1.4, ease: "power3.inOut", scrollTrigger: trigger(el),
    })
  );

  gsap.utils.toArray("[data-parallax]").forEach((el) =>
    gsap.fromTo(el.querySelector("img, video"), { yPercent: -8 }, {
      yPercent: 8, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
    })
  );

  gsap.utils.toArray("[data-words]").forEach((el) => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="word">${w}</span>`).join(" ");
    gsap.to(el.querySelectorAll(".word"), {
      opacity: 1, ease: "none", stagger: 0.1,
      scrollTrigger: { trigger: el, start: "top 85%", end: "bottom 50%", scrub: true },
    });
  });

  gsap.utils.toArray("[data-split]").forEach((title) => {
    title.innerHTML = title.innerHTML.split(/<br\s*\/?>/).map((l) => `<span class="line"><span>${l}</span></span>`).join("");
    const lines = title.querySelectorAll(".line > span");
    const intro = title.closest("[data-hero]");
    gsap.from(lines, {
      yPercent: 110, duration: 1.3, ease: EASE, stagger: 0.12, delay: intro ? 0.25 : 0,
      scrollTrigger: intro ? undefined : trigger(title),
    });
  });
}
