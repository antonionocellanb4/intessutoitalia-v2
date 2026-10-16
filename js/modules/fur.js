// Hero: tessuto a pelo lungo in WebGL che il mouse spazzola, come un velluto.
// Due passaggi:
//   1. "nap": texture piccola con il verso del pelo per ogni punto. Il mouse lo piega nella direzione
//      in cui si muove; poi torna piano a riposo (come il velluto, il segno resta qualche secondo).
//   2. "fur": il pelo a strati (shell texturing in un solo fragment shader): per ogni pixel si scende
//      dallo strato più alto e il primo ciuffo colpito dà il colore. Le punte si piegano col verso.
// Il titolo è scritto nel pelo: dentro le lettere il verso a riposo è opposto (come un dito passato sul
// velluto), quindi si legge dal riflesso. Il mouse lo spazzola via e le lettere si ripettinano da sole.
// Senza WebGL o con riduzione movimento resta la foto sotto, col titolo normale.
const FUR_VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * .5 + .5; gl_Position = vec4(aPos, 0., 1.); }`;

const NAP_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPrev, uText;
uniform vec2 uMouse, uDir;
uniform float uForce, uRadius, uAspect, uSteps;
const vec2 REST = vec2(.0, -.35); // pelo a riposo: leggermente "pettinato" verso il basso
const vec2 TEXT = vec2(.0, 1.);   // dentro le lettere: pettinato verso l'alto
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + 1.), f.x), f.y);
}
void main() {
  vec2 lean = texture2D(uPrev, vUv).xy * 2. - 1.;
  // bordi delle lettere irregolari, come un segno fatto a mano: la maschera (già sfocata) letta con uno
  // scarto che ondula piano lungo il tratto, poi tagliata a soglia
  vec2 j = vec2(noise(vUv * vec2(28., 16.)), noise(vUv * vec2(28., 16.) + 9.)) - .5;
  float t = smoothstep(.4, .55, texture2D(uText, vUv + j * .005).r);
  vec2 rest = mix(REST, TEXT, t);
  // ritorno a riposo: almeno mezzo gradino a 8 bit, altrimenti l'arrotondamento lo blocca
  vec2 d = rest - lean; float m = length(d);
  // uSteps = passi di ritorno da fare in questo frame (20 al secondo, a qualunque frequenza dello schermo)
  if (m > .0) lean += d / m * min(m, max(m * (1. - pow(.98, uSteps)), .0045 * uSteps));
  vec2 p = vUv - uMouse; p.x *= uAspect;
  float f = exp(-dot(p, p) / (uRadius * uRadius)) * uForce;
  lean = mix(lean, uDir, clamp(f, 0., 1.));
  float l = length(lean); if (l > 1.) lean /= l;
  gl_FragColor = vec4(lean * .5 + .5, 0., 1.);
}`;

const FUR_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uNap;
uniform vec2 uRes;
uniform vec3 uColor;
uniform float uTime, uCell, uLen;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 hash2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
const int N = 26;
void main() {
  vec2 px = gl_FragCoord.xy;
  vec2 lean = texture2D(uNap, vUv).xy * 2. - 1.;
  // respiro: il pelo ondeggia appena anche da fermo
  lean += .07 * vec2(sin(uTime * .7 + vUv.y * 5.), cos(uTime * .5 + vUv.x * 4.));
  vec3 col = uColor * .22;
  for (int i = N - 1; i >= 0; i--) {
    float l = (float(i) + .5) / float(N);
    vec2 p = px - lean * uLen * pow(l, 1.5); // la punta si piega più della radice
    vec2 c = floor(p / uCell), f = fract(p / uCell);
    float h = .5 + .5 * hash(c + 7.);        // ogni ciuffo ha la sua altezza
    if (l > h) continue;
    float r = .5 * (1. - .8 * l / h);        // e si assottiglia verso la punta
    if (length(f - (.3 + .4 * hash2(c))) < r) {
      float t = l / h;
      float ao = .3 + .85 * pow(t, 1.1);                        // radici in ombra
      // il verso cambia il riflesso, come nel velluto; contropelo (lettere, segni verso l'alto) più chiaro
      float d = dot(lean, normalize(vec2(-.45, .9)));
      float sheen = (d > 0. ? .7 : .42) * d * t;
      float tint = .9 + .2 * hash(c + 3.);
      col = uColor * ao * tint + sheen * (.35 + .65 * uColor);
      break;
    }
  }
  // luce morbida dall'alto
  col *= .78 + .32 * smoothstep(-.2, 1.1, vUv.y);
  gl_FragColor = vec4(col, 1.);
}`;

// la foto di riserva resta nascosta (classe fur-wait, messa nel <head>) e torna solo se il pelo non parte
function initFur() {
  if (!setupFur()) document.documentElement.classList.remove("fur-wait");
}

function setupFur() {
  const canvas = document.querySelector("[data-fur]");
  if (!canvas || matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
  if (!gl) return false;
  const hero = canvas.closest("[data-hero]");

  const program = (frag) => {
    const p = gl.createProgram();
    [[gl.VERTEX_SHADER, FUR_VERT], [gl.FRAGMENT_SHADER, frag]].forEach(([type, src]) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      gl.attachShader(p, s);
    });
    gl.bindAttribLocation(p, 0, "aPos");
    gl.linkProgram(p);
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const { name } = gl.getActiveUniform(p, i); u[name] = gl.getUniformLocation(p, name); }
    return { p, u };
  };
  let nap, fur;
  try { nap = program(NAP_FRAG); fur = program(FUR_FRAG); } catch (e) { console.warn(e); return false; }

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // campo del verso del pelo: due texture che si scambiano (ping-pong)
  const NW = 384; // abbastanza fitto per i bordi delle lettere
  let NH = 216;
  const target = () => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, NW, NH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]
      .forEach(([k, v]) => gl.texParameteri(gl.TEXTURE_2D, k, v));
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(.5, .5 - .35 / 2, 0, 1); // = REST
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fb };
  };
  let a, b;

  const touch = matchMedia("(hover: none)").matches;
  let W = 0, H = 0, quality = 1;
  const resize = () => {
    const dpr = Math.min(devicePixelRatio, 1.25) * quality; // il pelo è rumore fine: oltre non si vede e costa
    W = Math.round(hero.clientWidth * dpr); H = Math.round(hero.clientHeight * dpr);
    canvas.width = W; canvas.height = H;
    const nh = Math.max(32, Math.round(NW * H / W));
    if (nh !== NH || !a) { NH = nh; a = target(); b = target(); }
  };
  // maschera del titolo, nello spazio del campo: ogni parola disegnata dove il titolo (trasparente) la mette nella pagina
  const title = hero.querySelector(".hero__title");
  const textTex = gl.createTexture();
  const mask = document.createElement("canvas").getContext("2d");
  const drawText = () => {
    mask.canvas.width = NW; mask.canvas.height = NH;
    mask.fillStyle = "#000"; mask.fillRect(0, 0, NW, NH);
    if (title) {
      const box = hero.getBoundingClientRect(), k = NW / box.width, cs = getComputedStyle(title);
      mask.font = `${cs.fontWeight} ${parseFloat(cs.fontSize) * k}px ${cs.fontFamily}`;
      mask.letterSpacing = `${parseFloat(cs.letterSpacing) * k}px`;
      mask.textBaseline = "alphabetic";
      mask.fillStyle = "#fff";
      mask.filter = `blur(${NW / 480}px)`; // lettere morbide, non da tipografia
      const range = document.createRange();
      const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
      for (let node; (node = walker.nextNode());) {
        for (const m of node.textContent.matchAll(/\S+/g)) {
          range.setStart(node, m.index); range.setEnd(node, m.index + m[0].length);
          const r = range.getBoundingClientRect();
          // linea di base: il fondo del box meno la discesa (stima sulla metrica del font)
          const base = r.bottom - (r.height - parseFloat(cs.fontSize) * .72) / 2;
          mask.fillText(m[0].toUpperCase(), (r.left - box.left) * k, (base - box.top) * NH / box.height);
        }
      }
    }
    gl.bindTexture(gl.TEXTURE_2D, textTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask.canvas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]
      .forEach(([k, v]) => gl.texParameteri(gl.TEXTURE_2D, k, v));
  };
  resize();
  drawText();
  document.fonts.ready.then(drawText); // con il font di riserva le lettere verrebbero in un altro punto
  addEventListener("resize", () => { resize(); drawText(); });

  // colore: media della miniatura vera del tessuto scelto
  const color = [0.1, 0.3, 0.33], goal = [...color];
  const avg = (img) => {
    const c = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    c.canvas.width = c.canvas.height = 8;
    c.drawImage(img, 0, 0, 8, 8);
    const d = c.getImageData(0, 0, 8, 8).data;
    const s = [0, 0, 0];
    for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) s[k] += d[i + k];
    // un filo più saturo e luminoso: la media di una foto di tessuto viene spenta
    return s.map((v) => Math.min(1, (v / (d.length / 4) / 255) ** 0.85 * 1.15));
  };
  const picker = document.querySelector("[data-fur-picker]");
  const name = picker?.querySelector("[data-fur-name]");
  const pick = (btn) => {
    const img = btn.querySelector("img");
    const set = () => avg(img).forEach((v, k) => (goal[k] = v));
    img.complete ? set() : img.addEventListener("load", set, { once: true });
    picker.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === btn));
    if (name) name.textContent = btn.dataset.label;
  };
  picker?.querySelectorAll("button").forEach((btn) => btn.addEventListener("click", () => pick(btn)));
  const first = picker?.querySelector("[aria-pressed=true]");
  if (first) { pick(first); goal.forEach((v, k) => (color[k] = v)); }

  // spazzola: il mouse vero, oppure una mano invisibile che passa da sola quando nessuno tocca
  const brush = { x: .5, y: .5, dx: 0, dy: 0, force: 0 };
  let lastMove = -1e9, last = null;
  const move = (x, y) => {
    if (last) {
      const dx = x - last.x, dy = y - last.y, len = Math.hypot(dx, dy);
      if (len > 1e-4) {
        const s = Math.min(1, len * 40);
        brush.dx = dx / len * s; brush.dy = dy / len * s;
        brush.force = Math.min(1, len * 60);
      }
    }
    brush.x = x; brush.y = y;
    last = { x, y };
  };
  hero.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    move((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    lastMove = performance.now();
  });
  hero.addEventListener("pointerleave", () => (last = null));

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(hero);
  canvas.classList.add("is-on"); // nasconde la foto di riserva
  hero.classList.add("has-fur");

  let prev = 0, slow = 0;
  const t0 = performance.now();
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (!visible) { prev = 0; return; }
    // qualità adattiva: se i frame superano ~22ms per un po', meno pixel (fino a metà)
    const dt = prev ? Math.min(now - prev, 500) / 1000 : 1 / 60;
    if (prev) slow = now - prev > 22 ? slow + 1 : Math.max(0, slow - 1);
    prev = now;
    if (slow > 40 && quality > .5) { quality = Math.max(.5, quality * .8); slow = 0; resize(); }
    const t = (now - t0) / 1000;
    // mano automatica: all'avvio e dopo 3s senza mouse disegna un'onda lenta
    if (now - lastMove > 3000) {
      const k = t * .35;
      move(.5 + .42 * Math.sin(k * 1.3), .5 + .32 * Math.sin(k * 2.1 + 1));
      brush.force *= .55;
    }
    color.forEach((v, k) => (color[k] += (goal[k] - v) * .06));

    gl.useProgram(nap.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, b.fb);
    gl.viewport(0, 0, NW, NH);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, a.tex);
    gl.uniform1i(nap.u.uPrev, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textTex);
    gl.uniform1i(nap.u.uText, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform2f(nap.u.uMouse, brush.x, brush.y);
    gl.uniform2f(nap.u.uDir, brush.dx, brush.dy);
    gl.uniform1f(nap.u.uForce, brush.force);
    gl.uniform1f(nap.u.uRadius, touch ? .14 : .085);
    gl.uniform1f(nap.u.uAspect, W / H);
    gl.uniform1f(nap.u.uSteps, dt * 20); // ritorno lento: il segno resta qualche secondo
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    [a, b] = [b, a];
    brush.force *= .8;

    gl.useProgram(fur.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.bindTexture(gl.TEXTURE_2D, a.tex);
    gl.uniform1i(fur.u.uNap, 0);
    gl.uniform2f(fur.u.uRes, W, H);
    gl.uniform3f(fur.u.uColor, ...color);
    gl.uniform1f(fur.u.uTime, t);
    const scale = W / hero.clientWidth;
    gl.uniform1f(fur.u.uCell, (touch ? 6 : 8) * scale);
    gl.uniform1f(fur.u.uLen, (touch ? 38 : 56) * scale);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  requestAnimationFrame(loop);
  return true;
}
