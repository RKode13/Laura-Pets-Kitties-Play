// User interface: menus, HUD, Purr Meter, speech bubbles, touch controls.
// Drawn in screen (CSS) pixels on top of the pixel-art world.
window.LPK = window.LPK || {};

LPK.ui = (() => {
  const C = { panel: "rgba(38,22,66,0.93)", panel2: "rgba(58,36,96,0.95)", border: "#e8b04a", text: "#fff6e8",
    dim: "#bfaed8", pink: "#ff7aa8", gold: "#ffd166", green: "#7ed99a", ink: "#2b2232" };
  let ctx, W, H, u, G;
  const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

  // ------------------------------------------------------------ helpers
  function rr(x, y, w, h, r, fill, stroke, lw = 2) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }
  function text(s, x, y, size, color = C.text, align = "left", weight = "bold", base = "middle") {
    ctx.font = `${weight} ${Math.round(size)}px ${FONT}`;
    ctx.textAlign = align; ctx.textBaseline = base; ctx.fillStyle = color; ctx.fillText(s, x, y);
  }
  function outlined(s, x, y, size, fill, stroke) {
    ctx.font = `bold ${Math.round(size)}px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.lineJoin = "round"; ctx.lineWidth = size / 5; ctx.strokeStyle = stroke; ctx.strokeText(s, x, y);
    ctx.fillStyle = fill; ctx.fillText(s, x, y);
  }
  function wrap(s, maxW, size, weight = "normal") {
    ctx.font = `${weight} ${Math.round(size)}px ${FONT}`;
    const out = []; let line = "";
    for (const w of s.split(" ")) {
      if (ctx.measureText(line + w).width > maxW && line) { out.push(line.trim()); line = ""; }
      line += w + " ";
    }
    if (line.trim()) out.push(line.trim());
    return out;
  }
  function panel(x, y, w, h) { rr(x, y, w, h, 12, C.panel, C.border, 2); }
  function bar(x, y, w, h, frac, color) {
    rr(x, y, w, h, h / 2, "rgba(255,255,255,0.15)");
    if (frac > 0) rr(x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2, color);
  }
  // A clickable button. Registered for mouse/touch and keyboard navigation.
  function button(label, x, y, w, h, action, opt = {}) {
    const idx = G.ui.items.length, enabled = opt.enabled !== false;
    const sel = opt.nav !== false && idx === G.ui.sel && enabled;
    if (opt.nav !== false) G.ui.items.push({ action, enabled });
    rr(x, y + 3, w, h, 10, "rgba(0,0,0,0.3)");
    rr(x, y, w, h, 10, !enabled ? "#4a3f5c" : sel ? C.pink : (opt.color || "#6c4fa8"), sel ? C.gold : null, 3);
    text(label, x + w / 2, y + h / 2 + 1, opt.size || Math.min(h * 0.42, u * 1.15), enabled ? "#fff" : "#9a8fb0", "center");
    if (enabled) G.ui.buttons.push({ x, y, w, h, action });
  }
  // Draw a pixel sprite enlarged on the UI (portraits, celebration).
  const spriteCanvas = document.createElement("canvas");
  function sprite(shapes, cx, by, scale, flip) {
    spriteCanvas.width = 80; spriteCanvas.height = 60;
    const g = spriteCanvas.getContext("2d");
    g.clearRect(0, 0, 80, 60);
    LPK.px.draw(g, shapes, 40, 56, flip);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(spriteCanvas, cx - 40 * scale, by - 56 * scale, 80 * scale, 60 * scale);
  }
  // Speech / thought bubble. topLimit = bottom of the HUD panels at the top of the
  // screen; if the bubble would end up under them, it flips below the speaker (footY).
  function bubble(s, sx, sy, kind = "speech", footY = null, topLimit = 4) {
    const size = Math.max(11, u * 0.9);
    const lines = wrap(s, Math.min(220, W * 0.45), size, "bold");
    ctx.font = `bold ${Math.round(size)}px ${FONT}`;
    const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 16, h = lines.length * size * 1.25 + 10;
    let x = Math.max(6, Math.min(W - w - 6, sx - w / 2)), y = sy - h - 12;
    const below = y < topLimit && footY !== null;
    if (below) y = Math.min(footY + 12, H - h - 6);
    else if (y < 4) y = 4;
    const fill = kind === "thought" ? "#fff4f6" : "#ffffff";
    rr(x, y, w, h, kind === "thought" ? h / 2 : 8, fill, kind === "thought" ? "#c86a8a" : C.ink, 2);
    if (below) {
      // little tail pointing up at the speaker
      ctx.beginPath(); ctx.moveTo(sx - 6, y + 1); ctx.lineTo(sx, y - 8); ctx.lineTo(sx + 6, y + 1);
      ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = kind === "thought" ? "#c86a8a" : C.ink; ctx.stroke();
      ctx.fillRect(sx - 5, y, 10, 3);
    } else if (kind === "thought") {
      [[0, 6, 5], [5, 13, 3]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(sx - 4 + dx, y + h + dy - 2, r, 0, 7); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = "#c86a8a"; ctx.stroke(); });
    } else {
      ctx.beginPath(); ctx.moveTo(sx - 6, y + h - 1); ctx.lineTo(sx, y + h + 8); ctx.lineTo(sx + 6, y + h - 1);
      ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = C.ink; ctx.stroke();
      ctx.fillRect(sx - 5, y + h - 3, 10, 3);
    }
    lines.forEach((l, i) => text(l, x + w / 2, y + 5 + size * 0.62 + i * size * 1.25, size, kind === "thought" ? "#8a2a4a" : C.ink, "center"));
  }

  // ------------------------------------------------------------ screens
  function overlay(a = 0.6) { ctx.fillStyle = `rgba(20,10,35,${a})`; ctx.fillRect(0, 0, W, H); }

  function logo(cy, size) {
    outlined("Laura Pets", W / 2, cy, size, C.gold, "#6a2a55");
    outlined("Kitties", W / 2, cy + size * 1.02, size, "#ffb3cf", "#6a2a55");
  }

  function drawTitle() {
    overlay(0.55);
    const size = Math.min(W / 9, H / 7.5, 72);
    logo(H * 0.17, size);
    text("Three kitties. Three personalities. One Laura. Unlimited purrs.", W / 2, H * 0.17 + size * 1.75, Math.max(11, u * 0.85), C.dim, "center", "normal");
    const s = LPK.save.data;
    const bw = Math.min(320, W * 0.7), bh = Math.min(44, H / 12), x = W / 2 - bw / 2;
    let y = H * 0.17 + size * 2.15;
    const gap = bh + Math.max(6, H / 70);
    const startLabel = G.ui.confirmStart ? "Start over? Tap again" : "Start Game";
    button(startLabel, x, y, bw, bh, () => {
      if (s.hasGame && !G.ui.confirmStart) { G.ui.confirmStart = true; return; }
      G.ui.confirmStart = false; G.newGame();
    }); y += gap;
    button("Continue", x, y, bw, bh, () => G.continueGame(), { enabled: !!s.hasGame }); y += gap;
    if (s.freePlay) button("Free Play", x, y, bw, bh, () => G.startFreePlay(), { color: "#c48a2a" });
    else button("Free Play  (unlocks after the story)", x, y, bw, bh, () => {}, { enabled: false, size: Math.min(bh * 0.36, u) });
    y += gap;
    button("Character Profiles", x, y, bw, bh, () => go("profiles")); y += gap;
    button("Achievements", x, y, bw, bh, () => go("achievements")); y += gap;
    button("Settings", x, y, bw, bh, () => go("settings"));
    text(`Build ${LPK.config.build} · Keyboard: arrows/WASD + Space · Touch supported`, W / 2, H - 14, Math.max(10, u * 0.7), C.dim, "center", "normal");
  }

  function go(screen) { G.prevScreen = G.screen; G.screen = screen; G.ui.sel = 0; G.ui.page = 0; }

  function drawPause() {
    overlay(0.6);
    const bw = Math.min(320, W * 0.7), bh = Math.min(46, H / 10, (H - 136) / 7.4), x = W / 2 - bw / 2;
    const ph = bh * 7 + 126;
    panel(x - 24, H / 2 - ph / 2, bw + 48, ph);
    text("Paused", W / 2, H / 2 - ph / 2 + 34, u * 1.6, C.gold, "center");
    let y = H / 2 - ph / 2 + 64;
    const g = bh + 8;
    button("Resume", x, y, bw, bh, () => { G.screen = "play"; }); y += g;
    button("Character Profiles", x, y, bw, bh, () => go("profiles")); y += g;
    button("Achievements", x, y, bw, bh, () => go("achievements")); y += g;
    button("Settings", x, y, bw, bh, () => go("settings")); y += g;
    button("Skip ahead in time...", x, y, bw, bh, () => go("skip")); y += g;
    button("Wardrobe", x, y, bw, bh, () => go("wardrobe")); y += g;
    button("Save & Quit to Title", x, y, bw, bh, () => { G.saveNow(); G.screen = "title"; G.ui.sel = 0; });
    G.ui.back = () => { G.screen = "play"; };
  }

  function drawSkip() {
    overlay(0.8);
    text("Skip ahead in time", W / 2, 40, u * 1.5, C.gold, "center");
    text(`It's ${G.clock.label()}. Where to?`, W / 2, 70, u * 0.9, C.dim, "center", "normal");
    const bw = Math.min(460, W - 40), bh = Math.min(48, H / 10), x = W / 2 - bw / 2;
    let y = 96;
    const S = LPK.characters.robert.schedule, P = LPK.Clock.parse;
    const opt = (label, fn) => { button(label, x, y, bw, bh, () => { fn(); G.screen = "play"; G.ui.sel = 0; }, { size: Math.min(bh * 0.36, u) }); y += bh + 8; };
    opt("Dinner time — Robert's Food Guard", () => G.skipTo((G.clock.isWeekend ? P(S.weekend.dinner) : P(S.weekday.dinner)) - 3, false));
    opt("Late night — the Tiny Snore (11:45 PM)", () => G.skipTo(23 * 60 + 45, false));
    opt("4:40 AM, next weekday — CC follows Robert", () => {
      G.skipTo(4 * 60 + 40, true);
      const T = 16; G.switchRoom("owensRoom", "toHallway"); G.laura.x = 9 * T; G.laura.y = 8 * T;
    });
    opt("Next morning (8:00 AM)", () => G.skipTo(8 * 60, false));
    backButton();
    G.ui.back = () => { G.screen = "pause"; G.ui.sel = 0; };
  }

  function backButton() {
    const bh = Math.min(44, H / 11);
    button("Back", 16, H - bh - 12, 120, bh, () => { G.screen = G.prevScreen; G.ui.sel = 0; }, { nav: false, color: "#8a5fb8" });
    G.ui.back = () => { G.screen = G.prevScreen; G.ui.sel = 0; };
  }

  function drawProfiles() {
    overlay(0.82);
    const ids = ["laura", "marshmallow", "cc", "popsicle", "robert"];
    const tabW = Math.min(170, (W - 40) / 5 - 6), tabH = Math.min(40, H / 12);
    ids.forEach((id, i) => {
      const ch = LPK.characters[id];
      const short = ch.nicknames && ch.nicknames.length ? ch.nicknames[0] : ch.name;
      const sel = G.ui.profile === id;
      rr(20 + i * (tabW + 6), 12, tabW, tabH, 10, sel ? C.pink : "#5a3f8a", sel ? C.gold : null, 2);
      text(short, 20 + i * (tabW + 6) + tabW / 2, 12 + tabH / 2, Math.min(u, tabH * 0.4), "#fff", "center");
      G.ui.buttons.push({ x: 20 + i * (tabW + 6), y: 12, w: tabW, h: tabH, action: () => { G.ui.profile = id; } });
    });
    G.ui.keyLeftRight = (d) => { const i = ids.indexOf(G.ui.profile); G.ui.profile = ids[(i + d + ids.length) % ids.length]; };
    const id = G.ui.profile, ch = LPK.characters[id];
    const top = 12 + tabH + 12, ph = H - top - 70;
    panel(16, top, W - 32, ph);
    const pw = Math.min(W * 0.28, ph * 0.9);
    // portrait
    rr(30, top + 14, pw, pw, 10, "rgba(255,255,255,0.06)");
    const scale = Math.max(2, Math.floor(pw / 46));
    const shapes = id === "laura" ? LPK.sprites.laura("stand", "down", 0)
      : id === "robert" ? LPK.sprites.robert("down", 0, { shades: Math.floor(G.time / 2) % 2 === 0, casual: Math.floor(G.time / 4) % 2 === 1 })
      : LPK.sprites.cat(ch.look, Math.floor(G.time / 3) % 2 ? "sit" : "front", 0, { eyes: id === "marshmallow" ? "stare" : "open" });
    sprite(shapes, 30 + pw / 2, top + 14 + pw * 0.86, id === "robert" ? scale * 0.8 : id === "laura" ? scale * 0.95 : scale * 1.4);
    // details
    const x = 30 + pw + 20, maxW = W - x - 36;
    let y = top + 30;
    text(ch.name, x, y, u * 1.5, C.gold); y += u * 1.4;
    if (ch.title) { text(ch.title, x, y, u * 0.95, C.pink); y += u * 1.25; }
    const facts = [];
    if (ch.nicknames && ch.nicknames.length) facts.push("Nicknames: " + ch.nicknames.join(", "));
    if (ch.age) facts.push(`Age: ${ch.age}`);
    if (ch.gender) facts.push(`Gender: ${ch.gender}`);
    if (ch.relationship) facts.push(ch.relationship);
    if (ch.role) facts.push(ch.role);
    text(facts.join("  ·  "), x, y, u * 0.8, C.dim, "left", "normal"); y += u * 1.2;
    const lines = wrap(ch.description, maxW, u * 0.82);
    lines.slice(0, 3).forEach(l => { text(l, x, y, u * 0.82, C.text, "left", "normal"); y += u * 1.05; });
    y += 4;
    if (ch.joinsInBuild > LPK.config.build) { text(`Joins the game in Build ${ch.joinsInBuild}`, x, y, u * 0.8, C.gold); y += u * 1.2; }
    if (id === "robert") {
      const S = ch.schedule;
      text(`Weekdays: up ${S.weekday.wake}, work ${S.weekday.leave}–${S.weekday.home}, dinner guard ${S.weekday.dinner}`, x, y, u * 0.75, C.green, "left", "normal"); y += u * 1.05;
      text(`Weekends: home · dinner guard ${S.weekend.dinner} · Tiny Snore after ${S.weekend.sleep}`, x, y, u * 0.75, C.green, "left", "normal"); y += u * 1.2;
    }
    if (id === "marshmallow" && LPK.save.data.cats.marshmallow) {
      const tr = LPK.save.data.cats.marshmallow.trust || 0;
      text(`Affection with Laura: ${Math.round(tr * 100)}%`, x, y, u * 0.8, C.green); y += u * 1.2;
    }
    if (ch.attributes) {
      const entries = Object.entries(ch.attributes);
      const cols = (y + entries.length * u * 1.15 > top + ph - 10) ? 2 : 1;
      const colW = maxW / cols, rows = Math.ceil(entries.length / cols);
      entries.forEach(([k, v], i) => {
        const cx = x + Math.floor(i / rows) * colW, cy = y + (i % rows) * u * 1.15;
        const label = LPK.attributeLabels[k] + (ch.attributeNotes && ch.attributeNotes[k] ? "*" : "");
        text(label, cx, cy, u * 0.78, C.text, "left", "normal");
        const bx = cx + colW * 0.45, bw = colW * 0.36;
        bar(bx, cy - u * 0.3, bw, u * 0.6, v / 10, v >= 9 ? C.pink : v >= 5 ? C.gold : "#7fb0ff");
        text(`${v}/10`, bx + bw + 6, cy, u * 0.75, C.text, "left");
      });
      y += rows * u * 1.15 + 4;
      if (ch.attributeNotes) text("* " + Object.values(ch.attributeNotes).join(", "), x, y, u * 0.7, C.dim, "left", "normal");
    } else if (id === "laura") {
      text("Controls: Arrows/WASD to walk · Shift to run · Space to pet", x, y, u * 0.8, C.text, "left", "normal"); y += u * 1.2;
      text("Touch: drag on the left side to move (push far to run) · PET button", x, y, u * 0.8, C.text, "left", "normal");
    }
    if (ch.favorites && y < top + ph - u * 2) {
      y += u * 0.9;
      const fav = wrap("Loves: " + ch.favorites.join(" · "), maxW, u * 0.78);
      fav.slice(0, 2).forEach(l => { if (y < top + ph - u) { text(l, x, y, u * 0.78, C.dim, "left", "normal"); y += u; } });
    }
    backButton();
  }

  function drawAchievements() {
    overlay(0.82);
    const list = LPK.achievements, got = LPK.save.data.achievements;
    text(`Achievements  (${Object.keys(got).length}/${list.length})`, W / 2, 30, u * 1.4, C.gold, "center");
    const rowH = Math.max(34, u * 2.6), top = 56, perPage = Math.max(3, Math.floor((H - top - 80) / (rowH + 6)));
    const pages = Math.ceil(list.length / perPage);
    G.ui.page = Math.max(0, Math.min(pages - 1, G.ui.page));
    const w = Math.min(760, W - 40), x = W / 2 - w / 2;
    list.slice(G.ui.page * perPage, (G.ui.page + 1) * perPage).forEach((a, i) => {
      const y = top + i * (rowH + 6), done = !!got[a.id];
      rr(x, y, w, rowH, 10, done ? "rgba(255,209,102,0.18)" : C.panel, done ? C.gold : "#5a4a7a", 2);
      text(done ? "★" : a.build > 1 ? "…" : "☆", x + 22, y + rowH / 2, u * 1.4, done ? C.gold : C.dim, "center");
      const name = LPK.save.data.settings.familyFriendly && a.familyName ? a.familyName : a.name;
      text(name, x + 44, y + rowH * 0.34, u * 0.95, done ? C.gold : C.text);
      text(a.desc, x + 44, y + rowH * 0.72, u * 0.75, C.dim, "left", "normal");
      text(done ? "Unlocked" : a.build > 1 ? `Coming in Build ${a.build}` : "Locked", x + w - 12, y + rowH / 2, u * 0.75, done ? C.green : C.dim, "right");
    });
    G.ui.keyLeftRight = (d) => { G.ui.page = (G.ui.page + d + pages) % pages; };
    const bh = Math.min(44, H / 11);
    button("◀", W - 230, H - bh - 12, 60, bh, () => G.ui.keyLeftRight(-1), { nav: false });
    text(`${G.ui.page + 1}/${pages}`, W - 135, H - bh / 2 - 12, u, C.text, "center");
    button("▶", W - 100, H - bh - 12, 60, bh, () => G.ui.keyLeftRight(1), { nav: false });
    backButton();
  }

  function drawSettings() {
    overlay(0.82);
    const s = LPK.save.data.settings;
    text("Settings", W / 2, 34, u * 1.5, C.gold, "center");
    const w = Math.min(560, W - 40), x = W / 2 - w / 2, rowH = Math.min(52, (H - 140) / 6);
    let y = 64;
    const row = (label, value, dec, inc) => {
      rr(x, y, w, rowH - 6, 10, C.panel, "#5a4a7a", 2);
      text(label, x + 14, y + (rowH - 6) / 2, u * 0.95);
      const bw = Math.min(54, rowH);
      button("◀", x + w - bw * 2 - 120, y + 3, bw, rowH - 12, dec);
      text(value, x + w - bw - 66, y + (rowH - 6) / 2, u * 0.95, C.gold, "center");
      button("▶", x + w - bw - 10, y + 3, bw, rowH - 12, inc);
      y += rowH;
    };
    const step = (k, d, min, max) => () => { s[k] = Math.round(Math.min(max, Math.max(min, s[k] + d)) * 100) / 100; LPK.audio.applyVolumes(); LPK.save.write(); };
    row("Sound effects volume", `${Math.round(s.sfxVolume * 100)}%`, step("sfxVolume", -0.1, 0, 1), step("sfxVolume", 0.1, 0, 1));
    row("Music volume", `${Math.round(s.musicVolume * 100)}%`, step("musicVolume", -0.1, 0, 1), step("musicVolume", 0.1, 0, 1));
    const toggleFF = () => { s.familyFriendly = !s.familyFriendly; LPK.save.write(); };
    row("Family-friendly dialogue", s.familyFriendly ? "On" : "Off", toggleFF, toggleFF);
    row("Animation speed", `${s.animationSpeed}x`, step("animationSpeed", -0.25, 0.5, 1.5), step("animationSpeed", 0.25, 0.5, 1.5));
    const modes = ["auto", "on", "off"], cyc = (d) => () => { s.touchControls = modes[(modes.indexOf(s.touchControls) + d + 3) % 3]; LPK.save.write(); };
    row("On-screen touch controls", s.touchControls[0].toUpperCase() + s.touchControls.slice(1), cyc(-1), cyc(1));
    const bw = Math.min(300, w);
    button(G.ui.confirmReset ? "Really erase all progress?" : "Reset all progress", W / 2 - bw / 2, y + 8, bw, Math.min(44, rowH), () => {
      if (!G.ui.confirmReset) { G.ui.confirmReset = true; return; }
      G.ui.confirmReset = false; const st = LPK.save.data.settings; LPK.save.newGame(); LPK.save.data.hasGame = false; LPK.save.data.settings = st; LPK.save.write();
    }, { color: "#a04a6a" });
    backButton();
  }

  // ------------------------------------------------------------ play HUD
  function drawHUD() {
    const L = G.laura, P = G.petting;
    // Stare: dramatic letterbox + vignette
    const staring = G.cats.find(c => c.room === G.room && (c.state === "stare" || c.state === "turnCam"));
    if (staring) {
      const bh = H * 0.09; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh);
      const grd = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.7);
      grd.addColorStop(0, "rgba(0,0,0,0)"); grd.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
    }
    // speech bubbles
    const bubbles = [];
    if (L.speech) { const p = G.worldToScreen(L.x, L.y - (L.state === "kneel" ? 26 : 32)), f = G.worldToScreen(L.x, L.y); bubbles.push([L.speech.text, p.x, p.y, "speech", f.y]); }
    for (const c of [...G.cats, G.robert]) if (c && c.bubble && c.room === G.room && !c.concealed && c.state !== "transit" && c.present !== false) {
      const h = c.headPos(), p = G.worldToScreen(h.x, h.y), f = G.worldToScreen(c.x, c.y - c.z);
      bubbles.push([c.bubble.text, p.x, p.y, c.bubble.kind, f.y]);
    }
    if (G.clown && G.clown.line && G.clownPos && G.clownPos.room === G.room) {
      const p = G.worldToScreen(G.clownPos.x, G.clownPos.y - 62), f = G.worldToScreen(G.clownPos.x, G.clownPos.y);
      bubbles.push([G.clown.line, p.x, p.y, "speech", f.y]);
    }
    const drawBubbles = (topLimit) => bubbles.forEach(b => bubble(b[0], b[1], b[2], b[3], b[4], topLimit));
    if (staring) { drawBubbles(H * 0.09 + 4); return; }
    let hudBottom = 4;                       // tracks how far down the top panels reach

    const pad = 10, sz = Math.max(11, u * 0.85);
    // top-left: clock + room
    const ph = G.clock.phase, icon = ph === "night" ? "☾" : ph === "evening" ? "◐" : "☀";
    const tlw = Math.max(170, u * 11);
    panel(pad, pad, tlw, sz * 3.1); hudBottom = Math.max(hudBottom, pad + sz * 3.1);
    text(`${icon} ${G.clock.label()}`, pad + 12, pad + sz * 1.0, sz * 1.05, C.gold);
    text(G.world.zoneAt(L.x, L.y), pad + 12, pad + sz * 2.15, sz * 0.9, C.dim, "left", "normal");
    // top-right: points + pause
    const pb = Math.max(36, u * 2.4);
    button("II", W - pad - pb, pad, pb, pb, () => { G.screen = "pause"; G.ui.sel = 0; LPK.audio.purr(0); }, { nav: false, color: "#8a5fb8" });
    const ptsW = Math.max(150, u * 9.5);
    panel(W - pad - pb - 8 - ptsW, pad, ptsW, pb); hudBottom = Math.max(hudBottom, pad + pb);
    text(`♥ ${LPK.save.data.points}`, W - pad - pb - 8 - ptsW + 12, pad + pb * 0.38, sz * 1.1, C.pink);
    text("Kitty Happiness Points", W - pad - pb - 8 - ptsW + 12, pad + pb * 0.76, sz * 0.62, C.dim, "left", "normal");
    // objectives: a small "Goals" button; tap it (or press G) to open/close the full list
    const m = G.progression.currentMission(), st = LPK.save.data.settings;
    const df = G.dailyFull && G.dailyFull.day === G.clock.day ? G.dailyFull.set : new Set();
    let done = 0, total = 0, title;
    if (m) {
      const i = G.progression.stepIndex(m);
      total = m.steps.length;
      done = m.anyOrder ? m.steps.filter(x => G.progression.stepDone(m, x)).length : i;
      title = `Level ${m.level}`;
    } else { total = 3; done = df.size; title = LPK.save.data.freePlay ? "Free Play" : "Free roam"; }
    const key = `${title}:${done}`;
    if (G.goalsKey !== key) { if (G.goalsKey) G.goalsFlash = 3; G.goalsKey = key; }
    G.goalsFlash = Math.max(0, (G.goalsFlash || 0) - G.dt);
    const toggle = () => { st.goalsOpen = !st.goalsOpen; LPK.save.write(); };
    if (LPK.input.pressed("goals")) toggle();
    const cw = Math.min(250, W - tlw - pb - 60), ch = Math.max(32, sz * 2.2), cx = W / 2 - cw / 2;
    const flash = G.goalsFlash > 0 && Math.floor(G.goalsFlash * 4) % 2 === 0;
    button(`${st.goalsOpen ? "▲" : "▼"} Goals · ${title} (${done}/${total})`, cx, pad, cw, ch, toggle,
      { nav: false, color: flash ? "#c48a2a" : "#5a3f8a", size: Math.min(ch * 0.4, sz * 0.9) });
    if (st.goalsOpen) {
      const ow = Math.min(W - 2 * pad, 460), ox = W / 2 - ow / 2, oy = pad + ch + 8;
      if (m) {
        const i = G.progression.stepIndex(m), rows = m.steps.length;
        panel(ox, oy, ow, sz * (1.7 + rows * 1.25));
        text(`Level ${m.level}: ${m.name}`, ox + 12, oy + sz * 0.95, sz, C.gold);
        m.steps.forEach((stp, k) => {
          const dn = m.anyOrder ? G.progression.stepDone(m, stp) : k < i, cur = m.anyOrder ? !dn : k === i;
          const cnt = cur && stp.count ? ` (${(LPK.save.data.missions[m.id] || {}).count || 0}/${stp.count})` : "";
          text(`${dn ? "✔" : cur ? "▶" : "○"} ${stp.text}${cnt}`, ox + 12, oy + sz * (2.1 + k * 1.25), sz * 0.82, dn ? C.green : cur ? C.text : C.dim, "left", cur ? "bold" : "normal");
        });
      } else {
        panel(ox, oy, ow, sz * 2.9);
        text(LPK.save.data.freePlay ? "Free Play — Daily goal: fill every Purr Meter" : "Free roam", ox + 12, oy + sz * 0.95, sz * 0.9, C.gold);
        text(["marshmallow", "cc", "popsicle"].map(id => `${df.has(id) ? "✔" : "○"} ${id === "cc" ? "CC" : id === "popsicle" ? "Orangey" : "Marshmallow"}`).join("   "), ox + 12, oy + sz * 2.0, sz * 0.8, C.text, "left", "normal");
      }
    } else if (m && G.goalsFlash > 0) {
      // a quick peek at what's next after completing a step, then it tucks away again
      const i = G.progression.stepIndex(m);
      const next = m.anyOrder ? null : m.steps[i];
      if (next) { const tw = Math.min(W - 2 * pad, 460); ctx.globalAlpha = Math.min(1, G.goalsFlash); panel(W / 2 - tw / 2, pad + ch + 8, tw, sz * 1.9); text(`Next: ${next.text}`, W / 2, pad + ch + 8 + sz * 0.95, sz * 0.82, C.text, "center"); ctx.globalAlpha = 1; }
    }

    // Purr Meter (spec 18): the relevant cat's meter
    const pr = G.prompt;
    const cat = P.active ? P.session.cat : pr && pr.cat;
    const kb = !touchShown();
    if (cat) {
      const mw = Math.min(400, W - 40), mh = sz * 3.4, mx = W / 2 - mw / 2, my = H - mh - pad;
      panel(mx, my, mw, mh);
      text(`${cat.def.nicknames && cat.def.nicknames[0] || cat.def.name}'s Purr Meter`, mx + 12, my + sz * 0.95, sz * 0.9, C.gold);
      text(`${Math.round(cat.happiness)}%`, mx + mw - 12, my + sz * 0.95, sz * 0.95, C.text, "right");
      bar(mx + 12, my + sz * 1.6, mw - 24, sz * 0.7, cat.happiness / 100, C.pink);
      if (cat.happiness > 100) {                                  // overcharge: the zoomie zone
        const of = Math.min(1, (cat.happiness - 100) / 100), bw = mw - 24, bh = sz * 0.7;
        rr(mx + 12, my + sz * 1.6, Math.max(bh, bw * of), bh, bh / 2, Math.floor(G.time * 8) % 2 ? C.gold : "#ffb347");
      }
      let status;
      if (cat.state === "break") status = "Wants a short break — hands off!";
      else if (cat.zoomies) status = "ZOOMIES!!! Burning off the extra purrs...";
      else if (P.active && cat.happiness > 100) status = `OVERCHARGED! ${Math.round(cat.happiness - 100)}% of zoomies saved up...`;
      else if (P.active && P.turbo && P.session.combo >= 2) status = `Turbo Back Pats  ×${Math.floor(P.session.combo)}`;
      else if (P.active && P.turbo) status = kb ? "Hold SPACE · alternate ← → for Turbo Back Pats · Q stops" : "Hold PET · alternate ◀ PAT ▶ for Turbo Back Pats";
      else if (P.active) status = kb ? "Hold SPACE or tap ← → for scritches · Q stops" : "Hold PET or tap PAT for scritches";
      else if (pr && pr.kind !== "pet") status = (kb ? "SPACE: " : "Tap the button: ") + pr.label;
      else if (!cat.available) status = cat.id === "marshmallow" ? "Busy being dramatic..." : cat.id === "cc" ? "Too busy being the boss right now" : "Too distracted right now";
      else status = (cat.state === "sleep" ? "Sleeping. " : "") + (kb ? "Press SPACE to pet" : "Tap PET");
      text(status, mx + 12, my + sz * 2.75, sz * 0.78, cat.state === "break" ? C.gold : C.text, "left", "normal");
    } else if (pr) {
      const mw = Math.min(400, W - 40), mh = sz * 2, mx = W / 2 - mw / 2, my = H - mh - pad;
      panel(mx, my, mw, mh);
      text((kb ? "SPACE: " : "") + pr.label, W / 2, my + mh / 2, sz * 0.9, C.text, "center");
    }
    // What Laura is holding
    if (G.holding) {
      const f = LPK.foods[G.holding], hw = Math.max(170, u * 11), hy = pad + sz * 3.1 + 8;
      panel(pad, hy, hw, sz * 2.2); hudBottom = Math.max(hudBottom, hy + sz * 2.2);
      ctx.fillStyle = f.color; ctx.beginPath(); ctx.arc(pad + 18, hy + sz * 1.1, sz * 0.5, 0, 7); ctx.fill();
      text(`Holding: ${f.name}`, pad + 32, hy + sz * 0.8, sz * 0.85, C.gold);
      text(kb ? "Q to put it away" : "PUT AWAY button", pad + 32, hy + sz * 1.6, sz * 0.65, C.dim, "left", "normal");
    }
    if (G.olympics && G.olympics.event) drawOlympics(sz);
    if (G.foodMenu) drawFoodMenu();
    if (G.choiceMenu) drawChoiceMenu();
    if (G.laura.state === "rest") {
      const w = Math.min(380, W - 40);
      panel(W / 2 - w / 2, H * 0.62, w, sz * 2.6);
      text("Resting... time flies ⏩", W / 2, H * 0.62 + sz * 0.95, sz, C.gold, "center");
      text(kb ? "SPACE to get up" : "Tap GET UP", W / 2, H * 0.62 + sz * 1.9, sz * 0.8, C.dim, "center", "normal");
    }
    if (G.bellyGame) drawBellyGame();

    if (G.foodMenu && G.banner) G.banner.t = 0;
    if (G.banner && G.banner.t > 0) {
      G.banner.t -= G.dt;
      const bw = Math.min(520, W - 40), lines = wrap(G.banner.text, bw - 30, sz);
      const bh = sz * (2.8 + lines.length * 1.3);
      ctx.globalAlpha = Math.min(1, G.banner.t);
      panel(W / 2 - bw / 2, H * 0.32, bw, bh);
      text(G.banner.title, W / 2, H * 0.32 + sz * 1.3, sz * 1.3, C.gold, "center");
      lines.forEach((l, i) => text(l, W / 2, H * 0.32 + sz * (2.8 + i * 1.3), sz, C.text, "center", "normal"));
      ctx.globalAlpha = 1;
    }
    if (!G.celebration) drawBubbles(-1e9);   // above the head, as originally; drawn on top so nothing hides it
  }

  function drawChoiceMenu() {
    const M = G.choiceMenu;
    overlay(0.5);
    const w = Math.min(420, W - 40), rowH = Math.min(50, (H - 140) / M.options.length);
    const h = rowH * M.options.length + 84, x = W / 2 - w / 2, y = H / 2 - h / 2;
    panel(x, y, w, h);
    text(M.title, W / 2, y + 26, u * 1.3, C.gold, "center");
    if (M.sub) text(M.sub, W / 2, y + 50, u * 0.75, C.dim, "center", "normal");
    M.options.forEach((o, i) => {
      const by = y + 64 + i * rowH, sel = M.sel === i;
      rr(x + 16, by, w - 32, rowH - 8, 10, sel ? C.pink : "#5a3f8a", sel ? C.gold : null, 2);
      text(o.label, W / 2, by + (rowH - 8) / 2, u * 0.95, "#fff", "center");
      G.ui.buttons.push({ x: x + 16, y: by, w: w - 32, h: rowH - 8, action: () => { G.choiceMenu = null; o.fn(); } });
    });
  }

  function drawFoodMenu() {
    overlay(0.5);
    const keys = Object.keys(LPK.foods), w = Math.min(420, W - 40), rowH = Math.min(52, H / 8);
    const h = rowH * (keys.length + 1) + 90, x = W / 2 - w / 2, y = H / 2 - h / 2;
    panel(x, y, w, h);
    text("The Treat Cabinet", W / 2, y + 26, u * 1.3, C.gold, "center");
    text("Food Detective: who wants what?", W / 2, y + 50, u * 0.75, C.dim, "center", "normal");
    [...keys, null].forEach((k, i) => {
      const by = y + 66 + i * rowH, sel = G.foodMenu.sel === i;
      rr(x + 16, by, w - 32, rowH - 8, 10, sel ? C.pink : "#5a3f8a", sel ? C.gold : null, 2);
      if (k) { ctx.fillStyle = LPK.foods[k].color; ctx.beginPath(); ctx.arc(x + 38, by + (rowH - 8) / 2, 8, 0, 7); ctx.fill(); }
      text(k ? LPK.foods[k].full : "Never mind (put food away)", x + 56, by + (rowH - 8) / 2, u * 0.9, "#fff");
      G.ui.buttons.push({ x: x + 16, y: by, w: w - 32, h: rowH - 8, action: () => G.pickFood(k) });
    });
  }

  function drawOlympics(sz) {
    const O = G.olympics, w = Math.min(380, W - 40), x = 10, y = Math.max(H * 0.24, 10 + sz * 3.4 + (G.holding ? sz * 2.6 : 0));
    const title = { cc: "GQ Grand Prix", pop: "Orangey's Agility", marsh: "Nap-athlon" }[O.event];
    let line = "";
    if (O.event === "cc") line = O.phase === "lead" ? `Rings: ${O.ring}/3 · ${Math.floor(O.t)}s (gold under 35s)` : `The climb! Toss the spring by the cat tree · ${Math.floor(O.t)}s`;
    if (O.event === "pop") line = `Jump ${Math.min(O.idx + 1, 3)}/3 · clean landings: ${O.wins}`;
    if (O.event === "marsh") line = `Best combo: ${O.best} (gold 25) · ${Math.max(0, Math.ceil(O.t))}s left`;
    panel(x, y, w, sz * 3);
    text(`🏅 Kitty Olympics: ${title}`, x + 12, y + sz * 0.95, sz * 0.95, C.gold);
    text(line, x + 12, y + sz * 2.1, sz * 0.8, C.text, "left", "normal");
    if (O.event === "pop" && O.phase === "cheer") {
      const bw = Math.min(360, W - 40), bx = W / 2 - bw / 2, by = H * 0.62, bh = u * 1.3;
      panel(bx - 12, by - u * 1.8, bw + 24, u * 4.4);
      text("Orangey is wiggling... CHEER in the green!", W / 2, by - u * 0.8, u * 0.95, C.gold, "center");
      rr(bx, by, bw, bh, bh / 2, "rgba(255,255,255,0.12)");
      rr(bx + bw * 0.36, by, bw * 0.28, bh, 6, "rgba(126,217,154,0.7)");
      rr(bx + bw * O.marker - 4, by - 6, 8, bh + 12, 4, "#ffffff");
      text(touchShown() ? "Tap CHEER" : "Press SPACE", W / 2, by + bh + u * 0.9, u * 0.8, C.text, "center", "normal");
    }
  }

  function drawBellyGame() {
    const bg = G.bellyGame, w = Math.min(420, W - 40), x = W / 2 - w / 2, y = H * 0.58, h = u * 5.6;
    panel(x, y, w, h);
    text(`The Royal Belly Rub  ${"♥".repeat(bg.hits)}${"♡".repeat(3 - bg.hits)}`, W / 2, y + u * 1.1, u * 1.1, C.gold, "center");
    const bx = x + 20, bw = w - 40, by = y + u * 2.2, bh = u * 1.2;
    rr(bx, by, bw, bh, bh / 2, "rgba(255,255,255,0.12)");
    rr(bx + bw * 0.36, by, bw * 0.28, bh, 6, bg.flash > 0 ? "#7ed99a" : "rgba(126,217,154,0.55)");
    text("gentle", bx + bw / 2, by + bh / 2, u * 0.7, "#1e3a26", "center");
    const mx = bx + bw * bg.marker;
    rr(mx - 4, by - 6, 8, bh + 12, 4, "#ffffff");
    text(touchShown() ? "Tap RUB when the marker is in the green" : "Press SPACE when the marker is in the green", W / 2, y + h - u * 0.9, u * 0.8, C.text, "center", "normal");
  }

  function drawToasts() {
    const P = G.progression;
    if (G.celebration && G.celebration.t < 3.5) return;      // let the celebration shine first
    P.toasts = P.toasts.slice(0, 4).concat(P.toasts.slice(4).map(t => (t.t += G.dt, t)));
    P.toasts = P.toasts.filter(t => (t.t -= G.dt) > 0);
    P.toasts.forEach((t, i) => {
      const w = Math.min(320, W - 20), h = u * 3.2, x = W - w - 10, y = H * 0.22 + i * (h + 8);
      ctx.globalAlpha = Math.min(1, t.t);
      rr(x, y, w, h, 12, "rgba(255,209,102,0.95)", "#8a5a10", 2);
      text("★ " + t.title, x + 12, y + h * 0.33, u * 0.8, "#6a3a00");
      text(t.text, x + 12, y + h * 0.7, u * 1.0, C.ink);
      ctx.globalAlpha = 1;
    });
  }

  function drawCelebration() {
    const c = G.celebration; if (!c) return;
    overlay(Math.min(0.65, c.t));
    // confetti hearts
    for (let i = 0; i < 40; i++) {
      const x = (i * 97.3 % W), y = ((i * 53 + c.t * (60 + i % 5 * 25)) % (H + 40)) - 20;
      ctx.fillStyle = ["#ff7aa8", "#ffd166", "#c77dff", "#7ed99a"][i % 4];
      ctx.font = `${12 + (i % 3) * 6}px ${FONT}`; ctx.textAlign = "center"; ctx.fillText(i % 2 ? "♥" : "✦", x, y);
    }
    const s = Math.min(1, c.t * 2);
    const size = Math.min(W / 8, H / 7, 76) * (0.6 + 0.4 * s);
    if (c.finale) return drawFinale(c, s);
    outlined(c.mission.name.toUpperCase() + "!", W / 2, H * 0.2, size, C.gold, "#6a2a55");
    if (c.mission.id === "olympics") return drawPodium(c);
    const sc = Math.max(3, Math.floor(Math.min(W, H) / 110));
    sprite(LPK.sprites.laura("celebrate", "down", 0), W / 2 - 50 * sc / 3, H * 0.56 - Math.abs(Math.sin(c.t * 6)) * 8, sc);
    ["marshmallow", "cc", "popsicle"].forEach((id, i) => sprite(LPK.sprites.cat(LPK.characters[id].look, "sit", 0, { eyes: "happy", tailSway: Math.floor(c.t * 4 + i) % 2 }), W / 2 + (30 + i * 26) * sc / 3, H * 0.56, sc * 0.9));
    text(`+${c.mission.reward.points} Kitty Happiness Points`, W / 2, H * 0.66, u * 1.2, C.pink, "center");
    text(`Achievement: ${LPK.achievements.find(a => a.id === c.mission.reward.achievement).name}`, W / 2, H * 0.66 + u * 1.6, u, C.gold, "center");
    const next = G.progression.currentMission();
    text(next ? `Up next — Level ${next.level}: ${next.name}` : `That's every level in Build ${LPK.config.build}! Keep exploring the house.`, W / 2, H * 0.66 + u * 3, u * 0.85, C.text, "center", "normal");
    if (c.t > 1) {
      const bw = Math.min(260, W * 0.6), bh = Math.min(46, H / 10);
      button(G.progression.currentMission() ? "Next Level" : "Keep Exploring", W / 2 - bw / 2, H * 0.66 + u * 4.2, bw, bh, () => G.endCelebration());
    }
  }

  // Kitty Olympics medal podium
  function drawPodium(c) {
    const sc = Math.max(3, Math.floor(Math.min(W, H) / 120)), base = H * 0.6;
    const order = [["pop", "popsicle", -1, 0.7], ["cc", "cc", 0, 1], ["marsh", "marshmallow", 1, 0.45]];
    const medalCol = { gold: "#ffd166", silver: "#d8dce4", bronze: "#d8955a" };
    order.forEach(([ev, id, pos, hgt]) => {
      const x = W / 2 + pos * sc * 30, ph = 40 + hgt * 50;
      rr(x - sc * 13, base - ph, sc * 26, ph, 6, "#6c4fa8", C.gold, 2);
      sprite(LPK.sprites.cat(LPK.characters[id].look, "sit", 0, { eyes: "happy", tailSway: Math.floor(c.t * 4) % 2, shades: id === "cc" && LPK.save.data.ccShades }), x, base - ph, sc);
      const md = c.medals[ev];
      if (md) { ctx.beginPath(); ctx.arc(x, base - ph + 22, 11, 0, 7); ctx.fillStyle = medalCol[md]; ctx.fill(); text(md[0].toUpperCase(), x, base - ph + 23, 12, "#3a2a00", "center"); }
    });
    text(`+${c.mission.reward.points} Kitty Happiness Points · Kitty Olympics Champion`, W / 2, base + u * 1.4, u, C.pink, "center");
    const next = G.progression.currentMission();
    if (c.t > 1) { const bw = Math.min(260, W * 0.6), bh = Math.min(46, H / 10); button(next ? "Next Level" : "Keep Exploring", W / 2 - bw / 2, base + u * 2.6, bw, bh, () => G.endCelebration()); }
  }

  // The grand finale: PURRFECTION!
  function drawFinale(c, s) {
    // fireworks of hearts
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 211) % W), cy = H * (0.15 + (i % 3) * 0.12), r = ((c.t * 60 + i * 37) % 120);
      ["#ff7aa8", "#ffd166", "#c77dff", "#7ed99a"].forEach((col, k) => { for (let a = 0; a < 8; a++) { const ang = a * Math.PI / 4 + k * 0.2; ctx.fillStyle = col; ctx.globalAlpha = Math.max(0, 1 - r / 120); ctx.font = `14px ${FONT}`; ctx.fillText("♥", cx + Math.cos(ang) * r, cy + Math.sin(ang) * r); } });
      ctx.globalAlpha = 1;
    }
    const size = Math.min(W / 7, H / 6, 96) * (0.6 + 0.4 * s);
    outlined("PURRFECTION!", W / 2, H * 0.18, size, C.gold, "#6a2a55");
    const sc = Math.max(3, Math.floor(Math.min(W, H) / 105)), base = H * 0.6;
    sprite(LPK.sprites.robert("down", 0, { shades: true }), W / 2 - sc * 44, base, sc * 0.8);
    sprite(LPK.sprites.laura("celebrate", "down", 0), W / 2 - sc * 16, base - Math.abs(Math.sin(c.t * 6)) * 8, sc);
    [["marshmallow", 8], ["cc", 30], ["popsicle", 52]].forEach(([id, dx], i) =>
      sprite(LPK.sprites.cat(LPK.characters[id].look, "sit", 0, { eyes: "happy", tailSway: Math.floor(c.t * 4 + i) % 2, shades: id === "cc" }), W / 2 + sc * dx, base, sc * 0.9));
    text("Three kitties. Three personalities. One Laura. Unlimited purrs.", W / 2, base + u * 1.3, u * 1.05, C.pink, "center");
    text(`+${c.mission.reward.points} Kitty Happiness Points · Free Play unlocked · New outfit: Purrfection Champion`, W / 2, base + u * 2.6, u * 0.85, C.gold, "center");
    if (c.t > 1.5) { const bw = Math.min(280, W * 0.6), bh = Math.min(46, H / 10); button("Keep Cuddling", W / 2 - bw / 2, base + u * 3.6, bw, bh, () => G.endCelebration()); }
  }

  // ------------------------------------------------------------ wardrobe
  function drawWardrobe() {
    overlay(0.85);
    const sv = LPK.save.data, outfits = LPK.characters.laura.outfits;
    text("Wardrobe", W / 2, 34, u * 1.5, C.gold, "center");
    text(`♥ ${sv.points} Kitty Happiness Points`, W / 2, 60, u * 0.9, C.pink, "center", "normal");
    const w = Math.min(560, W - 40), x = W / 2 - w / 2, rowH = Math.min(46, (H - 150) / 7);
    let y = 80;
    for (const [id, o] of Object.entries(outfits)) {
      const unlocked = o.unlockMission ? !!(sv.missions[o.unlockMission] && sv.missions[o.unlockMission].done) : sv.points >= o.unlockPoints;
      const cur = (sv.outfit || "cozy") === id;
      const label = `${cur ? "✔ " : ""}${o.name}${unlocked ? "" : o.unlockMission ? "  🔒 finish the story" : `  🔒 ${o.unlockPoints} pts`}`;
      button(label, x, y, w, rowH - 6, () => { sv.outfit = id; LPK.save.write(); }, { enabled: unlocked, color: cur ? "#c48a2a" : undefined, size: Math.min(rowH * 0.36, u * 0.95) });
      y += rowH;
    }
    const shadesOk = !!(sv.missions.ultimateCuddle && sv.missions.ultimateCuddle.done);
    button(`${sv.ccShades ? "✔ " : ""}CC's GQ shades${shadesOk ? "" : "  🔒 finish the story"}`, x, y, w, rowH - 6, () => { sv.ccShades = !sv.ccShades; LPK.save.write(); }, { enabled: shadesOk, size: Math.min(rowH * 0.36, u * 0.95) });
    sprite(LPK.sprites.laura("stand", "down", 0), W - 70, H - 40, 3);
    backButton();
  }

  // ------------------------------------------------------------ touch
  function touchShown() {
    const m = LPK.save.data.settings.touchControls;
    return m === "on" || (m === "auto" && LPK.input.lastType === "touch");
  }
  function drawTouch() {
    const show = touchShown() && !G.celebration && !G.foodMenu && !G.choiceMenu;
    if (show && G.bellyGame) {
      const R0 = Math.max(34, Math.min(W, H) * 0.09);
      ctx.beginPath(); ctx.arc(W - R0 * 1.5, H - R0 * 1.5, R0 * 1.1, 0, 7); ctx.fillStyle = "rgba(126,217,154,0.6)"; ctx.fill();
      text("RUB", W - R0 * 1.5, H - R0 * 1.5, R0 * 0.42, "#fff", "center");
      LPK.input.touchButtons = [{ id: "act", x: W - R0 * 1.5, y: H - R0 * 1.5, r: R0 * 1.1 }];
      LPK.input.stickEnabled = false;
      return;
    }
    LPK.input.stickEnabled = show && !G.petting.active;
    if (!show) { LPK.input.touchButtons = []; return; }
    const btns = [];
    const circ = (id, x, y, r, label, on = true) => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7);
      ctx.fillStyle = on ? "rgba(255,122,168,0.55)" : "rgba(255,255,255,0.15)"; ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 2; ctx.stroke();
      text(label, x, y, Math.max(12, r * 0.38), "#fff", "center");
      btns.push({ id, x, y, r });
    };
    const R = Math.max(34, Math.min(W, H) * 0.09);
    if (G.petting.active) {
      circ("patL", W - R * 4.6, H - R * 1.3, R, "◀ PAT");
      circ("patR", W - R * 1.4, H - R * 1.3, R, "PAT ▶");
      circ("act", W - R * 3, H - R * 3.6, R * 0.8, "PET");
      circ("stop", R * 1.4, H - R * 1.3, R * 0.8, "STOP");
    } else {
      const pk = G.prompt && G.prompt.kind;
      const lbl = { pet: "PET", feed: "FEED", shoo: "SHOO!", trashCat: "HEY!", trash: "CHECK", pantry: "OPEN", bowl: "FILL", hide: "SEARCH",
        rest: "REST", getUp: "GET UP", spring: "GRAB", toss: "TOSS", belly: "RUB", clownSwitch: "FLIP", garageDoor: "DOOR", desk: "SIT" }[pk] || "PET";
      const cheering = G.olympics && G.olympics.phase === "cheer";
      circ("act", W - R * 1.5, H - R * 1.5, R * 1.1, cheering ? "CHEER" : lbl, cheering || !!(G.prompt && G.prompt.ok));
      if (G.holding) circ("stop", W - R * 1.5, H - R * 3.9, R * 0.75, "PUT AWAY");
      const st = LPK.input.stick;
      const bx = st ? st.ox : R * 2, by = st ? st.oy : H - R * 2;
      ctx.beginPath(); ctx.arc(bx, by, R * 1.3, 0, 7); ctx.fillStyle = "rgba(255,255,255,0.10)"; ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.stroke();
      const kx = st ? bx + Math.max(-R * 1.3, Math.min(R * 1.3, st.x - st.ox)) : bx, ky = st ? by + Math.max(-R * 1.3, Math.min(R * 1.3, st.y - st.oy)) : by;
      ctx.beginPath(); ctx.arc(kx, ky, R * 0.55, 0, 7); ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.fill();
      if (!st) text("drag to move · push far to run", 12, by + R * 1.6, Math.max(10, u * 0.65), "rgba(255,255,255,0.7)", "left", "normal");
    }
    LPK.input.touchButtons = btns;
  }

  // ------------------------------------------------------------ public
  return {
    handleClicks(game, clicks) {
      for (const c of clicks) {
        const b = game.ui.buttons.find(b => c.x >= b.x && c.x <= b.x + b.w && c.y >= b.y && c.y <= b.y + b.h);
        if (b) { LPK.audio.sfx.click(); b.action(); break; }
      }
    },
    handleMenuKeys(game) {
      const I = LPK.input, items = game.ui.items || [];
      if (!items.length && !game.ui.keyLeftRight) return;
      const move = (d) => {
        if (!items.length) return;
        let i = game.ui.sel;
        for (let k = 0; k < items.length; k++) { i = (i + d + items.length) % items.length; if (items[i].enabled) break; }
        game.ui.sel = i; LPK.audio.sfx.click();
      };
      if (I.pressed("up")) move(-1);
      if (I.pressed("down")) move(1);
      if (game.ui.keyLeftRight && I.pressed("left")) game.ui.keyLeftRight(-1);
      if (game.ui.keyLeftRight && I.pressed("right")) game.ui.keyLeftRight(1);
      if (I.pressed("act") && items[game.ui.sel] && items[game.ui.sel].enabled) { LPK.audio.sfx.click(); items[game.ui.sel].action(); }
      else if (I.pressed("pause") && game.ui.back) game.ui.back();
    },
    draw(game, c) {
      G = game; ctx = c; W = window.innerWidth; H = window.innerHeight;
      u = Math.max(11, Math.min(20, Math.min(W, H) / 30));
      G.ui.buttons = []; G.ui.items = []; G.ui.back = null; G.ui.keyLeftRight = null;
      if (G.screen !== "title") G.ui.confirmStart = false;
      if (G.screen !== "settings") G.ui.confirmReset = false;
      switch (G.screen) {
        case "title": drawTitle(); break;
        case "play": drawHUD(); drawCelebration(); drawTouch(); break;
        case "pause": drawPause(); break;
        case "profiles": drawProfiles(); break;
        case "achievements": drawAchievements(); break;
        case "settings": drawSettings(); break;
        case "skip": drawSkip(); break;
        case "wardrobe": drawWardrobe(); break;
      }
      if (G.screen !== "play") LPK.input.touchButtons = [];
      drawToasts();
      if (G.ui.sel >= G.ui.items.length) G.ui.sel = 0;
    },
  };
})();
