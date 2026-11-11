// Orangey tries to sneak up on Marshmallow. Big mistake. She stands up,
// SLAPS him across the face — "What up, bish?" — he hunkers down, backs
// away real slow, then slinks off fast. "That's what I thought, fool."
// Only happens when Laura is in the room, so you get to see it.
window.LPK = window.LPK || {};

LPK.sneak = (() => {
  let S = null, cool = 150;
  const CALM = ["sit", "sleep", "grumble"];
  const line = (o) => LPK.save.data.settings.familyFriendly ? o.family : o.normal;

  function can(G) {
    const m = G.cat("marshmallow"), pop = G.cat("popsicle");
    if (!m || !pop || G.olympics || G.petting.active || LPK.catFight.active) return false;
    if (m.room !== G.room || pop.room !== G.room) return false;
    for (const c of [m, pop]) if (c.concealed || c.scripted || c.fighting || c.begging || c.zoomies || c.moving || c.z > 0) return false;
    return CALM.includes(m.state) && ["sit", "sleep", "box", "confused", "beg"].includes(pop.state) && Math.hypot(m.x - pop.x, m.y - pop.y) < 170;
  }
  function start(G) {
    const m = G.cat("marshmallow"), pop = G.cat("popsicle");
    m.stopMoving(); pop.stopMoving();
    m.fighting = true; pop.fighting = true;
    S = { m, pop, phase: "sneak", t: 0, was: m.state, side: pop.x < m.x ? -1 : 1 };
    pop.say(pop.pick(LPK.dialogue.popSneak), 1.4);
    pop.sneaking = true;
    const ok = pop.goTo({ room: m.room, tx: Math.floor((m.x + S.side * 14) / 16), ty: Math.floor(m.y / 16) }, "sneak", () => { if (S) { S.phase = "reach"; S.t = 0; } });
    if (!ok) { S.phase = "reach"; }
  }
  function end() {
    if (!S) return;
    const { m, pop } = S;
    m.fighting = false; pop.fighting = false; pop.sneaking = false; m.fightPose = null; pop.fightPose = null;
    S = null; cool = 240 + Math.random() * 240;
  }
  function update(G, dt) {
    if (!S) {
      if ((cool -= dt) > 0) return;
      if (can(G) && Math.random() < dt / 50) start(G);
      return;
    }
    const { m, pop } = S, D = LPK.dialogue;
    S.t += dt;
    if (m.room !== pop.room) return end();
    switch (S.phase) {
      case "sneak":
        if (S.t > 20) { pop.stopMoving(); S.phase = "reach"; S.t = 0; }
        break;
      case "reach":                                            // she stands up and SLAPS him
        if (!S.slapped) {
          S.slapped = true; pop.sneaking = false;
          m.fightPose = "trash"; m.flip = pop.x < m.x; pop.flip = m.x < pop.x;
          LPK.audio.sfx.slap(); G.shake = 0.15;
          S.star = { x: pop.x + (m.x < pop.x ? -3 : 3), y: pop.y - 12, t: 0 };
          pop.x += (pop.x < m.x ? -3 : 3);                     // the smack knocks his head back
          m.say(line(D.marshSlap), 2.2);
        }
        if (S.t > 1.4) { S.phase = "backoff"; S.t = 0; pop.fightPose = "hunker"; }
        break;
      case "backoff": {                                        // hunkered down... backing away... real... slow...
        const dir = pop.x < m.x ? -1 : 1, nx = pop.x + dir * 9 * dt;
        if (G.worlds[pop.room].pointOpen(nx, pop.y)) pop.x = nx;
        pop.flip = m.x < pop.x;
        if (S.t > 1.8) {
          S.phase = "slink"; S.t = 0; pop.fightPose = null; pop.fighting = false;
          const far = pop.def.restingSpots.filter(k => !k.startsWith(pop.room + "."));
          pop.goTo(far[Math.floor(Math.random() * far.length)] || pop.def.restingSpots[0], "sprint", () => pop.setState("sit", 4));
          LPK.audio.sfx.startle();
        }
        break;
      }
      case "slink":
        if (S.t > 1.0 && !S.said) { S.said = true; m.fightPose = null; m.say(line(D.marshThought), 2.6); if (m.sameRoomAsLaura()) LPK.events.emit("slap", {}); }
        if (S.t > 3.6) {                                       // ...and back to her nap (or whatever she was doing)
          if (S.was === "sleep") m.settle(); else m.setState(S.was === "grumble" ? "sit" : S.was, 6);
          end();
        }
        break;
    }
    if (S && S.star) S.star.t += dt;
  }
  function drawItems(items, G) {
    if (!S || !S.star || S.star.t > 0.6 || S.m.room !== G.room) return;
    const st = S.star, P = LPK.px;
    items.push({ sortY: 9997, draw: (g) => {
      const r = 3 + st.t * 10;
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; P.rect(g, st.x + Math.cos(a) * r, st.y + Math.sin(a) * r, 2, 2, i % 2 ? "#ffd166" : "#ffffff"); }
      P.rect(g, st.x - 1, st.y - 1, 3, 3, "#ffe680");
    } });
  }
  function focus(G) {
    if (!S || S.phase === "sneak" || S.m.room !== G.room) return null;
    return { x: (S.m.x + S.pop.x) / 2, y: (S.m.y + S.pop.y) / 2 - 12 };
  }
  return { update, drawItems, focus, end, get active() { return !!S; }, start: (G) => start(G) };
})();
