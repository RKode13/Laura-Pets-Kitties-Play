// Evan's drawings, in crayon: wobbly lines, scribbled-in colors, big
// letters and a signature. Each drawing has a subject ("what") and a seed,
// so the same drawing always looks the same when you look at it again.
window.LPK = window.LPK || {};

LPK.kidArt = (() => {
  const FONT = '"Comic Sans MS", "Chalkboard SE", "Marker Felt", "Segoe Print", cursive';
  let g, X, Y, W, H, rnd;

  function rng(seed) {                               // small seeded random (mulberry32)
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const px = (x) => X + x * W, py = (y) => Y + y * H, U = () => Math.min(W, H);
  const j = (a) => (rnd() - 0.5) * a * U();          // wobble

  // a crayon stroke through points (paper units 0..1), drawn twice for texture
  function line(pts, color, width = 0.012) {
    g.strokeStyle = color; g.lineCap = "round"; g.lineJoin = "round";
    for (let pass = 0; pass < 2; pass++) {
      g.globalAlpha = pass ? 0.55 : 0.9; g.lineWidth = U() * width * (pass ? 0.6 : 1);
      g.beginPath();
      pts.forEach(([x, y], i) => { const fx = px(x) + j(0.006), fy = py(y) + j(0.006); i ? g.lineTo(fx, fy) : g.moveTo(fx, fy); });
      g.stroke();
    }
    g.globalAlpha = 1;
  }
  function ellipsePts(cx, cy, rx, ry, n = 22, wob = 0.08) {
    const pts = [];
    for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2 + 0.2, k = 1 + (rnd() - 0.5) * wob; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    return pts;
  }
  // scribble a color inside a shape (zig-zag strokes, like a kid coloring in)
  function scribble(pathPts, color, density = 0.018) {
    g.save(); g.beginPath();
    pathPts.forEach(([x, y], i) => i ? g.lineTo(px(x), py(y)) : g.moveTo(px(x), py(y)));
    g.closePath(); g.clip();
    const xs = pathPts.map(p => p[0]), ys = pathPts.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const zz = [];
    for (let y = y0 - 0.02, k = 0; y <= y1 + 0.04; y += density, k++) zz.push([k % 2 ? x1 + 0.02 : x0 - 0.02, y + (rnd() - 0.5) * 0.01]);
    line(zz, color, density * 1.25);
    g.restore();
  }
  function blob(cx, cy, rx, ry, fill, outline = "#3a3a44", w = 0.011) {
    const pts = ellipsePts(cx, cy, rx, ry);
    if (fill) scribble(pts, fill);
    if (outline) line(pts, outline, w);
  }
  function word(str, x, y, size, color, rot = 0) {
    g.save(); g.translate(px(x), py(y)); g.rotate(rot + (rnd() - 0.5) * 0.08);
    g.font = `bold ${Math.round(U() * size)}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = color; g.globalAlpha = 0.9;
    let cx = -g.measureText(str).width / 2;
    for (const ch of str) {                          // each letter a little crooked
      g.save(); g.translate(cx + g.measureText(ch).width / 2, (rnd() - 0.5) * U() * size * 0.18); g.rotate((rnd() - 0.5) * 0.25);
      g.fillText(ch, 0, 0); g.restore(); cx += g.measureText(ch).width + U() * 0.004;
    }
    g.restore(); g.globalAlpha = 1;
  }
  function sun(x, y, r) {
    blob(x, y, r, r, "#f6c936", "#e8a020");
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; line([[x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3 * W / H], [x + Math.cos(a) * r * 1.9, y + Math.sin(a) * r * 1.9 * W / H]], "#e8a020", 0.01); }
  }
  function cloud(x, y, s) { blob(x, y, s, s * 0.45, "#ffffff", "#8ab4e8", 0.008); blob(x + s * 0.7, y + 0.01, s * 0.7, s * 0.35, "#ffffff", "#8ab4e8", 0.008); }
  function grass() {
    scribble([[0, 0.86], [1, 0.86], [1, 1], [0, 1]], "#5cc04a", 0.02);
    for (let i = 0; i < 18; i++) { const x = 0.03 + i * 0.055; line([[x, 0.87], [x + 0.01, 0.83]], "#3a9a2a", 0.008); }
  }
  // a crayon kitty. look = the cat's real colors
  function kitty(cx, cy, s, look, extra = {}) {
    const dark = "#2e2a30", body = look.body, cap = look.cap;
    // tail
    line([[cx - 0.2 * s, cy + 0.12 * s], [cx - 0.32 * s, cy + 0.02 * s], [cx - 0.3 * s, cy - 0.12 * s]], look.tail || cap, 0.028 * s * 3);
    // body + legs
    blob(cx - 0.02 * s, cy + 0.14 * s, 0.22 * s, 0.13 * s * W / H, body, dark);
    if (extra.patch) blob(cx - 0.08 * s, cy + 0.11 * s, 0.07 * s, 0.05 * s * W / H, extra.patch, null);
    if (extra.chest) blob(cx + 0.06 * s, cy + 0.15 * s, 0.07 * s, 0.07 * s * W / H, extra.chest, null);
    for (const lx of [-0.14, -0.06, 0.05, 0.13]) line([[cx + lx * s, cy + 0.24 * s], [cx + lx * s, cy + 0.33 * s]], extra.paws || body === "#ffffff" ? dark : body, 0.02 * s * 2);
    // head
    const hx = cx + 0.12 * s, hy = cy - 0.08 * s, hr = 0.15 * s;
    line([[hx - hr * 0.9, hy - hr * 0.3], [hx - hr * 0.7, hy - hr * 1.35], [hx - hr * 0.15, hy - hr * 0.75]], dark, 0.012);   // ears
    line([[hx + hr * 0.15, hy - hr * 0.75], [hx + hr * 0.7, hy - hr * 1.35], [hx + hr * 0.9, hy - hr * 0.3]], dark, 0.012);
    scribble([[hx - hr * 0.85, hy - hr * 0.35], [hx - hr * 0.7, hy - hr * 1.3], [hx - hr * 0.2, hy - hr * 0.75]], cap, 0.012);
    scribble([[hx + hr * 0.2, hy - hr * 0.75], [hx + hr * 0.7, hy - hr * 1.3], [hx + hr * 0.85, hy - hr * 0.35]], cap, 0.012);
    const headPts = ellipsePts(hx, hy, hr, hr * W / H);
    scribble(headPts, body);
    g.save(); g.beginPath(); headPts.forEach(([x, y], i) => i ? g.lineTo(px(x), py(y)) : g.moveTo(px(x), py(y))); g.closePath(); g.clip();
    scribble([[hx - hr * 1.2, hy - hr * 1.3], [hx + hr * 1.2, hy - hr * 1.3], [hx + hr * 1.2, hy - hr * 0.15], [hx - hr * 1.2, hy - hr * 0.15]], cap);   // dark "cap" on top of the head
    g.restore();
    if (extra.blaze) scribble([[hx - 0.02 * s, hy - hr * 1.1], [hx + 0.02 * s, hy - hr * 1.1], [hx + 0.025 * s, hy], [hx - 0.025 * s, hy]], body, 0.008);
    if (extra.muzzle) blob(hx, hy + hr * 0.45, hr * 0.5, hr * 0.32 * W / H, extra.muzzle, null);
    line(headPts, dark, 0.011);
    // face
    const eye = extra.eyes || "#b9c44c";
    if (extra.sleepy) { line([[hx - hr * 0.55, hy], [hx - hr * 0.2, hy + 0.005]], dark, 0.01); line([[hx + hr * 0.2, hy + 0.005], [hx + hr * 0.55, hy]], dark, 0.01); }
    else for (const ex of [-0.38, 0.38]) { blob(hx + hr * ex, hy, hr * 0.17, hr * 0.17 * W / H, eye, dark, 0.006); blob(hx + hr * ex, hy, hr * 0.06, hr * 0.06 * W / H, dark, null); }
    blob(hx, hy + hr * 0.3, hr * 0.08, hr * 0.06 * W / H, "#f08a9a", null);
    line([[hx - hr * 0.25, hy + hr * 0.55], [hx, hy + hr * 0.45], [hx + hr * 0.25, hy + hr * 0.55]], dark, 0.008);
    for (const d of [-1, 1]) { line([[hx + d * hr * 0.4, hy + hr * 0.4], [hx + d * hr * 1.3, hy + hr * 0.25]], dark, 0.005); line([[hx + d * hr * 0.4, hy + hr * 0.5], [hx + d * hr * 1.3, hy + hr * 0.6]], dark, 0.005); }
    if (extra.crown) { const cy2 = hy - hr * 1.45; scribble([[hx - hr * 0.6, cy2 + 0.03], [hx - hr * 0.6, cy2 - 0.03], [hx - hr * 0.3, cy2], [hx, cy2 - 0.045], [hx + hr * 0.3, cy2], [hx + hr * 0.6, cy2 - 0.03], [hx + hr * 0.6, cy2 + 0.03]], "#f6c936", 0.01); }
  }
  function person(cx, s, o) {
    const dark = "#2e2a30", top = 0.3, headR = 0.075 * s;
    if (o.longHair) scribble(ellipsePts(cx, top + 0.1 * s, headR * 1.35, headR * 2.1 * W / H), o.hair);
    blob(cx, top, headR, headR * W / H, "#f6d0b0", dark);
    if (!o.longHair) scribble(ellipsePts(cx, top - headR * 0.75, headR * 1.05, headR * 0.5 * W / H), o.hair);
    else scribble(ellipsePts(cx, top - headR * 0.6, headR * 1.15, headR * 0.6 * W / H), o.hair);
    if (o.shades) line([[cx - headR * 0.7, top - 0.01], [cx + headR * 0.7, top - 0.01]], "#111", 0.03);
    else { blob(cx - headR * 0.35, top - 0.01, 0.006, 0.008, dark, null); blob(cx + headR * 0.35, top - 0.01, 0.006, 0.008, dark, null); }
    line([[cx - headR * 0.4, top + headR * 0.35 * W / H], [cx, top + headR * 0.55 * W / H], [cx + headR * 0.4, top + headR * 0.35 * W / H]], "#d84a4a", 0.009);
    if (o.beard) scribble(ellipsePts(cx, top + headR * 0.6 * W / H, headR * 0.7, headR * 0.35 * W / H), o.beard, 0.01);
    // body: dress (triangle) or suit (rectangle)
    const b0 = top + headR * W / H, b1 = 0.74;
    const shape = o.dress ? [[cx, b0], [cx + 0.13 * s, b1], [cx - 0.13 * s, b1]] : [[cx - 0.08 * s, b0], [cx + 0.08 * s, b0], [cx + 0.08 * s, b1], [cx - 0.08 * s, b1]];
    scribble(shape, o.color); line([...shape, shape[0]], dark, 0.01);
    if (o.tie) { scribble([[cx - 0.012, b0], [cx + 0.012, b0], [cx + 0.02, b0 + 0.18], [cx, b0 + 0.21], [cx - 0.02, b0 + 0.18]], o.tie, 0.008); }
    line([[cx - 0.07 * s, b0 + 0.06], [cx - 0.2 * s, b0 + 0.18]], dark, 0.012); line([[cx + 0.07 * s, b0 + 0.06], [cx + 0.2 * s, b0 + 0.18]], dark, 0.012);   // arms
    line([[cx - 0.04 * s, b1], [cx - 0.05 * s, 0.86]], dark, 0.012); line([[cx + 0.04 * s, b1], [cx + 0.05 * s, 0.86]], dark, 0.012);       // legs
  }
  function heart(x, y, s, color) {
    const pts = [];
    for (let i = 0; i <= 24; i++) { const t = i / 24 * Math.PI * 2; pts.push([x + s * 16 * Math.pow(Math.sin(t), 3) / 16, y - s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16 * W / H]); }
    scribble(pts, color, 0.012); line(pts, "#c83a5a", 0.008);
  }

  const C = () => LPK.characters;
  const subjects = {
    "Marshmallow": () => { grass(); kitty(0.44, 0.55, 1.2, C().marshmallow.look, { blaze: true, sleepy: true, patch: "#8a8480" }); word("Z", 0.8, 0.34, 0.08, "#6a7ae8"); word("z", 0.87, 0.25, 0.06, "#6a7ae8"); word("MARSHMALLOW", 0.5, 0.1, 0.085, "#c86ad8"); },
    "CC": () => { grass(); kitty(0.44, 0.56, 1.2, Object.assign({}, C().cc.look, { body: "#2a262c" }), { muzzle: "#ffffff", chest: "#ffffff", crown: true, eyes: "#9ad04a" }); word("CC THE BOSS", 0.5, 0.1, 0.085, "#2a6ae8"); },
    "Orangey": () => { grass(); kitty(0.42, 0.55, 1.2, Object.assign({}, C().popsicle.look, { body: "#ffffff" }), { patch: "#e8893a", eyes: "#e8b04a" }); blob(0.8, 0.8, 0.08, 0.04, "#e84a5a"); word("ORANGEY", 0.5, 0.1, 0.09, "#e8893a"); word("FOOD!!", 0.8, 0.68, 0.05, "#d84a4a"); },
    "all three kitties": () => { grass(); kitty(0.19, 0.6, 0.72, C().marshmallow.look, { blaze: true, sleepy: true }); kitty(0.5, 0.6, 0.72, Object.assign({}, C().cc.look, { body: "#2a262c" }), { muzzle: "#ffffff", chest: "#ffffff" }); kitty(0.8, 0.6, 0.72, Object.assign({}, C().popsicle.look, { body: "#ffffff" }), { patch: "#e8893a" }); word("MY KITTIES", 0.5, 0.12, 0.09, "#e84a8a"); },
    "an airplane": () => {
      scribble([[0, 0], [1, 0], [1, 0.86], [0, 0.86]], "#bfe0ff", 0.03); sun(0.86, 0.16, 0.06); cloud(0.12, 0.2, 0.08); cloud(0.6, 0.72, 0.07);
      const body = ellipsePts(0.48, 0.45, 0.3, 0.085); scribble(body, "#f4f4f8"); line(body, "#3a3a44");
      const wing = [[0.42, 0.45], [0.52, 0.45], [0.4, 0.72], [0.33, 0.72]]; scribble(wing, "#4a8ae8"); line([...wing, wing[0]], "#3a3a44");
      const wing2 = [[0.42, 0.42], [0.5, 0.42], [0.42, 0.24], [0.36, 0.24]]; scribble(wing2, "#4a8ae8"); line([...wing2, wing2[0]], "#3a3a44");
      const tail = [[0.2, 0.42], [0.26, 0.42], [0.2, 0.26], [0.15, 0.26]]; scribble(tail, "#e84a5a"); line([...tail, tail[0]], "#3a3a44");
      for (let i = 0; i < 5; i++) blob(0.38 + i * 0.065, 0.43, 0.018, 0.025, "#7fd0ff", "#3a3a44", 0.006);
      line([[0.1, 0.5], [0.16, 0.48]], "#9a9aa8", 0.01); line([[0.08, 0.56], [0.15, 0.53]], "#9a9aa8", 0.01);
      word("VROOOOM!", 0.5, 0.88, 0.075, "#e84a5a");
    },
    "you, Mommy": () => {
      grass(); sun(0.88, 0.14, 0.06);
      person(0.42, 1.2, { longHair: true, hair: "#b8894f", dress: true, color: (C().laura.look && C().laura.look.top) || "#7d2e3a" });
      heart(0.75, 0.48, 0.09, "#ff7aa8"); heart(0.15, 0.3, 0.05, "#ff7aa8");
      word("MOMMY", 0.42, 0.1, 0.1, "#e84a8a"); word("I LOVE YOU", 0.72, 0.68, 0.055, "#c83a5a");
    },
    "Robert": () => {
      grass();
      person(0.45, 1.2, { hair: "#a8a39d", beard: "#c9c4be", shades: true, color: "#2c2836", tie: "#e8893a" });
      word("ROBERT", 0.45, 0.1, 0.1, "#2a6ae8"); word("SO COOL", 0.78, 0.45, 0.06, "#e8893a");
    },
    "a rainbow": () => {
      const cols = ["#e84a5a", "#f2934a", "#f6c936", "#5cc04a", "#4a8ae8", "#9a5ad8"];
      cols.forEach((c, i) => { const r = 0.4 - i * 0.045, pts = []; for (let k = 0; k <= 20; k++) { const a = Math.PI + k / 20 * Math.PI; pts.push([0.5 + Math.cos(a) * r, 0.78 + Math.sin(a) * r * 1.5]); } line(pts, c, 0.04); });
      cloud(0.08, 0.76, 0.1); cloud(0.82, 0.76, 0.1); sun(0.88, 0.14, 0.06);
      word("RAINBOW", 0.5, 0.9, 0.08, "#9a5ad8");
    },
    "a squishy": () => {
      const pts = ellipsePts(0.5, 0.55, 0.28, 0.3, 26, 0.12); scribble(pts, "#ffb0d8"); line(pts, "#c8588a", 0.014);
      blob(0.41, 0.5, 0.03, 0.04, "#2e2a30", null); blob(0.59, 0.5, 0.03, 0.04, "#2e2a30", null);
      blob(0.36, 0.6, 0.04, 0.03, "#ff7aa8", null); blob(0.64, 0.6, 0.04, 0.03, "#ff7aa8", null);
      line([[0.45, 0.62], [0.5, 0.66], [0.55, 0.62]], "#2e2a30", 0.01);
      word("SQUISHY", 0.5, 0.12, 0.09, "#e84a8a"); word("squish squish", 0.5, 0.92, 0.05, "#c8588a");
    },
    "our house": () => {
      grass(); sun(0.12, 0.14, 0.06); cloud(0.72, 0.14, 0.07);
      const box = [[0.3, 0.48], [0.72, 0.48], [0.72, 0.86], [0.3, 0.86]]; scribble(box, "#f2d0a0"); line([...box, box[0]], "#3a3a44");
      const roof = [[0.25, 0.49], [0.51, 0.26], [0.77, 0.49]]; scribble(roof, "#d84a4a"); line([...roof, roof[0]], "#3a3a44");
      const door = [[0.47, 0.66], [0.56, 0.66], [0.56, 0.86], [0.47, 0.86]]; scribble(door, "#8a5a3a"); line([...door, door[0]], "#3a3a44");
      for (const wx of [0.35, 0.62]) { const win = [[wx, 0.56], [wx + 0.07, 0.56], [wx + 0.07, 0.65], [wx, 0.65]]; scribble(win, "#bfe0ff"); line([...win, win[0]], "#3a3a44"); }
      kitty(0.38, 0.62, 0.22, C().marshmallow.look, { sleepy: true });
      word("OUR HOUSE", 0.5, 0.1, 0.085, "#4a8ae8");
    },
  };

  // draw a drawing onto a 2D context at (x, y, w, h)
  function draw(ctx, x, y, w, h, d, index = 0) {
    g = ctx; X = x; Y = y; W = w; H = h;
    rnd = rng(d.seed || (index * 7919 + d.what.length * 104729 + 17));
    g.save();
    g.fillStyle = "#fffdf6"; g.fillRect(x, y, w, h);
    for (let i = 1; i < 9; i++) { g.fillStyle = "rgba(120,160,220,0.12)"; g.fillRect(x, y + h * i / 9, w, 1); }   // faint lines on the paper
    (subjects[d.what] || subjects["a rainbow"])();
    word("EVAN", 0.88, 0.94, 0.06, "#2a6ae8", -0.1);
    g.restore();
  }
  return { draw, subjects: Object.keys(subjects) };
})();
