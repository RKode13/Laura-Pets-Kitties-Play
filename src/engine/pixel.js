// Pixel-art drawing helpers. Everything in the game world is drawn into a
// small low-resolution buffer with whole-pixel rectangles, then scaled up
// without smoothing — that's what gives the crisp retro pixel look.
window.LPK = window.LPK || {};

LPK.px = (() => {
  const OUTLINE = "#2b2529";

  function rect(g, x, y, w, h, c) {
    g.fillStyle = c;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  // Pixel ellipse built from 1-pixel-tall rows (no anti-aliasing).
  function ellipse(g, cx, cy, rx, ry, c) {
    g.fillStyle = c;
    cx = Math.round(cx); cy = Math.round(cy);
    for (let dy = -ry; dy <= ry; dy++) {
      const t = dy / (ry + 0.5);
      const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - t * t)));
      g.fillRect(cx - half, cy + dy, half * 2 + 1, 1);
    }
  }

  // A sprite is a list of shapes: ["r", x, y, w, h, color, noOutline]
  // or ["e", cx, cy, rx, ry, color, noOutline]. Coordinates are relative
  // to the character's feet. flip = mirror horizontally (face left).
  function draw(g, shapes, ox, oy, flip, outline = OUTLINE) {
    ox = Math.round(ox); oy = Math.round(oy);
    const tx = (s) => {
      if (!flip) return s;
      if (s[0] === "r") return ["r", -(s[1] + s[3]), s[2], s[3], s[4], s[5], s[6]];
      return ["e", -s[1], s[2], s[3], s[4], s[5], s[6]];
    };
    const list = shapes.map(tx);
    if (outline) {
      for (const s of list) {
        if (s[6]) continue;
        if (s[0] === "r") {
          rect(g, ox + s[1] - 1, oy + s[2], s[3] + 2, s[4], outline);
          rect(g, ox + s[1], oy + s[2] - 1, s[3], s[4] + 2, outline);
        } else {
          ellipse(g, ox + s[1], oy + s[2], s[3] + 1, s[4] + 1, outline);
        }
      }
    }
    for (const s of list) {
      if (s[0] === "r") rect(g, ox + s[1], oy + s[2], s[3], s[4], s[5]);
      else ellipse(g, ox + s[1], oy + s[2], s[3], s[4], s[5]);
    }
  }

  // Tiny pixel heart (7 x 6).
  function heart(g, x, y, c = "#ff4f86") {
    x = Math.round(x); y = Math.round(y);
    rect(g, x + 1, y, 2, 1, c); rect(g, x + 4, y, 2, 1, c);
    rect(g, x, y + 1, 7, 2, c); rect(g, x + 1, y + 3, 5, 1, c);
    rect(g, x + 2, y + 4, 3, 1, c); rect(g, x + 3, y + 5, 1, 1, c);
  }

  return { rect, ellipse, draw, heart, OUTLINE };
})();
