// Draws the rooms in a slightly angled top-down pixel-art style.
// Furniture "kinds" match the names used in data/rooms.js.
window.LPK = window.LPK || {};

LPK.roomRenderer = (() => {
  const { rect: R, ellipse: E } = LPK.px;

  // deterministic pseudo-random so the floor grain doesn't flicker
  const rnd = (i) => { const x = Math.sin(i * 127.1) * 43758.5453; return x - Math.floor(x); };

  function drawFloor(g, w) {
    if (w.def.floor === "tile") return drawTileFloor(g, w);
    if (w.def.floor === "concrete") return drawConcrete(g, w);
    if (w.def.floor === "carpet") return drawCarpet(g, w);
    // gray laminate: long horizontal planks with subtle tone changes
    const F = w.floor, PH = 8, PL = 72;
    R(g, F.x, F.y, F.w, F.h, "#77736f");
    for (let y = F.y, row = 0; y < F.y + F.h; y += PH, row++) {
      const offset = (row * 29) % PL;
      for (let x = F.x - offset, k = 0; x < F.x + F.w; x += PL, k++) {
        const tone = ["#77736f", "#7b7773", "#73706c", "#7e7a75"][Math.floor(rnd(row * 13 + k) * 4)];
        R(g, Math.max(F.x, x), y, Math.min(PL, F.x + F.w - Math.max(F.x, x)), PH, tone);
        if (x > F.x) R(g, x, y, 1, PH, "#6b6764");
        for (let i = 0; i < 2; i++) R(g, x + 8 + rnd(row * 31 + k * 7 + i) * (PL - 20), y + 2 + i * 3, 10, 1, "#827e79");
      }
      R(g, F.x, y + PH - 1, F.w, 1, "#6b6764");
    }
  }

  function drawConcrete(g, w) {
    const F = w.floor;
    R(g, F.x, F.y, F.w, F.h, "#a7a49f");
    for (let i = 0; i < 260; i++) R(g, F.x + rnd(i) * F.w, F.y + rnd(i + 500) * F.h, 1, 1, i % 2 ? "#9a9792" : "#b3b0ab");
    for (let x = F.x + 64; x < F.x + F.w; x += 64) R(g, x, F.y, 1, F.h, "#95928d");
    R(g, F.x, F.y + F.h / 2, F.w, 1, "#95928d");
  }
  function drawCarpet(g, w) {
    const F = w.floor;
    R(g, F.x, F.y, F.w, F.h, w.def.floorColor || "#56575c");
    for (let i = 0; i < Math.floor(F.w * F.h / 40); i++) R(g, F.x + rnd(i) * F.w, F.y + rnd(i + 900) * F.h, 1, 1, i % 3 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.1)");
  }
  function drawTileFloor(g, w) {
    const F = w.floor;
    if (w.def.tileStyle === "white") {
      // small white tiles with tan grout and little black mosaic accents
      R(g, F.x, F.y, F.w, F.h, "#c8b89a");
      for (let y = F.y, r = 0; y < F.y + F.h; y += 8, r++) for (let x = F.x, c = 0; x < F.x + F.w; x += 8, c++) {
        R(g, x, y, 7, 7, "#f2f0ec");
        if ((r * 7 + c * 3) % 23 === 0) for (let k = 0; k < 4; k++) R(g, x + 1 + (k % 2) * 3, y + 1 + Math.floor(k / 2) * 3, 2, 2, "#2a2a2e");   // little black mosaic
      }
      return;
    }
    if (w.def.tileStyle === "dark") {
      R(g, F.x, F.y, F.w, F.h, "#4e4a52");
      for (let y = F.y; y < F.y + F.h; y += 20) for (let x = F.x; x < F.x + F.w; x += 20) R(g, x, y, 19, 19, "#5c5862");
      return;
    }
    // large light-gray ceramic tiles
    const S = 24;
    R(g, F.x, F.y, F.w, F.h, "#a9a6a1");
    for (let y = F.y, r = 0; y < F.y + F.h; y += S, r++) for (let x = F.x, c = 0; x < F.x + F.w; x += S, c++) {
      R(g, x, y, Math.min(S - 1, F.x + F.w - x), Math.min(S - 1, F.y + F.h - y), ["#b3b0ab", "#aeaba6", "#b6b3ae"][(r * 3 + c * 7) % 3]);
      R(g, x + 3 + rnd(r * 11 + c) * 14, y + 4 + rnd(r + c * 5) * 14, 3, 1, "#c0bdb8");
    }
  }

  function drawWalls(g, w, t) {
    const d = w.def, T = w.T, wallH = d.wallRows * T;
    // back wall
    R(g, 0, 0, w.width, wallH, d.walls.back);
    R(g, 0, 0, w.width, 3, "#8f8c89");
    R(g, T, wallH - 3, w.width - 2 * T, 3, "#efeceb");         // baseboard
    // left (lavender) wall strip, right wall strip, front wall strip
    R(g, 0, 0, T, w.height, "#857aa0");
    R(g, T - 4, wallH, 4, w.height - wallH - T, d.walls.left);
    R(g, w.width - T, 0, T, w.height, "#8c8986");
    R(g, w.width - T, wallH, 4, w.height - wallH - T, d.walls.right);
    R(g, 0, w.height - T, w.width, T, "#7f7c79");
    R(g, T, w.height - T, w.width - 2 * T, 3, d.walls.front);

    for (const dec of d.sideDecor || []) {
      const y = dec.y * T, wx = dec.side === "right" ? w.width - T : T - 6;   // x of the wall's inner face
      if (dec.kind === "towelRack") {
        // towel rack with kitty-print towels
        R(g, wx, y, 6, 2, "#c8ccd4"); R(g, wx, y + dec.h * T - 4, 6, 2, "#c8ccd4");
        R(g, wx - 1, y + 3, 6, dec.h * T - 8, "#f4f0f4");
        for (let i = 0; i < 3; i++) { const cy = y + 6 + i * 9; R(g, wx, cy, 3, 2, ["#e8954a", "#2a2a2e", "#f6f3ee"][i]); R(g, wx, cy - 1, 1, 1, ["#e8954a", "#2a2a2e", "#4b4642"][i]); }
      } else if (dec.kind === "tpHolder") {
        R(g, wx, y + 4, 6, 1, "#c8ccd4"); R(g, wx + 1, y + 2, 4, 5, "#f8f8f8"); R(g, wx + 1, y + 10, 5, 6, "#f0f0f0");   // TP + vent
        for (let i = 0; i < 3; i++) R(g, wx + 1, y + 11 + i * 2, 5, 1, "#8a8a90");
      } else if (dec.kind === "catFrame") {
        R(g, wx, y, 6, 14, "#f4f2ee"); R(g, wx + 1, y + 2, 4, 10, "#2a2a2e"); R(g, wx + 2, y + 5, 2, 3, "#e8954a");
      } else if (dec.kind === "catArt") {
        R(g, wx, y, 6, dec.h * T, "#c8a070"); R(g, wx + 1, y + 2, 4, dec.h * T - 4, "#f2d8e8"); R(g, wx + 2, y + 10, 2, 6, "#e88a3a");
      } else if (dec.kind === "bigFrame") {
        R(g, wx, y, 6, dec.h * T, "#3a2a3a"); R(g, wx + 1, y + 2, 4, dec.h * T - 4, "#c8b8d8"); R(g, wx + 2, y + 8, 2, 10, "#a87ab8");
      } else if (dec.kind === "window") {                                   // curtained window
        R(g, T - 6, y, 6, dec.h * T, "#cfe3f2"); R(g, T - 6, y, 6, 3, "#efe6d6");
        R(g, T - 7, y - 2, 4, dec.h * T + 6, "#efe6d6"); R(g, T - 3, y + 2, 2, dec.h * T, "#e4d8c4");
      } else if (dec.kind === "mirror") {                            // round mirror
        E(g, T - 5, y + T, 4, 9, "#c9a65a"); E(g, T - 5, y + T, 3, 8, "#b8c8d8");
        R(g, T - 6, y + T - 4, 1, 5, "#e2edf5");
      }
    }

    for (const ex of d.exits) {
      if (ex.side === "front" && !ex.to) {                           // front door
        const x = ex.x * T;
        R(g, x, w.height - T, ex.w * T, T, "#5d4a3a");
        R(g, x + 2, w.height - T + 2, ex.w * T - 4, T - 2, "#f2efe9");
        R(g, x + ex.w * T - 7, w.height - T + 8, 2, 2, "#2e2a2a");
        R(g, x + 9, w.height - T + 4, 14, 4, "#b8cde0");
      } else if (ex.side === "front" && ex.style === "interiorDoor") {   // door back into the house
        const x = ex.x * T;
        R(g, x, w.height - T, ex.w * T, T, "#d8cfc2");
        R(g, x, w.height - T, 2, T, "#f2efe9"); R(g, x + ex.w * T - 2, w.height - T, 2, T, "#f2efe9");
        R(g, x + 3, w.height - T + 3, ex.w * T - 6, 5, "#c8bfb2");
      } else if (ex.side === "front") {                              // open doorway in the front wall
        const x = ex.x * T;
        R(g, x, w.height - T, ex.w * T, T, "#6c6762");
        R(g, x, w.height - T, 2, T, "#f2efe9"); R(g, x + ex.w * T - 2, w.height - T, 2, T, "#f2efe9");
        for (let i = 0; i < 6; i++) R(g, x - 2 + (i % 2) * (ex.w * T + 2), w.height - T + 2 + Math.floor(i / 2) * 5, 2, 2, Math.sin(t * 3 + i) > 0 ? "#ff7ae0" : "#9a4a8a");
      } else if ((ex.side === "left" || ex.side === "right") && ex.style === "hallDoor") {
        // a bedroom / bathroom door in a side wall: white frame, door standing ajar
        const y = ex.y * T, x0 = ex.side === "left" ? 0 : w.width - T, open = !!(LPK.rooms[ex.to] && LPK.rooms[ex.to].available);
        R(g, x0, y - 2, T, ex.h * T + 4, "#f2efe9");
        R(g, x0 + 3, y + 1, T - 6, ex.h * T - 2, open ? "#4a3a5a" : "#e8e2ec");
        if (open) R(g, x0 + (ex.side === "left" ? 3 : T - 7), y + 1, 4, ex.h * T - 2, "#f4f2ee");
        else R(g, x0 + (ex.side === "left" ? T - 6 : 4), y + ex.h * T / 2, 2, 2, "#d8b040");   // closed: brass knob
      } else if (ex.side === "right" && ex.style === "stairsDown") {  // stairwell down to the basement
        const y = ex.y * T, x0 = w.width - T - 2;
        R(g, x0, y - 2, T + 2, ex.h * T + 4, "#f2efe9");
        for (let i = 0; i < 6; i++) R(g, x0 + 2 + i * 2.5, y + 1, 3, ex.h * T - 2, `rgb(${92 - i * 12},${93 - i * 12},${98 - i * 12})`);
        for (let i = 0; i < 6; i++) R(g, x0 + 3 + i * 2.5, y + 1, 1, ex.h * T - 2, "rgba(0,0,0,0.25)");
        R(g, x0, y + ex.h * T - 2, T + 2, 2, "#7a4a2a");                 // wooden handrail
      } else if (ex.side === "left" && ex.style === "stairsUp") {     // stairs up to the back room
        const y = ex.y * T;
        for (let i = 0; i < 6; i++) R(g, i * 2.7, y, 3, ex.h * T, `rgb(${70 + i * 10},${71 + i * 10},${76 + i * 10})`);
        R(g, 0, y - 2, T + 2, 2, "#f2efe9"); R(g, 0, y + ex.h * T, T + 2, 2, "#7a4a2a");
        R(g, 0, y + 2, 4, ex.h * T - 4, "rgba(255,240,200,0.35)");      // light from upstairs
      } else if (ex.side === "left") {                               // doorway in the left wall (kitchen tile beyond)
        const y = ex.y * T;
        R(g, 0, y, T, ex.h * T, "#a9a6a1");
        for (let i = 0; i < ex.h * 2; i++) R(g, 2, y + i * 8 + 1, T - 4, 7, i % 2 ? "#b3b0ab" : "#aeaba6");
        R(g, 0, y, T, 2, "#f2efe9"); R(g, 0, y + ex.h * T - 2, T, 2, "#f2efe9");
      } else if (ex.side === "right") {                              // doorway in the right wall
        const y = ex.y * T;
        R(g, w.width - T, y, T, ex.h * T, "#3a3230");
        R(g, w.width - T + 3, y + 2, T - 3, ex.h * T - 4, "#5a4a42");
        R(g, w.width - T + 6, y + 6, 8, 10, "#d8cfc2"); R(g, w.width - T + 6, y + 18, 8, 6, "#c97a8a");   // glimpse of brick + pink chair
        R(g, w.width - T, y, T, 2, "#f2efe9"); R(g, w.width - T, y + ex.h * T - 2, T, 2, "#f2efe9");
      }
    }

    if (d.chairRail) R(g, T, wallH - 14, w.width - 2 * T, 14, "rgba(255,255,255,0.35)"), R(g, T, wallH - 15, w.width - 2 * T, 1, "#f4f2f6");
    if (d.fairyLights) {
      // strings of purple + orange fairy lights along the walls and floor edges
      const F = w.floor, cols = ["#c77dff", "#ff9a3a", "#b05aff", "#ffb050"];
      const dot = (x, y, i) => { const on = Math.sin(t * 2.4 + i * 1.7) > -0.5; R(g, x, y, 2, 2, on ? cols[i % 4] : "#6a3a7a"); };
      let i = 0;
      for (let y = 4; y < w.height - T; y += 7) { dot(T - 5, y, i++); dot(w.width - T + 3, y, i++); dot(F.x + 1, Math.max(F.y, y), i++); dot(F.x + F.w - 3, Math.max(F.y, y), i++); }
      for (let x = T; x < w.width - T; x += 7) dot(x, 3, i++);
    }
    if (d.bigDoor) {
      // overhead garage door on the right wall; opens to the driveway
      const y = d.bigDoor.y * T, h = d.bigDoor.h * T, open = (LPK.game && LPK.game.garageOpen) || 0;
      R(g, w.width - T, y, T, h, "#9ac0e0");                                  // outside: sky
      R(g, w.width - T, y + h * 0.45, T, h * 0.55, "#7aa860");                // lawn
      R(g, w.width - T, y + h * 0.6, T, h * 0.25, "#8a8a88");                 // driveway
      R(g, w.width - T + 6, y + 6, 6, 14, "#d8a040");                         // fall tree
      const ph = h * (1 - open);
      for (let i = 0; i < 6; i++) { const py = y + i * (ph / 6); if (ph > 1) { R(g, w.width - T, py, T, Math.max(1, ph / 6 - 1), "#f2f0ec"); R(g, w.width - T, py + ph / 6 - 1, T, 1, "#c8c6c0"); } }
      R(g, w.width - T - 2, y - 2, T + 2, 2, "#d8d4ce"); R(g, w.width - T - 2, y + h, T + 2, 2, "#d8d4ce");
    }

    for (const dec of d.wallDecor) {
      const x = dec.x * T, dw = dec.w * T;
      if (dec.kind === "tv") {
        // TV standing on the media stand
        R(g, x, 8, dw, 34, "#121216");
        const hue = (t * 8) % 360;
        const grd = g.createLinearGradient(x, 10, x + dw, 40);
        grd.addColorStop(0, `hsl(${hue},55%,55%)`); grd.addColorStop(1, `hsl(${(hue + 60) % 360},65%,62%)`);
        g.fillStyle = grd; g.fillRect(Math.round(x + 2), 10, Math.round(dw - 4), 30);
        R(g, x + dw / 2 - 6, 18 + Math.round(Math.sin(t * 2) * 2), 12, 10, "rgba(255,255,255,0.55)");
        R(g, x + dw / 2 - 4, 42, 8, 4, "#1d1d22");
      } else if (dec.kind === "kitchenDoor") {
        // doorway into the kitchen
        R(g, x, 4, dw, wallH - 4, "#5a4b38");
        R(g, x + 3, 8, dw - 6, 14, "#c6a26a"); R(g, x + 3, 22, dw - 6, 6, "#e9e4dc");
        R(g, x + 3, 28, dw - 6, wallH - 28, "#6c6460");
        R(g, x, 4, 2, wallH - 4, "#f2efe9"); R(g, x + dw - 2, 4, 2, wallH - 4, "#f2efe9");
      } else if (dec.kind === "photoWall") {
        // the family photo gallery above the sectional
        const cols = Math.floor(dw / 13), palette = ["#7fa7c9", "#d9a68f", "#a8c98f", "#c9a8d9", "#e2c27a", "#8fb4b0"];
        for (let r = 0; r < 3; r++) for (let c = 0; c < cols; c++) {
          const px = x + 2 + c * 13, py = 4 + r * 11;
          R(g, px, py, 10, 9, "#2e2a28");
          R(g, px + 1, py + 1, 8, 7, palette[(r * 5 + c * 3) % palette.length]);
          if ((r + c) % 4 === 1) { R(g, px + 3, py + 2, 4, 3, "#f2d2b6"); }
          if (r === 1 && c === 2) { R(g, px + 2, py + 2, 6, 5, "#26232a"); R(g, px + 4, py + 5, 2, 2, "#f4f1ec"); } // CC portrait
          if (r === 0 && c === 6) { R(g, px + 2, py + 2, 6, 5, "#f6f3ee"); R(g, px + 2, py + 2, 6, 2, "#4b4642"); } // Marshmallow
        }
      } else if (dec.kind === "upperCabinets") {
        for (let i = 0; i < dec.w; i++) {
          const cx = x + i * T;
          R(g, cx, 4, T - 1, 30, "#c4924e"); R(g, cx + 2, 6, T - 5, 26, "#d4a462");
          R(g, cx + 3, 8, T - 7, 2, "#e2b878"); R(g, cx + (i % 2 ? 3 : T - 5), 22, 1, 5, "#7a5a2a");
        }
        R(g, x, 34, dw, 2, "#a8783c");
        R(g, x, 36, dw, wallH - 36, "#ece6dc");                       // backsplash
      } else if (dec.kind === "microwave") {
        R(g, x + 1, 26, dw - 2, 14, "#f2f2f0"); R(g, x + 3, 28, dw - 12, 10, "#2e2e34"); R(g, x + dw - 7, 29, 3, 2, "#4ac06a");
      } else if (dec.kind === "kitchenWindow") {
        R(g, x, 8, dw, 30, "#f2efe9"); R(g, x + 3, 11, dw - 6, 24, "#a8d0ec"); R(g, x + dw / 2 - 1, 11, 2, 24, "#f2efe9");
        R(g, x - 2, 6, dw + 4, 4, "#e9e1d4");
      } else if (dec.kind === "slidingDoor") {
        R(g, x, 4, dw, wallH - 4, "#e6e6e4");
        const o = (LPK.game && LPK.game.room === "kitchen" && LPK.game.blindsOpen) ? LPK.game.blindsOpen() : 0;
        if (o > 0) {
          // the backyard Robert takes care of: blue sky, trees, fence, a perfectly striped lawn
          const vx = x + 1, vy = 6, vw = dw - 2, vh = wallH - 7;
          R(g, vx, vy, vw, vh, "#a8d4f0");
          E(g, vx + vw * 0.2, vy + 9, 7, 6, "#3a8a3a"); E(g, vx + vw * 0.75, vy + 8, 8, 7, "#2e7a34"); E(g, vx + vw * 0.5, vy + 11, 6, 4, "#4a9a44");
          R(g, vx, vy + 13, vw, 5, "#a87a4a"); for (let i = 0; i < vw; i += 3) R(g, vx + i, vy + 12, 2, 6, "#bc8e5a");
          for (let i = 0; i < 6; i++) R(g, vx + (i * vw) / 6, vy + 18, Math.ceil(vw / 6), vh - 18, i % 2 ? "#5cb04a" : "#72c45e");
          [[0.15, 20], [0.4, 23], [0.85, 21]].forEach(([fx, fy], i) => R(g, vx + vw * fx, vy + fy, 2, 2, ["#ff7aa8", "#ffd166", "#ff5a5a"][i]));
          if (Math.floor(LPK.game.time * 3) % 2) R(g, vx + vw * 0.62, vy + 5, 2, 1, "#2a2a30");          // a little bird
        }
        // blinds: slats bunch up to the sides as they open
        const n = Math.floor(dw / 3), half = dw / 2;
        for (let i = 0; i < n; i++) {
          const left = i < n / 2, k = left ? i : n - 1 - i;
          const sx = left ? x + 1 + k * 3 * (1 - o) + k * 0.6 * o : x + dw - 3 - k * 3 * (1 - o) - k * 0.6 * o;
          R(g, sx, 6, 2, wallH - 7, i % 2 ? "#f7f7f5" : "#e0e0de");
        }
        R(g, x, 4, dw, 2, "#cfcfcd");
      } else if (dec.kind === "wallPlates") {
        E(g, x + 6, 14, 5, 5, "#f2f0ec"); E(g, x + 6, 14, 3, 3, "#c86a6a");
        E(g, x + 18, 20, 5, 5, "#f2f0ec"); E(g, x + 18, 20, 3, 3, "#6a8ac8");
      } else if (dec.kind === "curtainDoor") {
        R(g, x, 4, dw, wallH - 4, "#e8e4da");
        for (let i = 0; i < dw; i += 3) R(g, x + i, 6, 1, wallH - 7, "#d4cebf");
        R(g, x - 1, 3, dw + 2, 3, "#9a948a");
      } else if (dec.kind === "tvSmall") {
        R(g, x, 12, dw, 24, "#121216");
        R(g, x + 2, 14, dw - 4, 20, `hsl(${(t * 6) % 360},40%,40%)`);
      } else if (dec.kind === "brickChimney") {
        R(g, x, 6, dw, wallH - 6, "#d8d4ce");
        for (let yy = 8, row = 0; yy < wallH; yy += 4, row++) for (let xx = x + (row % 2) * 4; xx < x + dw; xx += 8) R(g, xx, yy, 1, 4, "#bdb8b0");
        for (let yy = 10; yy < wallH; yy += 4) R(g, x, yy, dw, 1, "#c4bfb8");
      } else if (dec.kind === "fireplaceArt") {
        R(g, x, 8, dw, 12, "#3a2a2a"); R(g, x + 2, 10, dw - 4, 8, "#e8d8d0");
        for (let i = 0; i < 8; i++) R(g, x + 4 + i * 5, 11, 2, 6, ["#c8506a", "#e88aa0", "#a03a50"][i % 3]);
      } else if (dec.kind === "signFrame") {
        R(g, x, 6, dw, 16, "#f4f2ee"); R(g, x + 3, 9, dw - 6, 1, "#6a6a70"); R(g, x + 3, 12, dw - 7, 1, "#6a6a70"); R(g, x + 4, 15, dw - 8, 1, "#6a6a70");
      } else if (dec.kind === "grayCurtainWindow") {
        R(g, x + 8, 10, dw - 14, 26, "#f2f2f0"); R(g, x + 10, 12, dw - 18, 22, "#c8dcc0"); R(g, x + 10, 12, dw - 18, 8, "#e0ecf2");
        R(g, x + 16, 18, 2, 16, "#6a5a4a"); R(g, x + dw / 2, 12, 1, 22, "#f2f2f0");                        // tree outside + sash
        R(g, x, 8, dw, 2, "#c8a050");                                                                      // brass rod
        R(g, x + dw - 10, 10, 9, wallH - 10, "#d8d8d4"); for (let i = 0; i < 3; i++) R(g, x + dw - 9 + i * 3, 10, 1, wallH - 10, "#c4c4c0");
      } else if (dec.kind === "deskWall") {
        // photo shelf + stickers above Laura's desk
        R(g, x, 18, dw, 2, "#f4f2ee");
        R(g, x + 2, 8, 8, 10, "#f4f2ee"); R(g, x + 3, 9, 6, 8, "#e8a070"); R(g, x + 12, 9, 7, 9, "#2a2a2e"); R(g, x + 13, 10, 5, 7, "#e8e050");
        [[3, 24, "#ff9ab8"], [12, 26, "#7ad8c8"], [20, 23, "#f2c23a"], [7, 32, "#c77dff"], [17, 33, "#f4f4f4"]].forEach(([dx, dy, c]) => R(g, x + dx, dy, 4, 3, c));
      } else if (dec.kind === "doorwayPlain") {
        R(g, x, 4, dw, wallH - 4, "#6c6a6e"); R(g, x, 4, 2, wallH - 4, "#f2efe9"); R(g, x + dw - 2, 4, 2, wallH - 4, "#f2efe9"); R(g, x, 4, dw, 2, "#f2efe9");
      } else if (dec.kind === "pumpkinCurtain") {
        // the jack-o'-lantern shower curtain
        R(g, x - 2, 6, dw + 4, 2, "#c8ccd4");
        R(g, x, 8, dw, wallH - 4, "#f2ecef");
        for (let r = 0; r < 4; r++) for (let c = 0; c < Math.floor(dw / 9); c++) {
          const px = x + 3 + c * 9 + (r % 2) * 4, py = 11 + r * 10, orange = (r + c) % 2 === 0;
          E(g, px + 3, py + 3, 3, 3, orange ? "#e8742a" : "#1e1e22"); R(g, px + 2, py + 2, 1, 1, orange ? "#2a1a10" : "#f2ecef"); R(g, px + 4, py + 2, 1, 1, orange ? "#2a1a10" : "#f2ecef");
          R(g, px + 1, py + 4, 4, 1, orange ? "#2a1a10" : "#f2ecef");
        }
      } else if (dec.kind === "hallwayDoor") {
        // opening into the hallway: purple carpet corridor, fairy lights around it
        R(g, x, 4, dw, wallH - 4, "#8a3aa8"); R(g, x + 3, 8, dw - 6, wallH - 8, "#b86ad0");
        R(g, x + 6, 10, dw - 12, 10, "#f2e6f6"); R(g, x + 3, 30, dw - 6, wallH - 30, "#7d6a8a");
        R(g, x, 4, 2, wallH - 4, "#f2efe9"); R(g, x + dw - 2, 4, 2, wallH - 4, "#f2efe9");
        for (let i = 0; i < 9; i++) {
          const on = Math.sin(t * 3 + i * 1.3) > -0.3;
          R(g, x - 2, 6 + i * 5, 2, 2, on ? (i % 2 ? "#ff9a3a" : "#c77dff") : "#6a3a8a");
          R(g, x + dw, 6 + i * 5, 2, 2, on ? (i % 2 ? "#c77dff" : "#ff9a3a") : "#6a3a8a");
        }
      } else if (dec.kind === "paneMirror") {
        // white decorative window-pane mirror at the end of the hallway + orange-cat portrait
        R(g, x + 4, 2, dw - 8, 20, "#f4f2f0"); R(g, x + 6, 4, dw - 12, 16, "#c8b0d8");
        R(g, x + dw / 2 - 1, 4, 2, 16, "#f4f2f0"); R(g, x + 6, 11, dw - 12, 2, "#f4f2f0");
        E(g, x + dw / 2, 12, 6, 7, "rgba(244,242,240,0.6)");
        R(g, x + dw / 2 - 4, 24, 8, 7, "#3a2a2a"); R(g, x + dw / 2 - 3, 25, 6, 5, "#e8954a"); R(g, x + dw / 2 - 2, 26, 1, 1, "#2a2a2a"); R(g, x + dw / 2 + 1, 26, 1, 1, "#2a2a2a");
      } else if (dec.kind === "bookcaseHeadboard") {
        // dark-wood bookcase headboard: books + toy figures (behind the bed)
        R(g, x, 10, dw, wallH - 10, "#3a2620"); R(g, x, 10, dw, 2, "#4e342a");
        const books = ["#e84a3a", "#f2c23a", "#4a8ae8", "#4ac06a", "#e8742a", "#c77dff", "#f2f0e8"];
        for (let i = 0; i < dw / 3 - 1; i++) R(g, x + 2 + i * 3, 30 + (i % 3 === 0 ? 1 : 0), 2, 9, books[i % books.length]);
        for (let i = 0; i < 7; i++) R(g, x + 4 + i * 11, 15, 4, 6, books[(i * 3) % books.length]);  // toy figures on top
        R(g, x, 22, dw, 2, "#2a1a14"); R(g, x, 40, dw, 2, "#2a1a14");
      } else if (dec.kind === "owenSign") {
        R(g, x, 2, dw, 6, "#8ad8c8"); R(g, x + 2, 4, dw - 4, 2, "#2a3a3a");
      } else if (dec.kind === "lightCurtains") {
        R(g, x + 8, 12, dw - 16, 26, "#f4f6f8"); R(g, x + 10, 14, dw - 20, 22, "#e0ecf4");             // window
        R(g, x - 3, 10, dw + 6, 2, "#1a1a20");
        R(g, x, 12, 10, wallH - 12, "#d8d8dc"); R(g, x + dw - 10, 12, 10, wallH - 12, "#d8d8dc");      // light gray curtains
        for (let i = 0; i < 3; i++) { R(g, x + 3 * i + 1, 12, 1, wallH - 12, "#c4c4ca"); R(g, x + dw - 9 + 3 * i, 12, 1, wallH - 12, "#c4c4ca"); }
      } else if (dec.kind === "trophyWall") {
        R(g, x, 8, 12, 14, "#1a1a1e"); R(g, x + 2, 10, 8, 10, "#c890e8");                              // framed picture
        R(g, x + 14, 16, 22, 2, "#d8d8d8");
        for (let i = 0; i < 4; i++) { R(g, x + 15 + i * 5, 10, 3, 6, "#e8c040"); R(g, x + 16 + i * 5, 20, 1, 8, i % 2 ? "#3a3a6a" : "#8a2a2a"); E(g, x + 16 + i * 5, 29, 2, 2, "#c8a040"); }
        E(g, x + 32, 26, 4, 3, "#c83a3a"); R(g, x + 30, 24, 3, 2, "#2a3a8a");                          // cap
      } else if (dec.kind === "evanSign") {
        R(g, x, 3, dw, 6, "#5a9aa8"); R(g, x + 2, 5, dw - 4, 2, "#f2f0e0");
      } else if (dec.kind === "blueCurtains") {
        R(g, x - 4, 10, dw + 8, 2, "#1a1a20");                                       // rod
        R(g, x, 12, dw, wallH - 12, "#2e4a8a");
        for (let i = 0; i < dw; i += 6) R(g, x + i, 12, 1, wallH - 12, "#24407a");
        R(g, x + dw / 2 - 1, 12, 2, wallH - 12, "#1e3468");
        R(g, x - 1, 12, 1, wallH - 12, "rgba(220,240,255,0.7)"); R(g, x + dw, 12, 1, wallH - 12, "rgba(220,240,255,0.7)");   // daylight leaking at the edges
      } else if (dec.kind === "moviePoster") {
        R(g, x, 26, dw, 20, "#e8742a"); R(g, x + 2, 28, dw - 4, 4, "#ffd84a"); R(g, x + 3, 34, dw - 6, 6, "#c8501a"); R(g, x + 2, 41, dw - 4, 3, "#ffd84a");
      } else if (dec.kind === "kittenPoster") {
        R(g, x, 24, dw, 22, "#e8c8e8"); E(g, x + 7, 34, 4, 4, "#d8a868"); E(g, x + 15, 35, 4, 4, "#c89058");
        R(g, x + 3, 42, dw - 6, 2, "#a85aa8");
      } else if (dec.kind === "framedArt") {
        R(g, x, 10, dw, 18, "#1a1a1e"); R(g, x + 2, 12, dw - 4, 14, "#d8a85a"); R(g, x + 6, 16, 8, 9, "#c84a6a");
      } else if (dec.kind === "garageDoorway") {
        // the white door to the garage, standing open (brass knob), garage concrete beyond
        R(g, x, 4, dw, wallH - 4, "#8a8780"); R(g, x + 3, 10, dw - 6, wallH - 10, "#a7a49f");
        R(g, x, 4, 2, wallH - 4, "#f2efe9"); R(g, x + dw - 2, 4, 2, wallH - 4, "#f2efe9"); R(g, x, 4, dw, 2, "#f2efe9");
        R(g, x - 7, 6, 7, wallH - 6, "#f4f2ee"); R(g, x - 6, 26, 2, 2, "#d8b040");       // the open door + knob
      } else if (dec.kind === "window") {
        R(g, x, 8, dw, 26, "#f2efe9"); R(g, x + 2, 10, dw - 4, 22, "#b8d8a8");
        R(g, x + 2, 10, dw - 4, 8, "#d8e8f0"); R(g, x + 4, 18, 4, 14, "#8a6a4a");           // fall tree outside
        R(g, x + 2, 12, 8, 5, "#e0b040"); R(g, x - 1, 33, dw + 2, 2, "#e9e1d4");
      } else if (dec.kind === "pegboard") {
        R(g, x, 10, dw, 22, "#c8a878");
        for (let yy = 12; yy < 32; yy += 3) for (let xx = x + 2; xx < x + dw; xx += 3) R(g, xx, yy, 1, 1, "#9a7a50");
        R(g, x + 6, 14, 2, 10, "#c84040"); R(g, x + 14, 15, 6, 2, "#5a5a60"); R(g, x + 30, 13, 3, 12, "#e8b040"); R(g, x + 50, 16, 8, 3, "#4a7ad8");
      } else if (dec.kind === "garageLight") {
        R(g, x - 6, 4, dw + 12, 3, "#f8f8f0"); R(g, x - 6, 7, dw + 12, 1, "#c8c8c0");
      } else if (dec.kind === "basementWindow") {
        R(g, x, 6, dw, 10, "#e2ded8"); R(g, x + 2, 8, dw - 4, 6, "#7a8a9a");
      } else if (dec.kind === "thermostat") {
        R(g, x + 4, 14, 8, 6, "#e9edf0"); R(g, x + 6, 16, 4, 2, "#4aa8e8");
      }
    }
  }

  // Each furniture piece returns draw calls; sortY decides what's in front.
  function furnitureDraw(f, w, t) {
    const T = w.T, x = f.x * T, y = f.y * T, fw = f.w * T, fh = f.h * T;
    switch (f.kind) {
      case "rug": return { sortY: -1, draw: (g) => {
        R(g, x, y, fw, fh, "#cdc7bb"); R(g, x + 2, y + 2, fw - 4, fh - 4, "#dbd6cb");
        for (let i = 0; i < 60; i++) R(g, x + 4 + rnd(i) * (fw - 8), y + 4 + rnd(i + 99) * (fh - 8), 2, 1, "#c4bdaf");
        R(g, x + 4, y + 4, fw - 8, 1, "#c4bdaf"); R(g, x + 4, y + fh - 5, fw - 8, 1, "#c4bdaf");
      } };
      case "doormat": return { sortY: -1, draw: (g) => { R(g, x, y + 4, fw, fh - 4, "#6f5a4a"); R(g, x + 2, y + 6, fw - 4, fh - 8, "#8a7260"); } };
      case "shoes": return { sortY: -1, draw: (g) => {
        const c = ["#2a2a30", "#f2f2f2", "#3a3a40"][f.variant || 0];
        R(g, x + 2, y + 6, 6, 3, c); R(g, x + 9, y + 8, 6, 3, c); R(g, x + 2, y + 8, 6, 1, "#ddd"); R(g, x + 9, y + 10, 6, 1, "#ddd");
      } };
      case "tvStand": return { sortY: y + fh, draw: (g) => {
        // gray-wash stand with an electric fireplace in the middle
        R(g, x, y - 6, fw, fh + 6, "#9b968f"); R(g, x, y - 6, fw, 3, "#b5b0a8");
        const fx = x + fw / 2 - 12;
        R(g, fx, y - 2, 24, fh - 1, "#1b1716");
        for (let i = 0; i < 4; i++) {
          const fl = 3 + Math.round((Math.sin(t * 9 + i * 2) + 1) * 2);
          R(g, fx + 3 + i * 5, y + fh - 4 - fl, 3, fl, "#f08a24"); R(g, fx + 4 + i * 5, y + fh - 3 - fl / 2, 1, fl / 2, "#ffd34d");
        }
        R(g, x + 3, y, 8, 1, "#7d7872"); R(g, x + fw - 11, y, 8, 1, "#7d7872");
        R(g, x + 5, y - 5, 4, 4, "#5fa34a"); R(g, x + fw - 9, y - 5, 4, 4, "#e9e1d4");
      } };
      case "floorLamp": return { sortY: y + fh, draw: (g) => {
        R(g, x + 3, y + fh - 2, 2, 2, "#3a3330"); R(g, x + 11, y + fh - 2, 2, 2, "#3a3330"); R(g, x + 7, y + fh - 1, 2, 1, "#3a3330");
        R(g, x + 7, y - 26, 2, 40, "#8a8580");
        R(g, x + 1, y - 34, 14, 10, "#f4efe4"); R(g, x + 1, y - 26, 14, 2, "#d8d1c2");
      } };
      case "sideTable": return { sortY: y + fh, draw: (g) => {
        R(g, x + 1, y - 6, 14, 18, "#2a2628"); R(g, x + 1, y - 6, 14, 3, "#3b3638");
        R(g, x + 4, y - 1, 8, 6, "#3d5a9a"); R(g, x + 5, y, 6, 1, "#7fb0ff");
      } };
      case "sectionalLong": return { sortY: y + fh, draw: (g) => {
        // backrest against the wall, seat, front face, pillows
        R(g, x, y - 12, fw, 14, "#5f6368"); R(g, x, y - 12, fw, 3, "#6d7176");
        for (let i = 1; i < 4; i++) R(g, x + (fw / 4) * i, y - 9, 1, 10, "#55595e");
        R(g, x, y + 2, fw, fh - 10, "#6f7378");
        for (let i = 1; i < 4; i++) R(g, x + (fw / 4) * i, y + 2, 1, fh - 10, "#62666b");
        R(g, x, y + fh - 8, fw, 8, "#585c61"); R(g, x, y + fh - 8, fw, 1, "#7d8186");
        R(g, x - 2, y - 10, 4, fh + 10, "#5a5e63");                   // arm
        R(g, x + 6, y - 6, 12, 10, "#ece4d4"); R(g, x + 20, y - 7, 11, 11, "#d9772b");  // cream + orange pillows
        R(g, x + 92, y - 5, 12, 9, "#ece4d4");
        R(g, x + 52, y + 2, 18, 8, "#efeae2"); R(g, x + 54, y + 4, 14, 1, "#d8d0c4");   // folded blanket
      } };
      case "sectionalReturn": return { sortY: y + fh, draw: (g) => {
        R(g, x + fw - 8, y - 14, 10, fh + 14, "#5f6368");
        R(g, x, y - 4, fw - 6, fh, "#6f7378");
        R(g, x, y + fh - 8, fw - 6, 8, "#585c61"); R(g, x, y + fh - 8, fw - 6, 1, "#7d8186");
        R(g, x, y + fh / 2 - 2, fw - 6, 1, "#62666b");
        R(g, x + 6, y + 6, 12, 10, "#ece4d4");
      } };
      case "catTree": return { sortY: y + fh, draw: (g) => {
        // cream multi-level cat tree with a cubby
        R(g, x + 2, y + fh - 6, fw - 4, 6, "#d8c9a6");
        R(g, x + 6, y - 30, 4, fh + 26, "#e8dcc0"); R(g, x + fw - 10, y - 16, 4, fh + 12, "#e8dcc0");
        for (let i = 0; i < 5; i++) R(g, x + 6, y - 26 + i * 8, 4, 1, "#cdbf9f");
        R(g, x, y - 6, fw, 16, "#e3d5b4"); R(g, x, y - 6, fw, 2, "#f0e6cc");
        E(g, x + fw / 2, y + 2, 6, 5, "#5a4a3a");                        // cubby hole
        R(g, x - 2, y - 20, 18, 4, "#d8c9a6"); R(g, x + 14, y - 34, 18, 4, "#d8c9a6");
        R(g, x + 26, y - 30, 2, 6, "#b9a986");
      } };
      case "shoeBench": return { sortY: y + fh, draw: (g) => {
        R(g, x - 2, y - 4, fw + 2, fh + 2, "#6d6a72"); R(g, x - 2, y - 4, fw + 2, 3, "#8a8790");
        for (let i = 0; i < 6; i++) R(g, x - 1 + (i % 2) * 7, y + 4 + i * 7, 5, 3, ["#2a2a2a", "#d8d8d8", "#7a3030"][i % 3]);
        R(g, x - 1, y - 8, 10, 6, "#2e2e34");                           // jacket on top
      } };
      case "counterRun": return { sortY: y + fh, draw: (g) => {
        // honey-colored lower cabinets with stove, dishwasher and sink
        R(g, x, y - 10, fw, fh + 10, "#c4924e");
        for (let i = 0; i < f.w; i++) { R(g, x + i * T + 2, y - 2, T - 5, fh, "#d4a462"); R(g, x + i * T + (i % 2 ? 3 : T - 5), y + 4, 1, 5, "#7a5a2a"); }
        R(g, x, y - 12, fw, 4, "#ddd6c8"); R(g, x, y - 8, fw, 1, "#b8ae9c");                 // countertop
        R(g, x + 3 * T, y - 12, 2 * T, fh + 12, "#f4f4f2"); R(g, x + 3 * T + 3, y - 2, 2 * T - 6, 12, "#2a2a30");   // white stove
        for (let i = 0; i < 4; i++) E(g, x + 3 * T + 7 + (i % 2) * 18, y - 11 + Math.floor(i / 2) * 2, 4, 1, "#3a3a40");
        R(g, x + 6 * T, y - 8, 2 * T, fh + 8, "#f2f2f0"); R(g, x + 6 * T + 3, y - 5, 2 * T - 6, 2, "#c8c8c8");      // dishwasher
        R(g, x + 9 * T + 2, y - 12, 2 * T - 4, 4, "#9aa4ad"); R(g, x + 10 * T - 1, y - 18, 2, 6, "#c8ccd0");     // sink + faucet
        R(g, x + 2, y - 18, 6, 6, "#e86a4a"); R(g, x + 11 * T, y - 17, 8, 5, "#c8a46a");                       // canisters
        R(g, x + 4, y - 4, 22, 6, "#b8823e"); R(g, x + 6, y - 2, 18, 1, "#ffd166");                             // treat cabinet label
      } };
      case "fridge": return { sortY: y + fh, draw: (g) => {
        R(g, x + 1, y - 34, fw - 2, fh + 34, "#f0f0ee"); R(g, x + 1, y - 34, fw - 2, 2, "#ffffff");
        R(g, x + 1, y - 6, fw - 2, 1, "#c8c8c6"); R(g, x + fw - 6, y - 28, 2, 14, "#b0b0ae"); R(g, x + fw - 6, y, 2, 14, "#b0b0ae");
        R(g, x + 6, y - 26, 6, 5, "#e8b04a"); R(g, x + 14, y - 22, 5, 6, "#ff7aa8"); R(g, x + 8, y - 16, 5, 4, "#7fb0ff");  // magnets + drawings
        // Evan's drawings, stuck on the lower door
        ((LPK.save && LPK.save.data.evanDrawings) || []).slice(-6).forEach((d, i) => {
          const px = x + 3 + (i % 3) * 8, py = y + 2 + Math.floor(i / 3) * 9;
          R(g, px, py, 6, 7, "#fbfaf2"); R(g, px + 2, py - 1, 2, 1, "#d84a4a");
          R(g, px + 1, py + 2, 3, 1, d.c[0]); R(g, px + 2, py + 3, 3, 2, d.c[1]); R(g, px + 1, py + 5, 1, 1, d.c[2]);
        });
      } };
      case "island": return { sortY: y + fh, draw: (g) => {
        R(g, x, y - 8, fw, fh + 8, "#c4924e"); R(g, x - 1, y - 10, fw + 2, 6, "#ddd6c8");
        for (let i = 0; i < f.w; i++) R(g, x + i * T + 2, y + 4, T - 5, fh - 8, "#d4a462");
      } };
      case "trashCan": return { sortY: y + fh, draw: (g) => {
        const lid = LPK.game && LPK.game.trashOpen ? -3 : 0;
        R(g, x + 2, y - 10, 12, 24, "#a89c84"); R(g, x + 3, y - 10, 3, 24, "#c4b89e");
        R(g, x + 1, y - 13 + lid, 14, 4, "#8a7f6a"); R(g, x + 5, y + 12, 6, 2, "#5a5246");
        if (lid) R(g, x + 4, y - 12, 8, 3, "#7a3a8a");
      } };
      case "cardboardBox": return { sortY: y + fh, draw: (g) => {
        R(g, x - 1, y + 4, fw + 2, 3, "#9a6a3a");                                     // back rim
        R(g, x - 1, y + 7, fw + 2, 9, "#c08a52"); R(g, x - 1, y + 7, fw + 2, 1, "#a0703e");
        for (let i = 0; i < 5; i++) R(g, x + i * 3, y + 7, 2, 1, "#8a5a2a");           // chewed edge
        R(g, x + 4, y + 10, 6, 4, "#d8b07a");
      } };
      case "diningTable": return { sortY: y + fh, draw: (g) => {
        // chairs behind, light-wood table, chairs in front
        for (let i = 0; i < 2; i++) { R(g, x + 6 + i * 34, y - 12, 14, 14, "#9aa0a6"); R(g, x + 8 + i * 34, y - 10, 10, 10, "#b8bec4"); }
        R(g, x, y, fw, fh - 10, "#c8955a"); R(g, x, y, fw, 2, "#dcae74"); R(g, x, y + fh - 12, fw, 3, "#a8763e");
        R(g, x + 2, y + fh - 10, 3, 10, "#a8763e"); R(g, x + fw - 5, y + fh - 10, 3, 10, "#a8763e");
        R(g, x + 22, y + 10, 6, 6, "#e8e2d6"); R(g, x + 36, y + 8, 4, 8, "#7aa86a");     // dishes + plant
        R(g, x - 12, y + 10, 10, 14, "#9aa0a6"); R(g, x - 11, y + 22, 2, 8, "#7a8086"); R(g, x - 5, y + 22, 2, 8, "#7a8086"); // side chair
        R(g, x + fw + 2, y + 10, 10, 14, "#9aa0a6"); R(g, x + fw + 3, y + 22, 2, 8, "#7a8086"); R(g, x + fw + 9, y + 22, 2, 8, "#7a8086");
      } };
      case "catTower": return { sortY: y + fh, draw: (g) => {
        // dark-brown cat tower with sisal posts (from the dining photo)
        R(g, x + 2, y + fh - 6, fw - 4, 6, "#4a3a30");
        R(g, x + 6, y - 40, 4, fh + 36, "#c8b08a"); R(g, x + fw - 10, y - 24, 4, fh + 20, "#c8b08a");
        for (let i = 0; i < 8; i++) R(g, x + 6, y - 38 + i * 6, 4, 1, "#a8906a");
        R(g, x - 2, y - 10, fw + 4, 5, "#4a3a30"); R(g, x + 6, y - 26, fw - 4, 5, "#4a3a30"); R(g, x - 4, y - 42, fw - 2, 5, "#4a3a30");
        R(g, x + fw - 8, y - 4, 4, 4, "#e04a4a");                                    // red toy
      } };
      case "kitchenMat": return { sortY: -1, draw: (g) => { R(g, x + 2, y + 4, fw - 4, fh - 6, "#3e3a44"); R(g, x + 4, y + 6, fw - 8, 1, "#55505c"); } };
      case "foodBowl": return { sortY: y + fh - 4, draw: (g) => {
        const b = LPK.game && LPK.game.bowls && LPK.game.bowls[f.id];
        const cols = f.owner === "marshmallow" ? ["#ff8ab0"] : ["#6a9ae8", "#e8954a"];
        cols.forEach((c, i) => {
          const bx = x + 2 + i * 9;
          E(g, bx + 4, y + 11, 5, 2, c); R(g, bx, y + 10, 9, 2, c);
          R(g, bx + 1, y + 9, 7, 1, b && b.food ? LPK.foods[b.food].color : "#5a4a3a");
        });
        if (f.owner === "marshmallow") R(g, x + 3, y + 14, 6, 1, "#ffffff");      // "her" bowl label
      } };
      case "ceilingLight": return { sortY: -2, draw: () => {} };
      case "captainBed": return { sortY: y + fh, draw: (g) => {
        // dark-wood captain's bed with storage drawers, white sheets, gray blanket
        R(g, x, y - 2, fw, fh + 2, "#3a2620");
        R(g, x + 2, y - 2, fw - 4, fh - 12, "#eeeef2");
        for (let i = 0; i < 14; i++) R(g, x + 6 + (i * 13) % (fw - 10), y + 2 + (i * 7) % (fh - 18), 2, 1, "#a8b0a0");  // little sheet pattern
        R(g, x + 10, y + 6, 46, 10, "#55555e"); R(g, x + 14, y + 4, 30, 4, "#6a6a74");                 // gray blanket
        R(g, x + 4, y + 1, 12, 7, "#d8d8dc");                                                          // pillow
        R(g, x, y + fh - 10, fw, 10, "#2e1e18");
        for (let i = 0; i < 3; i++) { R(g, x + 3 + i * 26, y + fh - 8, 22, 6, "#4a3228"); R(g, x + 12 + i * 26, y + fh - 6, 4, 1, "#c8a080"); }
        R(g, x + 30, y + fh - 4, 8, 4, "#f2f0f0");                                                     // clothes in a drawer
      } };
      case "darkDresser": return { sortY: y + fh, draw: (g) => {
        R(g, x, y - 18, fw, fh + 18, "#3a2620"); R(g, x, y - 18, fw, 2, "#4e342a");
        for (let i = 0; i < 3; i++) R(g, x + 2, y - 14 + i * 9, fw - 4, 7, "#4a3228");
        R(g, x - 3, y - 5, 6, 7, "#c8a070");                                                           // a drawer pulled open
        R(g, x + 3, y - 30, 6, 8, "#f4f2ea"); R(g, x + 5, y - 22, 2, 4, "#3a7a3a");                    // lamp
        E(g, x + 22, y - 22, 4, 3, "#e03a3a"); R(g, x + 20, y - 26, 2, 2, "#e03a3a");                  // red piggy bank
      } };
      case "cubeBoxes": return { sortY: y + fh, draw: (g) => {
        R(g, x + 2, y - 4, 12, 10, "#e8c040"); R(g, x + 2, y - 16, 12, 12, "#f4c8d8");
        R(g, x + 5, y - 11, 1, 1, "#2a2a2a"); R(g, x + 10, y - 11, 1, 1, "#2a2a2a"); R(g, x + 7, y - 9, 2, 1, "#e86a8a");
      } };
      case "shirtChair": return { sortY: y + fh, draw: (g) => {
        R(g, x, y - 8, fw, 14, "#7a7a80"); R(g, x + 2, y + 6, 2, 8, "#5a3a26"); R(g, x + fw - 4, y + 6, 2, 8, "#5a3a26");
        R(g, x - 4, y - 10, fw + 6, 10, "#8a8ac0"); R(g, x - 2, y - 6, 10, 6, "#f2f0f0"); R(g, x + 6, y - 12, 10, 6, "#2a2e48");   // pile of dress shirts
        for (let i = 0; i < 4; i++) R(g, x - 3 + i * 4, y - 9, 1, 8, "#c0c0e0");
      } };
      case "openCloset": return { sortY: y + fh, draw: (g) => {
        // open closet: a plain open rectangle with Robert's gingham dress shirts and plushies piled below
        R(g, x - 2, y - 28, fw + 4, fh + 28, "#f2efe9");
        R(g, x, y - 26, fw, fh + 26, "#3a3440");
        R(g, x + 2, y - 22, fw - 4, 1, "#c8c8c8");
        for (let i = 0; i < 6; i++) { R(g, x + 4 + i * 9, y - 22, 6, 2, "#d8d8dc"); R(g, x + 3 + i * 9, y - 20, 8, 14, i % 2 ? "#a8a8e8" : "#c8b8f0"); }
        for (let i = 0; i < 7; i++) E(g, x + 6 + i * 8, y + 8 - (i % 2) * 3, 4, 4, ["#f4f4f4", "#e8c040", "#c84a3a", "#8ad8c8", "#f4b8a0"][i % 5]);
      } };
      case "smallDesk": return { sortY: y + fh, draw: (g) => {
        R(g, x, y - 6, fw, 6, "#4a3228"); R(g, x, y - 6, fw, 1, "#5e4234");
        R(g, x + 2, y, 3, fh, "#3a2620"); R(g, x + fw - 5, y, 3, fh, "#3a2620");
        R(g, x + 6, y - 10, 8, 5, "#e8c040"); R(g, x + 18, y - 9, 6, 4, "#4a8ae8");      // books + pencil cup
      } };
      case "workDesk": return { sortY: y + fh, draw: (g) => {
        // Laura's white desk: two monitors, pastel keyboard, cloud wrist rest, coffee mug
        const desk = (LPK.game && LPK.game.desk) || {}, sc = desk.screen || "idle", tt = LPK.game ? LPK.game.time : 0;
        R(g, x, y - 6, fw, fh + 6, "#f4f4f2"); R(g, x, y - 6, fw, 2, "#ffffff"); R(g, x + 2, y + 4, 10, fh - 4, "#e4e4e2");
        R(g, x + 26, y - 10, 34, 4, "#f4f4f2");                                                              // monitor riser
        for (let i = 0; i < 2; i++) {
          const mx = x + 14 + i * 22;
          R(g, mx, y - 28, 20, 14, "#141418");
          const scr = sc === "idle" ? "#1a1a24" : sc === "nonsense" ? "#f2f2f2" : sc === "call" ? "#2a4a6a" : "#e8eef4";
          R(g, mx + 1, y - 27, 18, 12, scr);
          if (sc === "email") for (let k = 0; k < 4; k++) R(g, mx + 3, y - 25 + k * 3, 6 + ((k * 5 + Math.floor(tt * 4)) % 10), 1, "#6a7a8a");
          if (sc === "nonsense") for (let k = 0; k < 5; k++) R(g, mx + 2, y - 26 + k * 2, 16, 1, k % 2 ? "#2a2a2a" : "#5a5a5a");
          if (sc === "call") { E(g, mx + 9, y - 22, 3, 3, "#f2c8a6"); R(g, mx + 5, y - 18, 8, 3, "#3a6a9a"); }
          R(g, mx + 9, y - 14, 2, 4, "#2a2a2e");
        }
        R(g, x + 22, y - 3, 22, 4, "#f4c8a8"); for (let k = 0; k < 6; k++) R(g, x + 23 + k * 3, y - 2, 2, 1, "#e89a7a");   // pastel keyboard
        R(g, x + 46, y - 3, 8, 4, "#f0e4f4"); E(g, x + 50, y - 4, 2, 1, "#2a2a2e");                                 // cloud rest + mouse
        R(g, x + 15, y - 4, 4, 3, "#f2e050");                                                                    // sticky note
        const cof = desk.coffee || "full";
        if (cof === "spilled") { E(g, x + 9, y - 2, 6, 2, "#6a3a1a"); R(g, x + 4, y - 4, 6, 3, "#f4f2ee"); }
        else { R(g, x + 6, y - 9, 5, 6, "#f4f2ee"); R(g, x + 11, y - 7, 2, 3, "#f4f2ee"); R(g, x + 7, y - 9, 3, 1, cof === "sipped" ? "#c8a888" : "#6a3a1a"); }
      } };
      case "officeChair": return { sortY: y + 12, draw: (g) => {
        R(g, x + 1, y - 10, 14, 16, "#f2ecdc"); R(g, x + 2, y - 8, 12, 2, "#e4dcc8");            // white leather back (faces the desk)
        R(g, x - 1, y + 2, 3, 6, "#1e1e22"); R(g, x + 14, y + 2, 3, 6, "#1e1e22");
        R(g, x + 6, y + 8, 4, 4, "#1e1e22"); R(g, x + 1, y + 12, 14, 2, "#1e1e22");
      } };
      case "bigBed": return { sortY: y + fh, draw: (g) => {
        // huge bed, yellow floral comforter, white sheets; white bookcase headboard on the right
        R(g, x, y, fw, fh, "#f4f4f6");
        R(g, x, y + 2, fw - 22, fh - 4, "#f2d050");
        for (let i = 0; i < 26; i++) R(g, x + 3 + (i * 11) % (fw - 28), y + 5 + (i * 7) % (fh - 10), 2, 2, "#fff4c8");   // floral
        R(g, x + 10, y + 14, 30, 3, "#e8c040"); R(g, x + 20, y + 40, 26, 3, "#e8c040");                                 // rumples
        R(g, x + fw - 20, y + 6, 12, 26, "#ece4d8"); R(g, x + fw - 20, y + 40, 12, 26, "#ece4d8");                       // pillows
        R(g, x + fw - 6, y - 10, 8, fh + 10, "#f4f2ee"); for (let i = 0; i < 4; i++) R(g, x + fw - 5, y - 6 + i * 20, 6, 8, "#d8d4cc");   // bookcase headboard
        R(g, x, y + fh - 6, fw, 6, "#7a7a80");
        R(g, x + 30, y + 44, 14, 8, "#f8c8e8");                                                                         // little blanket
      } };
      case "nightstand": return { sortY: y + fh, draw: (g) => {
        R(g, x + 1, y - 8, 14, 16, "#f4f2ee"); R(g, x + 3, y - 4, 10, 5, "#e8e4de"); R(g, x + 3, y + 2, 10, 5, "#e8e4de");
        R(g, x + 3, y + 8, 2, 6, "#c8a070"); R(g, x + 11, y + 8, 2, 6, "#c8a070");
        R(g, x + 3, y - 12, 8, 4, "#1e1e22"); R(g, x + 4, y - 11, 6, 2, "#ff3a3a");                       // red alarm clock
        R(g, x + 9, y - 26, 6, 6, "#f4f2ee"); R(g, x + 11, y - 20, 2, 8, "#f4f2ee");                       // lamp
      } };
      case "tvDresser": return { sortY: y + fh, draw: (g) => {
        // big white dresser (drawers open, clothes spilling) with the TV on top angled toward the bed
        R(g, x, y - 18, fw, fh + 18, "#f4f4f2"); R(g, x, y - 18, fw, 2, "#ffffff");
        for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) { const dx = x + 2 + k * (fw / 2), dy = y - 14 + i * 9; R(g, dx, dy, fw / 2 - 4, 7, "#e6e6e4"); R(g, dx + fw / 4 - 4, dy + 2, 4, 2, "#1e1e22"); }
        R(g, x + 6, y - 5, 10, 8, "#1e1e22"); R(g, x + 40, y + 3, 8, 6, "#3a3a4a");
        // TV, angled: a slanted dark panel
        g.fillStyle = "#121216"; g.beginPath(); g.moveTo(x + 22, y - 44); g.lineTo(x + 52, y - 38); g.lineTo(x + 52, y - 20); g.lineTo(x + 22, y - 22); g.fill();
        g.fillStyle = `hsl(${(LPK.game ? LPK.game.time * 10 : 0) % 360},40%,45%)`; g.beginPath(); g.moveTo(x + 24, y - 42); g.lineTo(x + 50, y - 37); g.lineTo(x + 50, y - 22); g.lineTo(x + 24, y - 24); g.fill();
        R(g, x + 34, y - 21, 6, 3, "#1e1e22");
      } };
      case "laundryBasket": return { sortY: y + fh, draw: (g) => {
        R(g, x, y - 2, 16, 12, "#f4f2f6"); for (let i = 0; i < 4; i++) R(g, x + 2 + i * 4, y + 2, 2, 6, "#d8d4dc");
        R(g, x - 1, y - 6, 18, 6, "#3a5ab8"); R(g, x + 4, y - 8, 8, 4, "#5a8a4a"); R(g, x + 10, y - 7, 5, 3, "#f4c8d8");
      } };
      case "toilet": return { sortY: y + fh, draw: (g) => {
        R(g, x + 3, y - 10, 10, 8, "#f4f4f6"); E(g, x + 8, y + 3, 6, 5, "#f4f4f6"); E(g, x + 8, y + 3, 4, 3, "#dcdce4"); R(g, x + 5, y + 7, 6, 5, "#ececf0");
      } };
      case "vanity": return { sortY: y + fh, draw: (g) => {
        // bathroom vanity: light wood + black counter (en-suite) or white + gray counter (hall bath)
        const wood = f.style !== "white", body = wood ? "#d8bc8e" : "#f2f0f2", top = wood ? "#1e1e22" : "#b8b4b8";
        R(g, x, y - 8, fw, fh + 8, body); R(g, x - 1, y - 10, fw + 2, 4, top);
        for (let i = 0; i < Math.floor(fh / 10); i++) R(g, x + 2, y - 4 + i * 10, fw - 4, 8, wood ? "#e4cca0" : "#e6e4e8");
        E(g, x + fw / 2, y - 8, 5, 2, "#f4f4f6");                                                                       // sink
        [["#3a8ae8", 2], ["#e8742a", 6], ["#4ac06a", 10], ["#f4f4f4", fw - 6]].forEach(([c, dx]) => R(g, x + dx, y - 16, 3, 6, c));   // bottles
        if (wood) { E(g, x + 4, y - 22, 4, 4, "#c8ccd4"); E(g, x + 4, y - 22, 3, 3, "#e4eef4"); }                     // round mirror
      } };
      case "bathtub": return { sortY: y + fh, draw: (g) => {
        R(g, x, y, fw, fh, "#f2f0f4"); R(g, x + 3, y + 3, fw - 6, fh - 8, "#dcdce6"); R(g, x, y + fh - 4, fw, 4, "#e4e2e8");
        R(g, x + fw - 12, y - 4, 6, 4, "#c8ccd4");                                                                    // faucet
        R(g, x + fw - 14, y + fh - 2, 6, 10, "#f4f4f4"); R(g, x + fw - 13, y + fh - 4, 3, 2, "#c8a050");             // lotion bottle
      } };
      case "toyPile": return { sortY: -1, draw: (g) => { R(g, x + 3, y + 8, 9, 3, "#d8402a"); R(g, x + 5, y + 6, 5, 2, "#f06a4a"); } };
      case "kidBed": return { sortY: y + fh, draw: (g) => {
        // low bed, pink comforter, pillows, orange/blue blanket, blue LED strip glowing underneath
        R(g, x - 2, y + fh - 4, fw + 4, 6, "rgba(80,190,255,0.55)"); R(g, x, y + fh - 2, fw, 2, "#5ad8ff");
        R(g, x, y + 2, fw, fh - 6, "#d86aa8"); R(g, x, y + fh - 10, fw, 6, "#b8508c");
        R(g, x + 4, y - 4, 22, 10, "#f2e0c8"); R(g, x + 28, y - 2, 16, 9, "#e8c8d8");                   // pillows
        R(g, x + 2, y + 8, 18, 10, "#e8742a"); R(g, x + 4, y + 10, 12, 4, "#3a5ab8");                     // orange + blue blanket
        for (let i = 0; i < 4; i++) R(g, x + 10 + i * 14, y + 22 + (i % 2) * 6, 10, 1, "#c45a96");      // rumpled comforter
      } };
      case "whiteDresser": return { sortY: y + fh, draw: (g) => {
        R(g, x, y - 10, fw, fh + 10, "#f2eef2"); R(g, x, y - 12, fw, 3, "#1e1e24");                         // black top
        for (let i = 0; i < 3; i++) { const dy = y - 4 + i * 14; R(g, x + 2, dy, fw - 4, 12, "#e4e0e6"); R(g, x + fw / 2 - 3, dy + 3, 6, 2, "#1e1e24"); }
        R(g, x + 6, y, 10, 14, "#2e3e7a"); R(g, x + 16, y + 16, 8, 10, "#3a3a3a");                         // clothes hanging out
        R(g, x + 4, y - 18, 10, 6, "#c8b0d8"); R(g, x + 18, y - 16, 6, 4, "#e8d040");                     // stuff on top
      } };
      case "clutter": return { sortY: -1, draw: (g) => {
        const v = f.variant || 0;
        if (v === 0) { R(g, x + 2, y + 6, 18, 8, "#e86aa8"); R(g, x + 6, y + 4, 10, 4, "#f2c8e0"); R(g, x + 10, y + 12, 6, 3, "#e8a040"); }
        if (v === 1) { R(g, x + 4, y + 8, 14, 10, "#f0d8e8"); R(g, x + 16, y + 4, 8, 6, "#8a5aa8"); }
        if (v === 2) { R(g, x + 3, y + 6, 4, 3, "#f4f4f4"); R(g, x + 14, y + 12, 4, 3, "#f4f4f4"); R(g, x + 22, y + 4, 4, 3, "#f8e0e8"); }
      } };
      case "roundPlush": return { sortY: y + fh, draw: (g) => { E(g, x + 8, y + 8, 9, 7, "#f2b07a"); E(g, x + 6, y + 5, 4, 2, "#f8d0a8"); } };
      case "purplePlush": return { sortY: y + fh, draw: (g) => { E(g, x + 8, y + 10, 6, 5, "#b04ad8"); E(g, x + 8, y + 2, 5, 5, "#c060e8"); R(g, x + 6, y + 1, 1, 1, "#2a2a2a"); R(g, x + 9, y + 1, 1, 1, "#2a2a2a"); } };
      case "fatCatMat": return { sortY: -1, draw: (g) => {
        // white tile patch + "WARNING: FAT CAT SECURITY — Trespassers will be Eaten!!!" mat
        R(g, x, y, fw, fh, "#eeeeea");
        for (let i = 0; i < 4; i++) { R(g, x + i * 8, y, 1, fh, "#c8c8c2"); } R(g, x, y + 8, fw, 1, "#c8c8c2");
        R(g, x + 2, y + 2, fw - 4, fh - 4, "#e8dcc8"); R(g, x + 2, y + 2, fw - 4, 1, "#3a2a2a");
        R(g, x + 3, y + 3, 10, 3, "#b83a3a"); R(g, x + 3, y + 10, fw - 6, 2, "#b83a3a");    // WARNING + red band
        E(g, x + 22, y + 7, 5, 3, "#f8f8f4"); R(g, x + 19, y + 4, 2, 2, "#f8f8f4"); R(g, x + 24, y + 4, 2, 2, "#f8f8f4"); // fat cat
        R(g, x + 20, y + 6, 1, 1, "#2a2a2a"); R(g, x + 23, y + 6, 1, 1, "#2a2a2a");
      } };
      case "clownSwitch": return { sortY: y + fh, draw: (g) => {
        // the clown's trigger: board, gray box with red switch, yellow conduit, white base, red bulb
        const on = LPK.game && LPK.game.clown && LPK.game.clown.t > 0;
        R(g, x - 3, y + 6, 22, 9, "#4a4650"); R(g, x - 3, y + 6, 22, 1, "#5e5a66");
        R(g, x - 2, y + 2, 7, 8, "#8e8c88"); R(g, x - 2, y + 2, 7, 1, "#a8a6a2");
        R(g, x + 1, y + 4 + (on ? 1 : 0), 2, 2, "#c8303a");                                 // red toggle
        R(g, x + 5, y + 8, 5, 2, "#d8cf7a"); R(g, x + 9, y + 9, 2, 2, "#d8cf7a");            // conduit
        E(g, x + 14, y + 10, 4, 2, "#e2e0dc"); R(g, x + 12, y + 7, 4, 3, "#d8d6d2");          // white base
        E(g, x + 14, y + 5, 3, 3, on ? "#ff4a4a" : "#c8303a"); R(g, x + 13, y + 3, 1, 1, "#ffb0b0");
      } };
      case "metalShelves": return { sortY: y + fh, draw: (g) => {
        R(g, x, y - 26, 2, fh + 26, "#6a6a70"); R(g, x + fw - 2, y - 26, 2, fh + 26, "#6a6a70");
        for (let i = 0; i < 4; i++) {
          const sy = y - 26 + i * 10; R(g, x, sy, fw, 2, "#8a8a90");
          for (let k = 0; k < Math.floor(fw / 12); k++) R(g, x + 3 + k * 12, sy - 6, 9, 6, ["#c8a070", "#5a8ac8", "#d86a5a", "#8ab86a"][(i + k) % 4]);
        }
      } };
      case "workbench": return { sortY: y + fh, draw: (g) => {
        R(g, x, y - 8, fw, 4, "#a87a4a"); R(g, x + 2, y - 4, 3, fh + 4, "#7a5a3a"); R(g, x + fw - 5, y - 4, 3, fh + 4, "#7a5a3a");
        R(g, x + 8, y - 12, 10, 4, "#c84040"); R(g, x + 30, y - 11, 14, 3, "#5a5a60");
      } };
      case "storageBoxes": return { sortY: y + fh, draw: (g) => {
        for (let i = 0; i < f.w; i++) {
          const bx = x + i * T, h = 12 + (i % 2) * 6;
          R(g, bx + 1, y + fh - h, T - 2, h, "#b8905a"); R(g, bx + 1, y + fh - h, T - 2, 2, "#a07a48");
          if (f.halloween) { R(g, bx + 3, y + fh - h + 4, T - 6, 4, "#e87a2a"); R(g, bx + 4, y + fh - h + 5, T - 8, 1, "#2a2a2a"); }
        }
        if (f.halloween) R(g, x + 2, y + fh - 26, T * 1.4, 8, "#2a2a2e");                   // the clown's big black box
      } };
      case "rollCart": return { sortY: y + fh, draw: (g) => {
        R(g, x + 1, y - 10, 14, 24, f.color); R(g, x, y - 12, 16, 3, f.color); R(g, x + 1, y - 9, 14, 1, "rgba(255,255,255,0.25)");
        E(g, x + 4, y + 14, 2, 2, "#1a1a1e"); E(g, x + 12, y + 14, 2, 2, "#1a1a1e");
      } };
      case "oilStain": return { sortY: -1, draw: (g) => { E(g, x + fw / 2, y + fh / 2, fw / 2 - 4, fh / 2 - 6, "rgba(60,58,56,0.25)"); } };
      case "oldCouch": return { sortY: y + fh, draw: (g) => {
        R(g, x, y - 8, fw, 12, "#6a4a3a"); R(g, x, y + 4, fw, fh - 12, "#7a5a48"); R(g, x, y + fh - 8, fw, 8, "#5a3e30");
        for (let i = 1; i < 3; i++) R(g, x + (fw / 3) * i, y + 4, 1, fh - 12, "#6a4a3a");
        R(g, x - 3, y - 4, 4, fh + 4, "#5a3e30"); R(g, x + fw - 1, y - 4, 4, fh + 4, "#5a3e30");
      } };
      case "hangingBulb": return { sortY: -2, draw: () => {} };
      case "tvCabinet": return { sortY: y + fh, draw: (g) => {
        R(g, x, y - 6, fw, fh + 6, "#8e8a86"); R(g, x, y - 6, fw, 2, "#a8a49f");
        R(g, x + 3, y - 2, fw / 2 - 5, fh - 2, "#7a7672"); R(g, x + fw / 2 + 2, y - 2, fw / 2 - 5, fh - 2, "#7a7672");
      } };
      case "brickFireplace": return { sortY: y + fh, draw: (g) => {
        // light brick fireplace with black glass doors and a white mantel
        R(g, x, y - 26, fw, fh + 26, "#d8d4ce");
        for (let yy = y - 24, row = 0; yy < y + fh; yy += 4, row++) {
          R(g, x, yy, fw, 1, "#c4bfb8");
          for (let xx = x + (row % 2) * 4; xx < x + fw; xx += 8) R(g, xx, yy, 1, 4, "#bdb8b0");
        }
        R(g, x - 3, y - 30, fw + 6, 4, "#f4f2ee");                                    // mantel
        R(g, x + 6, y - 35, 4, 5, "#e8954a"); R(g, x + 30, y - 36, 6, 6, "#2e2a28"); R(g, x + 70, y - 34, 4, 4, "#e8954a"); // pumpkins + frame
        const fx = x + fw / 2 - 18;
        R(g, fx, y - 20, 36, 22, "#1a1716"); R(g, fx + 2, y - 18, 32, 18, "#2a2624");
        for (let i = 0; i < 4; i++) { const fl = 4 + Math.round((Math.sin(t * 8 + i * 1.7) + 1) * 2); R(g, fx + 5 + i * 7, y - fl, 4, fl, "#e07a2a"); R(g, fx + 6 + i * 7, y - fl / 2, 2, fl / 2, "#ffd34d"); }
        R(g, fx + 17, y - 20, 2, 22, "#3a3634");
        R(g, x - 4, y + 2, fw + 8, 6, "#e2ded8");                                   // hearth
        R(g, x + 4, y + 2, 20, 6, "#6a4a30"); R(g, x + 6, y + 3, 16, 3, "#f2e6d6");   // "Let's stay home" sign
      } };
      case "pinkChair": return { sortY: y + fh, draw: (g) => {
        R(g, x + 2, y - 16, fw - 4, 22, "#c9707e"); R(g, x + 2, y - 16, fw - 4, 2, "#d88a96");   // wingback
        R(g, x - 2, y - 6, 6, 18, "#bb6070"); R(g, x + fw - 4, y - 6, 6, 18, "#bb6070");           // wings / arms
        R(g, x + 4, y + 4, fw - 8, 10, "#d47e8c"); R(g, x + 2, y + 14, fw - 4, 8, "#bb6070");
        R(g, x + 3, y + 22, 3, 8, "#5a3a26"); R(g, x + fw - 6, y + 22, 3, 8, "#5a3a26");
      } };
      case "darkCatTower": return { sortY: y + fh, draw: (g) => {
        R(g, x + 1, y + fh - 4, fw - 2, 4, "#2e2a2e");
        R(g, x + 6, y - 44, 4, fh + 42, "#3a3438");
        for (let i = 0; i < 10; i++) R(g, x + 6, y - 42 + i * 8, 4, 1, "#4a4448");
        R(g, x - 6, y - 46, fw + 8, 5, "#2e2a2e"); R(g, x - 4, y - 16, fw + 6, 5, "#2e2a2e"); R(g, x - 2, y + 8, fw + 4, 4, "#2e2a2e");
        E(g, x + 8, y - 26, 7, 5, "#2e2a2e"); E(g, x + 8, y - 26, 4, 3, "#151215");
      } };
      case "clown": return { sortY: y + fh, draw: (g) => {
        // life-size clown decoration — comes alive when Laura flips its switch:
        // head turns, eyes glow, the mask splits open, it talks, then closes again
        const c = LPK.game && LPK.game.clown, e = c ? c.total - c.t : -1, C = LPK.CLOWN;
        let turn = 0, glow = false, split = 0, mouth = 0, jaw = 0, pulse = 0;
        // animatronic mouth: stepped open/shut flaps with little pauses
        const flap = (sp) => { const k = Math.floor(e * sp); return k % 5 === 4 ? 0 : [0, 1, 2, 1][k % 4]; };
        if (c) {
          if (e >= C.turn) { turn = e < C.talk1 ? 1 : 2; glow = true; }
          if (e >= C.talk1 && e < C.split) mouth = flap(7);
          if (e >= C.split && e < C.evil) split = Math.min(8, Math.round((e - C.split) / (C.evil - C.split) * 8));
          if (e >= C.evil && e < C.close) { split = 8; jaw = [0, 1, 3, 3, 2, 0, 3, 1][Math.floor(e * 8) % 8]; pulse = Math.floor(e * 4) % 2; }
          if (e >= C.close && e < C.shut) split = Math.round((C.shut - e) / (C.shut - C.close) * 8);
          if (e >= C.shut) { turn = 1; glow = false; }
        }
        LPK.px.draw(g, LPK.sprites.clown({ turn, glow, split, mouth, jaw, pulse }), x + 8, y + fh - 1, false);
        if (c) for (let i = 0; i < 3; i++) {                     // calliope music notes
          const p = ((e * 0.8 + i * 0.33) % 1);
          R(g, x + 22 + i * 4, y + fh - 58 - p * 14, 2, 2, `rgba(255,209,102,${1 - p})`); R(g, x + 23 + i * 4, y + fh - 62 - p * 14, 1, 4, `rgba(255,209,102,${1 - p})`);
        }
      } };
      case "snowmanRug": return { sortY: -1, draw: (g) => {
        E(g, x + fw / 2, y + fh / 2, fw / 2, fh / 2 - 2, "#f2f0ec");
        for (let i = 0; i < 6; i++) R(g, x + 6 + i * 4, y + fh / 2 + 3 + Math.round(Math.sin(i / 1.6) * 2), 2, 2, "#2a2a2a");
        R(g, x + 9, y + fh / 2 - 6, 2, 2, "#2a2a2a"); R(g, x + 21, y + fh / 2 - 6, 2, 2, "#2a2a2a");
        R(g, x + 13, y + fh / 2 - 2, 7, 2, "#e8743a");
      } };
      case "catIgloo": return { sortY: y + fh - 12, draw: (g) => {
        E(g, x + fw / 2, y + 6, 14, 11, "#f4f2ee"); R(g, x + 2, y + 12, fw - 4, 4, "#e2ded8");
        E(g, x + fw / 2, y + 10, 7, 6, "#3a3236");
      } };
      case "tvTray": return { sortY: y + fh, draw: (g) => {
        R(g, x + 1, y - 2, 14, 4, "#c8955a"); R(g, x + 3, y + 2, 2, 12, "#a8763e"); R(g, x + 11, y + 2, 2, 12, "#a8763e");
        R(g, x + 4, y + 7, 8, 1, "#a8763e");
      } };
      default: return { sortY: y + fh, draw: (g) => R(g, x, y, fw, fh, "#a77") };
    }
  }

  // Night lighting overlay + lamp glows.
  function drawLighting(g, w, darkness, t) {
    if (darkness <= 0.01) return;
    g.fillStyle = `rgba(18,14,48,${darkness})`;
    g.fillRect(0, 0, w.width, w.height);
    g.globalCompositeOperation = "lighter";
    const glow = (x, y, r, col, a) => {
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, col.replace("A", a)); grd.addColorStop(1, col.replace("A", 0));
      g.fillStyle = grd; g.fillRect(x - r, y - r, r * 2, r * 2);
    };
    const T = w.T;
    for (const f of w.def.furniture) if (f.light) {
      if (f.light === "led") { glow(f.x * T + f.w * 8, (f.y + f.h) * T, 70, "rgba(80,190,255,A)", 0.4 + darkness * 0.5); continue; }
      const ceiling = f.kind === "ceilingLight" || f.kind === "hangingBulb";
      glow(f.x * T + 8, ceiling ? f.y * T : f.y * T - 20, ceiling ? 120 : 70, "rgba(255,210,140,A)", darkness * (f.kind === "hangingBulb" ? 1.2 : 0.8));
    }
    const tv = w.def.wallDecor.find(d => d.kind === "tv");
    if (tv) glow(tv.x * T + tv.w * T / 2, 40, 60, "rgba(120,170,255,A)", darkness * 0.45);
    if (tv) glow(w.T * 3.5, w.def.wallRows * T + 2, 26, "rgba(255,140,60,A)", darkness * 0.6);      // fireplace
    if (w.def.furniture.some(f => f.kind === "brickFireplace")) glow(10 * T, 3 * T, 70, "rgba(255,140,60,A)", darkness * 0.7);
    const kd = w.def.wallDecor.find(d => d.kind === "hallwayDoor");
    if (kd) glow(kd.x * T + kd.w * T / 2, 30, 40, "rgba(200,90,255,A)", darkness * 0.6);
    g.globalCompositeOperation = "source-over";
  }

  // CC's spring toys: a little coiled spring
  function drawSpring(g, x, y, colors, t, bounce) {
    const by = Math.round(y - Math.abs(Math.sin(t * 10)) * (bounce || 0));
    for (let i = 0; i < 5; i++) {
      const c = colors[i % colors.length];
      R(g, x - 3 + i, by - 6 + (i % 2), 2, 6, c);
    }
    R(g, x - 4, by - 1, 9, 1, "rgba(0,0,0,0.2)");
  }

  return { drawFloor, drawWalls, furnitureDraw, drawLighting, drawSpring };
})();
