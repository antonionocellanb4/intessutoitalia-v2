// Gocce d'acqua in WebGL per Aquaclean ("Come si toglie una macchia"): le gocce sono "metaball" (campo morbido che si
// somma), la forma esce da una soglia, la normale dal gradiente del campo; dentro la goccia si vede quello che c'è sotto,
// rovesciato e ingrandito (lente), con un riflesso. Senza WebGL resta la foto sotto.
const DROPS_VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0., 1.); }`;

// GLSL in comune (hero e macchia): foto a copertura e resa di una goccia data la normale del campo
const DROP_GLSL = `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;          // px CSS
uniform float uDpr, uImgAspect;
const float T = .3;         // soglia: il bordo visibile sta a ~0.67 del raggio del campo
vec2 cover(vec2 p) {
  vec2 uv = p / uRes;
  float a = uRes.x / uRes.y;
  if (a > uImgAspect) uv.y = (uv.y - .5) * uImgAspect / a + .5;
  else uv.x = (uv.x - .5) * a / uImgAspect + .5;
  return uv;
}
// normale della goccia: G = gradiente del campo, R = raggio medio locale (curvatura in proporzione alla goccia)
// normale: sopra quasi piatta, sul bordo quasi verticale come una goccia che non bagna (pendenza che cresce dove il
// campo H si avvicina alla soglia)
vec3 dropN(vec2 G, float R, float H) { return normalize(vec3(-G * R * .42 / (sqrt(max(H - T, 0.)) + .22), 1.)); }
// c = quello che si vede attraverso la goccia (campionato spostato di -n.xy: vista rovesciata e ingrandita).
// Come una goccia vera su tessuto idrorepellente con luce da in alto a sinistra: bordo scuro sottile (più marcato dalla
// parte della luce), mezzaluna chiara dentro dalla parte opposta dove la luce si raccoglie, riflesso netto + alone morbido.
const vec3 L = vec3(-.4, -.58, .71);
vec3 shadeDrop(vec3 c, vec3 n) {
  float edge = 1. - n.z;
  vec2 dir = normalize(n.xy + 1e-5);
  float away = dot(dir, -normalize(L.xy));                               // 1 = lato opposto alla luce
  c *= 1.05;
  c = mix(c, c * .7, smoothstep(.15, .7, edge) * (.6 + .4 * max(-away, 0.)));  // bordo appena più scuro (l'acqua è trasparente)
  c += vec3(1., .99, .97) * .8 * smoothstep(.2, 1., away) * smoothstep(.1, .5, edge) * (1. - smoothstep(.6, .9, edge)); // luce raccolta
  float sp = max(dot(reflect(-L, n), vec3(0., 0., 1.)), 0.);
  c += pow(sp, 140.) * 1.6 + pow(sp, 14.) * .12;                         // riflesso netto + alone
  float sp2 = max(dot(reflect(-vec3(-L.xy, L.z), n), vec3(0., 0., 1.)), 0.);
  c += pow(sp2, 300.) * .45;                                              // secondo riflesso, piccolo, dalla parte opposta
  return c;
}`;

function glSetup(canvas, frag) {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
  if (!gl) return null;
  const p = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, DROPS_VERT], [gl.FRAGMENT_SHADER, frag]]) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(sh)); return null; }
    gl.attachShader(p, sh);
  }
  gl.bindAttribLocation(p, 0, "aPos");
  gl.linkProgram(p);
  gl.useProgram(p);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  return { gl, u: (name) => gl.getUniformLocation(p, name) };
}

function glTexture(gl, u, img) {
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(u("uTex"), 0);
  gl.uniform1f(u("uImgAspect"), img.naturalWidth / img.naturalHeight);
}

// Aquaclean, "Come si toglie una macchia": sezione ferma a tutto schermo su un tessuto chiaro con una macchia di vino.
// Lo scroll (uP da 0 a 1) racconta i tre passaggi: cadono gocce d'acqua sulla macchia (che restano in superficie),
// il vino sale nelle gocce e il tessuto si pulisce, le gocce si tamponano e l'alone bagnato si asciuga.
const WASH_FRAG = DROP_GLSL + `
uniform vec2 uC;            // centro della macchia (px CSS)
uniform float uR, uP;       // raggio della macchia, avanzamento
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + 1.), f.x), f.y);
}
float fbm(vec2 p) { float v = 0., a = .5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= .5; } return v; }
// schizzo allungato verso l'esterno (il vino cade e scivola via dal centro), bordo ruvido come le fibre
float splash(vec2 q, vec2 c, float r, float stretch, float aa) {
  vec2 d = normalize(c), v = q - c;
  vec2 l = vec2(dot(v, d) / stretch, dot(v, vec2(-d.y, d.x)));
  return 1. - smoothstep(r - aa, r + aa, length(l) + (noise(q * 70.) - .5) * r * .3);
}
// gocce sulla macchia: x, y, raggio (in raggi della macchia), momento in cui cadono
vec4 drop(int i) {
  if (i == 0) return vec4(-.26, -.22, .36, .02);
  if (i == 1) return vec4(.34, .02, .32, .07);
  if (i == 2) return vec4(-.1, .42, .3, .12);
  if (i == 3) return vec4(.2, -.5, .24, .16);
  if (i == 4) return vec4(-.6, .18, .22, .2);
  if (i == 5) return vec4(.58, -.38, .2, .24);
  return vec4(.42, .5, .2, .28);
}
const vec3 WINE = vec3(.6, .14, .22);
// tessuto con la macchia di vino: forma irregolare con il bordo che sfuma nelle fibre, anello scuro dove il vino si è
// asciugato e qualche alone interno, colore più rosato al centro e più cupo al bordo, trama visibile attraverso
// (il vino si raccoglie di più tra i fili), schizzi allungati. Più l'alone bagnato quando arriva l'acqua.
vec3 surface(vec2 p) {
  vec2 q = (p - uC) / uR;
  vec3 bg = texture2D(uTex, cover(p)).rgb;
  float aa = 1.2 / uR;
  float n1 = fbm(q * 1.6 + 2.3), n2 = fbm(q * 5.5 + 7.1), n3 = noise(q * 85.);
  float dist = length(q * vec2(1., 1.1)) + (n1 - .5) * .7 + (n2 - .5) * .07;
  float edge = 1. - smoothstep(.795, .825, dist + (n3 - .5) * .022);     // bordo che risale lungo i fili
  float rim = exp(-pow((dist - .8) / .022, 2.)) * edge;                 // anello di asciugatura
  float tide = exp(-pow((dist - .52) / .02, 2.)) + .6 * exp(-pow((dist - .3) / .025, 2.)); // aloni interni
  float body = edge * (.42 + .3 * smoothstep(.35, .8, dist)) * (.8 + .4 * n2) + .35 * rim + .1 * tide * edge;
  float sp = max(max(splash(q, vec2(1.12, -.55), .065, 1.35, aa), splash(q, vec2(-1.05, .7), .045, 1.5, aa)),
                 max(splash(q, vec2(1.2, .62), .03, 1.2, aa), splash(q, vec2(.78, -1.02), .04, 1.4, aa)));
  sp = max(sp, splash(q, vec2(-.3, -1.08), .025, 1.3, aa));
  float lum = dot(bg, vec3(.3, .59, .11));
  float dens = clamp(max(body, sp * .8) * (.8 + .45 * (1. - lum)), 0., .97);
  vec3 tint = mix(vec3(.8, .45, .57), WINE, smoothstep(.15, .7, dist));  // rosato al centro
  tint = mix(tint, vec3(.42, .08, .16), rim);                           // cupo sull'anello
  float lift = smoothstep(.36, .62, uP);                                // il vino sale nelle gocce
  float wet = smoothstep(.04, .3, uP) * (1. - smoothstep(.74, .98, uP)); // alone bagnato
  float wetMask = 1. - smoothstep(.9, 1.4, length(q) + (n1 - .5) * .5);
  return bg * (1. - .16 * wet * wetMask) * mix(vec3(1.), tint, dens * (1. - lift));
}
void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
  vec3 col = surface(p);
  // gocce: cadono una dopo l'altra (si allargano e si assestano), poi si tamponano una alla volta. Forma appena
  // irregolare (raggio che ondula con l'angolo), niente ombra scura (l'acqua è trasparente), solo la luce concentrata dalla goccia sul tessuto in basso a destra.
  float H = 0., C = 0., R = 0.; vec2 G = vec2(0.);
  const vec2 SH = vec2(6., 9.);
  for (int i = 0; i < 7; i++) {
    vec4 d = drop(i);
    float g = smoothstep(d.w, d.w + .06, uP);
    float off = 1. - smoothstep(.62 + d.w * .5, .7 + d.w * .5, uP);
    float r = d.z * uR * g * (1. + .25 * sin(g * 3.1416)) * off;
    if (r <= 0.) continue;
    vec2 v = p - uC - d.xy * uR;
    float a = atan(v.y, v.x), fi = float(i);
    float wob = 1. + .04 * sin(2. * a + fi * 1.7) + .018 * sin(3. * a + fi * 2.9);
    float r2 = r * r, k = 1. / (r2 * r2);
    float qq = r2 - dot(v, v) * wob * wob;
    if (qq > 0.) { float h = qq * qq * k; H += h; R += h * r; G -= 4. * qq * k * v * wob * wob; }
    vec2 vc = v - SH * 1.5 - r * vec2(.12, .18); float rc2 = r2 * .12; float qc = rc2 - dot(vc, vc);
    if (qc > 0.) C += qc * qc / (rc2 * rc2);
  }
  R /= max(H, 1e-4);
  float w = length(G) / uDpr + 1e-4;
  float m = smoothstep(T - w, T + w, H);
  col += vec3(1., .97, .92) * .28 * smoothstep(.0, .8, C) * (1. - m);     // luce concentrata nell'ombra
  col *= 1. - .06 * smoothstep(T * .45, T, H) * (1. - m);                 // linea di contatto appena accennata
  if (m > 0.) {
    vec3 n = dropN(G, R, H);
    // l'acqua raccoglie il vino: le gocce si colorano mentre la macchia sotto sparisce
    vec3 c = surface(p - n.xy * R * .28) * mix(vec3(1.), vec3(.66, .2, .28), smoothstep(.36, .62, uP) * .8);
    col = mix(col, shadeDrop(c, n), m);
  }
  gl_FragColor = vec4(col, 1.);
}`;

function initWash() {
  const root = document.querySelector("[data-wash]");
  if (!root) return;
  const steps = [...root.querySelectorAll(".wash__step")];
  const bar = root.querySelector(".wash__bar span");
  const canvas = root.querySelector("[data-wash-canvas]");
  const img = root.querySelector(".wash__media img");
  img.loading = "eager";
  root.classList.add("is-live");
  let P = 0, render = () => {};
  const update = () => {
    const k = P < 0.36 ? 0 : P < 0.66 ? 1 : 2;
    steps.forEach((s, i) => s.classList.toggle("is-active", i === k));
    bar.style.transform = `scaleX(${P})`;
    render();
  };
  ScrollTrigger.create({
    trigger: root, start: "top top", end: () => `+=${innerHeight * 2.5}`, pin: true,
    onUpdate: (st) => { P = st.progress; update(); },
  });

  const g = glSetup(canvas, WASH_FRAG);
  if (!g) return;
  const { gl, u } = g;
  const resize = () => {
    const W = root.clientWidth, H = root.clientHeight, dpr = Math.min(devicePixelRatio || 1, 1.5), m = W < 900;
    canvas.width = W * dpr; canvas.height = H * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u("uRes"), W, H);
    gl.uniform1f(u("uDpr"), dpr);
    // desktop: sulla parte piatta e illuminata sotto la piega della foto
    gl.uniform2f(u("uC"), m ? W * 0.5 : W * 0.68, m ? H * 0.38 : H * 0.64);
    gl.uniform1f(u("uR"), m ? W * 0.3 : Math.min(W * 0.16, H * 0.25));
    render();
  };
  const start = () => {
    glTexture(gl, u, img);
    render = () => { gl.uniform1f(u("uP"), P); gl.drawArrays(gl.TRIANGLES, 0, 3); };
    addEventListener("resize", resize);
    resize();
    canvas.classList.add("is-on");
  };
  img.complete && img.naturalWidth ? start() : img.addEventListener("load", start, { once: true });
}
