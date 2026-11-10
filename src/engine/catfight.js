// The boys' wrestling matches: every so often Blacky (CC) picks a fight with
// Orangey (Popsicle). A cartoon scuffle cloud, then Blacky finishes it like a
// pro wrestler — a SUPLEX, or a FLYING ELBOW DROP off something high — pins
// him for the 1... 2... 3!, Orangey runs off, and Blacky shows off his
// championship belt with his elbows out and paws on his hips.
// Only starts when Laura is in the same room, so you get to see it.
window.LPK = window.LPK || {};

LPK.catFight = (() => {
  const CALM = ["sit", "sleep", "box", "confused", "intrigued", "inspect"];
  let F = null, cool = 90;                       // first one can't happen right away

  function canFight(G) {
    const cc = G.cat("cc"), pop = G.cat("popsicle");
    if (!cc || !pop || G.olympics || G.petting.active || G.bellyGame) return false;
    if (cc.room !== G.room || pop.room !== G.room) return false;
    for (const c of [cc, pop]) {
      if (c.concealed || c.scripted || c.begging || c.zoomies || c.moving || c.z > 0 || !CALM.includes(c.state)) return false;
    }
    return Math.hypot(cc.x - pop.x, cc.y - pop.y) < 150;
  }

  // a high place in the room to dive off (counter, cat tree, dresser...)
  function perch(G, pop) {
    const r = LPK.rooms[pop.room], T = 16;
    const spots = Object.entries(r.restingSpots || {}).map(([id]) => LPK.getSpot(`${pop.room}.${id}`))
      .filter(s => s.z >= 14 && Math.hypot(s.x * T - pop.x, s.y * T - pop.y) < 110);
    return spots.sort((a, b) => Math.hypot(a.x * T - pop.x, a.y * T - pop.y) - Math.hypot(b.x * T - pop.x, b.y * T - pop.y))[0] || null;
  }

  function say(text, t = 1.4) { const G = LPK.game; G.fightText = { text, t, total: t }; }

  function start(G) {
    const cc = G.cat("cc"), pop = G.cat("popsicle");
    for (const c of [cc, pop]) { c.stopMoving(); c.stopEating && c.stopEating(); c.fighting = true; c.fightPose = null; }
    F = { cc, pop, phase: "approach", t: 0, move: perch(G, pop) && Math.random() < 0.5 ? "elbow" : "suplex" };
    pop.say("!", 1); cc.say(cc.pick(LPK.dialogue.fightCC), 1.4);
    const side = cc.x < pop.x ? -1 : 1;
    const ok = cc.goTo({ room: pop.room, tx: Math.floor((pop.x + side * 14) / 16), ty: Math.floor(pop.y / 16) }, "sprint", () => { F && (F.phase = "scuffle", F.t = 0); });
    if (!ok) { F.phase = "scuffle"; }
    G.laura.sayRandom(LPK.dialogue.lauraFight, 1.8);
  }

  function end(G) {
    if (!F) return;
    for (const c of [F.cc, F.pop]) { c.fighting = false; c.fightHidden = false; c.fightPose = null; }
    F = null; cool = 150 + Math.random() * 120;
  }

  function update(G, dt) {
    if (!F) {
      if ((cool -= dt) > 0) return;
      if (canFight(G) && Math.random() < dt / 60) start(G);       // about once a minute while they're both hanging around
      return;
    }
    const { cc, pop } = F;
    F.t += dt;
    if (cc.room !== pop.room || (F.phase !== "approach" && F.phase !== "flee" && F.phase !== "champ" && (pop.state === "petted" || cc.state === "petted"))) return end(G);
    switch (F.phase) {
      case "approach":
        if (F.t > 6) { F.phase = "scuffle"; F.t = 0; }
        break;
      case "scuffle":                                  // the dust cloud of fury
        cc.fightHidden = pop.fightHidden = true;
        F.cx = (cc.x + pop.x) / 2; F.cy = (cc.y + pop.y) / 2;
        if ((F.hissT = (F.hissT || 0) - dt) <= 0) { F.hissT = 0.45; LPK.audio.sfx.hiss(); (Math.random() < 0.5 ? cc : pop).say(cc.pick(LPK.dialogue.fightHiss), 0.6); }
        if (F.t > 2.8) {
          cc.fightHidden = pop.fightHidden = false;
          cc.flip = pop.x < cc.x;
          F.phase = F.move === "elbow" ? "climb" : "grab"; F.t = 0;
          if (F.move === "elbow") {
            const p = perch(G, pop);
            if (!p) { F.move = "suplex"; F.phase = "grab"; break; }
            cc.startHop({ x: p.x * 16, y: p.y * 16, z: p.z }); cc.hop.after = null; cc.tasks = [];
            pop.fightPose = "sit"; pop.flip = cc.x < pop.x; pop.say("?!", 1.2);
          } else say("SUPLEX!", 1.6);
        }
        break;
      // ---------------- finisher 1: the suplex
      case "grab":
        if (F.t > 0.45) {
          F.phase = "flip"; F.t = 0;
          F.fx = pop.x; F.tx = cc.x + (cc.x - pop.x); F.ty = pop.y;
          if (!G.world.boxFree(F.tx - 4, F.ty - 3, 8, 4)) F.tx = cc.x;
          pop.fightPose = "bellyUp";
        }
        break;
      case "flip": {
        const p = Math.min(1, F.t / 0.7);
        pop.x = F.fx + (F.tx - F.fx) * p; pop.z = Math.sin(p * Math.PI) * 26;
        cc.fightPose = "stand";
        if (p >= 1) { pop.z = 0; slam(G); }
        break;
      }
      // ---------------- finisher 2: the flying elbow drop
      case "climb":
        if (cc.state === "hop") break;
        if (!F.onTop) { F.onTop = true; F.t = 0; cc.state = "stand"; cc.flip = pop.x < cc.x; cc.say("OHHH YEAH!", 1.2); say("TO THE TOP ROPE!", 1.2); }
        if (F.t > 1.0) {
          F.phase = "dive"; F.t = 0;
          cc.startHop({ x: pop.x + (cc.x < pop.x ? -3 : 3), y: pop.y + 1, z: 0 }); cc.hop.after = null; cc.tasks = [];
          say("FLYING ELBOW DROP!", 1.6);
        }
        break;
      case "dive":
        if (cc.state === "hop") break;
        pop.fightPose = "bellyUp"; slam(G);
        break;
      // ---------------- the pin
      case "pin": {
        cc.state = "stand"; cc.fightPose = "stand";
        cc.x = pop.x + (cc.flip ? 3 : -3); cc.y = pop.y + 1; cc.z = 4;
        const n = Math.floor(F.t / 0.75);
        if (n > (F.count || 0) && n <= 3) { F.count = n; say(n === 3 ? "1... 2... 3!" : n === 2 ? "1... 2..." : "1...", n === 3 ? 1.4 : 0.8); LPK.audio.sfx.bell(); }
        if (F.t > 2.7) {
          // Orangey makes a run for it
          F.phase = "champ"; F.t = 0;
          cc.z = 0; cc.fightPose = "champ"; cc.flip = false;
          pop.fightPose = null; pop.fighting = false;
          const far = pop.def.restingSpots.filter(k => !k.startsWith(pop.room + "."));
          pop.say(pop.pick(LPK.dialogue.fightPop), 1.4); LPK.audio.sfx.startle();
          pop.goTo(far[Math.floor(Math.random() * far.length)] || pop.def.restingSpots[0], "sprint", () => pop.setState("sit", 4));
          say("AND STILL CHAMPION... BLACKY!", 2.6); LPK.audio.sfx.cheer();
          if (G.room === cc.room) LPK.events.emit("catFight", { move: F.move });
        }
        break;
      }
      case "champ":                                    // belt on, elbows out, paws on hips, big grin
        if (F.t > 4.2) { cc.setState("sit", 5); end(G); }
        break;
    }
  }
  function slam(G) {
    F.phase = "pin"; F.t = 0; F.count = 0;
    G.shake = 0.35; LPK.audio.sfx.slam();
  }

  // dust cloud with paws, tails and stars flying out
  function drawItems(items, G) {
    if (!F || F.phase !== "scuffle" || F.cc.room !== G.room) return;
    const x = F.cx, y = F.cy, t = G.time, P = LPK.px;
    items.push({ sortY: y + 4, draw: (g) => {
      for (let i = 0; i < 9; i++) {
        const a = i * 0.7 + t * 9, rx = 9 + Math.sin(t * 13 + i) * 3;
        P.ellipse(g, x + Math.cos(a) * rx, y - 10 + Math.sin(a * 1.3) * 6, 6 + (i % 3), 5, i % 2 ? "#e8e4dc" : "#cfc9be");
      }
      const k = Math.floor(t * 10) % 4;
      P.rect(g, x - 14 + k * 3, y - 16, 4, 2, "#26232a"); P.rect(g, x + 10 - k * 2, y - 6, 5, 2, "#d9772b");   // flailing paws
      P.rect(g, x + 8, y - 22 + k, 2, 6, "#26232a"); P.rect(g, x - 12, y - 4 - k, 6, 2, "#d9772b");             // tails
      for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; P.rect(g, x + Math.cos(a) * 16, y - 18 + Math.sin(a) * 6, 2, 2, "#ffd166"); }
    } });
  }

  // where the camera should look while a match is on (in Laura's room)
  function focus(G) {
    if (!F || F.phase === "approach" || F.cc.room !== G.room) return null;
    const c = F.cc, p = F.pop;
    if (F.phase === "champ") return { x: c.x, y: c.y - 10 };
    return { x: (c.x + p.x) / 2, y: (c.y + p.y) / 2 - 12 - Math.max(c.z, p.z) / 2 };
  }

  return { update, drawItems, focus, start: (G) => start(G), get active() { return !!F; }, end };
})();
