// Carrello laterale: ogni tessuto si srotola su un metro da sarta, lungo quanti metri hai scelto (stessa scala per tutte
// le righe, così si confrontano a colpo d'occhio). Aggiungendo dalla scheda il pannello si apre e il tessuto nuovo si srotola.
// ponytail: carrello solo nel browser (localStorage) per il prototipo; su WooCommerce righe e totali arrivano dal carrello vero.
const CART_KEY = "it-cart";
let cartItems = [];
try { cartItems = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { cartItems = []; }
const saveCart = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cartItems)); } catch {} };
const eur = (n) => n.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
const metri = (m) => m.toLocaleString("it-IT") + " m";

function initCart() {
  document.body.insertAdjacentHTML("beforeend", `
<div class="cart-scrim" data-cart-close></div>
<aside class="cart" id="cart" aria-label="Carrello" aria-hidden="true">
  <div class="cart__head"><p class="cart__title">Carrello <span class="mute" data-cart-count></span></p><button type="button" class="cart__close" data-cart-close>Chiudi</button></div>
  <ul class="cart__list" data-cart-list></ul>
  <div class="cart__empty" data-cart-empty>
    <div class="cart__tape cart__tape--empty" style="--scale:5"><span class="cart__ruler"></span></div>
    <p>Il carrello è vuoto.<br>Scegli un tessuto e decidi quanti metri ti servono.</p>
    <a href="tessuti.html" class="btn btn--solid">Scopri i tessuti</a>
  </div>
  <div class="cart__foot" data-cart-foot>
    <p class="cart__sum"><span>Subtotale</span><strong data-cart-sum></strong></p>
    <p class="mute">Spedizione calcolata alla cassa. Tagliamo il tessuto in un unico pezzo per ogni colore.</p>
    <a class="btn btn--solid cart__go" aria-disabled="true">Vai alla cassa</a>
  </div>
</aside>`);
  const root = document.documentElement, panel = document.getElementById("cart");
  const list = panel.querySelector("[data-cart-list]");

  const open = (on) => {
    root.classList.toggle("cart-open", on);
    panel.setAttribute("aria-hidden", !on);
    if (window.lenis) on ? lenis.stop() : lenis.start();
    if (on) panel.querySelector(".cart__close").focus({ preventScroll: true });
  };
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-cart-open]")) open(true);
    else if (e.target.closest("[data-cart-close]")) open(false);
  });
  document.addEventListener("keydown", (e) => e.key === "Escape" && root.classList.contains("cart-open") && open(false));

  // scala del metro: almeno 5 m, poi il metro intero successivo alla riga più lunga
  const scale = () => Math.max(5, Math.ceil(Math.max(0, ...cartItems.map((it) => it.m))));
  const ticks = (s) => Array.from({ length: s + 1 }, (_, i) => `<i style="left:${(i / s) * 100}%">${i}</i>`).join("");

  // render: le righe esistenti si aggiornano (così la striscia scorre con la transizione), quelle nuove partono arrotolate
  const render = (fresh) => {
    const s = scale(), n = cartItems.length;
    panel.style.setProperty("--scale", s);
    panel.querySelector("[data-cart-count]").textContent = n ? `(${n})` : "";
    document.querySelectorAll("[data-cart-n]").forEach((el) => (el.textContent = n));
    panel.querySelector("[data-cart-empty]").hidden = n > 0;
    panel.querySelector("[data-cart-foot]").hidden = !n;
    panel.querySelector("[data-cart-sum]").textContent = eur(cartItems.reduce((a, it) => a + it.m * it.price, 0));
    panel.querySelector(".cart__tape--empty .cart__ruler").innerHTML = ticks(5);
    [...list.children].forEach((li) => !cartItems.some((it) => it.id === li.dataset.id) && li.remove());
    cartItems.forEach((it) => {
      let li = list.querySelector(`[data-id="${it.id}"]`);
      if (!li) {
        li = document.createElement("li");
        li.className = "cart__item"; li.dataset.id = it.id;
        li.innerHTML = `
          <img class="cart__thumb" src="${it.thumb}" alt="">
          <div class="cart__info"><p class="cart__name">${it.name}</p><p class="mute">${it.n} ${it.color} · ${eur(it.price)}/m</p></div>
          <p class="cart__line" data-line></p>
          <div class="cart__tape"><span class="cart__cloth" style="background-image:url(${it.img})" data-cloth></span><span class="cart__ruler" data-ruler></span></div>
          <div class="cart__ctrl">
            <span class="cart__qty"><button type="button" aria-label="Meno" data-step="-1">−</button><output data-m></output><button type="button" aria-label="Più" data-step="1">+</button></span>
            <button type="button" class="cart__remove" data-remove>Rimuovi</button>
          </div>`;
        li.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => {
          it.m = Math.max(0.5, it.m + 0.5 * b.dataset.step); saveCart(); render();
        }));
        li.querySelector("[data-remove]").addEventListener("click", () => {
          li.querySelector("[data-cloth]").style.width = 0; // si riavvolge, poi la riga sparisce
          li.classList.add("is-leaving");
          setTimeout(() => { cartItems = cartItems.filter((x) => x !== it); saveCart(); render(); }, 450);
        });
        list.append(li);
        if (fresh === it.id) li.querySelector("[data-cloth]").style.width = 0;
      }
      li.querySelector("[data-line]").textContent = eur(it.m * it.price);
      li.querySelector("[data-m]").textContent = metri(it.m);
      li.querySelector("[data-ruler]").innerHTML = ticks(s);
      const w = `${(it.m / s) * 100}%`, cloth = li.querySelector("[data-cloth]");
      if (fresh === it.id) requestAnimationFrame(() => requestAnimationFrame(() => (cloth.style.width = w)));
      else cloth.style.width = w;
    });
  };

  // usato dalla scheda prodotto (product.js); stesso tessuto e colore = si sommano i metri
  window.addToCart = (item) => {
    item.id = `${item.name}-${item.n}`;
    const same = cartItems.find((it) => it.id === item.id);
    if (same) same.m += item.m; else cartItems.push(item);
    saveCart();
    open(true);
    setTimeout(() => render(same ? null : item.id), 250); // il pannello entra, poi il tessuto si srotola
  };
  render();
}
