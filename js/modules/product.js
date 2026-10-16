// Scheda tessuto: la mazzetta cambia il colore a tutto schermo (e quello della barra), metri × prezzo.
const euro = (n) => n.toLocaleString("it-IT", { style: "currency", currency: "EUR" });

function initProduct() {
  const root = document.querySelector("[data-product]");
  if (!root) return;
  const stage = root.querySelector("[data-stage]");
  const swatches = [...root.querySelectorAll(".pd-swatches button")];

  // la barra d'acquisto è spostata fuori da <main> (layout.js): i suoi campi si cercano nel documento
  swatches.forEach((btn) => btn.addEventListener("click", () => {
    const { color, n, src } = btn.dataset;
    swatches.forEach((s) => s.setAttribute("aria-pressed", s === btn));
    document.querySelectorAll("[data-color-n]").forEach((el) => (el.textContent = n));
    document.querySelectorAll("[data-color-name]").forEach((el) => (el.textContent = color));
    document.querySelector("[data-color-thumb]").src = btn.querySelector("img").src;
    // dissolvenza: la foto nuova entra solo quando è caricata
    stage.style.opacity = 0;
    const img = new Image();
    img.onload = () => { stage.src = src; stage.alt = `Aragon colore ${n} ${color}`; stage.style.opacity = 1; };
    img.src = src;
  }));

  // metri: passo 0,5, minimo 0,5; il totale segue
  const input = document.querySelector("[data-qty-input]");
  const price = parseFloat(document.querySelector("[data-price]").dataset.price);
  const total = document.querySelector("[data-total]");
  const update = () => {
    const m = Math.max(0.5, Math.round((parseFloat(input.value) || 0.5) * 2) / 2);
    input.value = m;
    total.textContent = euro(m * price);
  };
  document.querySelectorAll("[data-qty]").forEach((b) => b.addEventListener("click", () => {
    input.value = (parseFloat(input.value) || 0) + 0.5 * b.dataset.qty;
    update();
  }));
  input.addEventListener("change", update);

  // nel carrello laterale (cart.js) con colore, metri e foto del colore scelto
  document.querySelector("[data-add]").addEventListener("click", () => {
    update();
    const sw = swatches.find((s) => s.getAttribute("aria-pressed") === "true");
    window.addToCart?.({
      name: document.querySelector(".pd-buy__name strong").textContent,
      n: document.querySelector("[data-color-n]").textContent, color: document.querySelector("[data-color-name]").textContent,
      thumb: document.querySelector("[data-color-thumb]").src, img: sw ? sw.dataset.src : stage.getAttribute("src"),
      price, m: parseFloat(input.value),
    });
  });
}
