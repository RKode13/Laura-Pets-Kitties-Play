// LEVEL 5 — THE KITTY OLYMPICS (spec 13): one event per cat, each suited to
// its abilities, with gold / silver / bronze medals.
//   CC:          GQ Grand Prix — lead him through 3 gold rings with his spring, then the climb
//   Orangey:     Agility (sort of) — cheer at the right moment or he "nails it"
//   Marshmallow: Nap-athlon — best Turbo Back Pats combo in 60 seconds
window.LPK = window.LPK || {};
LPK.scripts = LPK.scripts || {};

(() => {
  const T = 16;
  const D = () => LPK.dialogue;
  const pick = (l) => l[Math.floor(Math.random() * l.length)];
  const MEDAL = { gold: "🥇 GOLD", silver: "🥈 SILVER", bronze: "🥉 BRONZE" };

  function toLiving(G) {
    if (G.room !== "livingRoom") G.switchRoom("livingRoom", G.room === "kitchen" ? "toKitchen" : "toKitchen");
  }
  function finish(G, event, medal, note) {
    const O = G.olympics;
    O.event = null; O.phase = null;
    const medals = LPK.save.data.medals = LPK.save.data.medals || {};
    const rank = { bronze: 1, silver: 2, gold: 3 };
    if (!medals[event] || rank[medal] > rank[medals[event]]) medals[event] = medal;
    O.last = { event, medal };
    G.notify(MEDAL[medal], note);
    LPK.audio.sfx.achievement();
    LPK.events.emit("olympicDone", { event, medal });
    if (["cc", "pop", "marsh"].every(e => medals[e] === "gold")) LPK.events.emit("tripleGold", {});
  }

  // ---------------------------------------------------------------- setup
  LPK.scripts.olympicsSetup = (G) => {
    G.olympics = G.olympics || { medals: {} };
    if (G.clock.hour < 9 || G.clock.hour > 18) G.skipTo(10 * 60, false);
    toLiving(G);
  };

  // ---------------------------------------------------------------- CC
  LPK.scripts.olympicsCC = (G) => {
    toLiving(G);
    G.olympics = Object.assign(G.olympics || {}, { event: "cc", phase: "lead", t: 0, ring: 0,
      rings: [{ x: 6.5 * T, y: 10.5 * T }, { x: 12 * T, y: 7.6 * T }, { x: 16.5 * T, y: 11.3 * T }] });
    const cc = G.cat("cc"); cc.stopMoving(); cc.placeAt("livingRoom.rugCenter"); cc.setState("sit", 5);
    const toy = G.toys.find(t => t.id === "springBlue");
    toy.room = "livingRoom"; toy.held = false; toy.x = G.laura.x + 14; toy.y = G.laura.y + 2;
    G.laura.say("Grab the spring — CC will follow it!", 3);
  };
  // CC's brain during the Grand Prix (returns true when it took over)
  LPK.olympicsCCThink = (cc) => {
    const G = cc.game, O = G.olympics;
    if (!O || O.event !== "cc" || O.phase === "climbing") return false;
    if (G.holdingToy && G.room === cc.room) {
      if (cc.cooldown("olyFollow")) return true;
      cc.setCooldown("olyFollow", 0.4);
      const L = G.laura, d = cc.distTo(L);
      if (d > 18) cc.goTo({ room: cc.room, tx: Math.floor(L.x / T), ty: Math.floor(L.y / T) }, d > 60 ? "sprint" : "run", () => cc.setState("sit", 0.3));
      else cc.setState("sit", 0.3);
    } else if (cc.state !== "sit") cc.setState("sit", 1);
    return true;
  };

  // ---------------------------------------------------------------- Orangey
  LPK.scripts.olympicsPop = (G) => {
    toLiving(G);
    const pop = G.cat("popsicle"); pop.stopMoving(); pop.placeAt("livingRoom.rugCenter"); pop.setState("sit", 2);
    pop.scripted = true;
    G.olympics = Object.assign(G.olympics || {}, { event: "pop", phase: "go", idx: 0, wins: 0, t: 0,
      jumps: ["livingRoom.sectionalEnd", "livingRoom.catTreeCubby", "livingRoom.catTreeTop"] });
    G.laura.say("Orangey's agility course! Cheer when he wiggles!", 3);
  };

  // ---------------------------------------------------------------- Marshmallow
  LPK.scripts.olympicsMarsh = (G) => {
    toLiving(G);
    const m = G.cat("marshmallow"); m.stopMoving(); m.concealed = false; m.placeAt("livingRoom.rugByLamp"); m.setState("sleep", 999);
    for (const b of G.cats.filter(c => c.id !== "marshmallow")) { b.stopMoving(); b.scripted = false; b.placeAt("backRoom.bigRug"); b.setState("sleep", 90); }
    G.olympics = Object.assign(G.olympics || {}, { event: "marsh", phase: "pats", t: 60, best: 0 });
    G.laura.sayRandom(D().lauraOlyMarsh, 2.5);
  };

  // ---------------------------------------------------------------- toss hook
  // Returns true if the Olympics handled the toss (so CC doesn't do a normal chase)
  LPK.olympicsOnToss = (G, toy) => {
    const O = G.olympics;
    if (!O || O.event !== "cc" || O.phase !== "climb") return false;
    if (Math.hypot(toy.x - 2.5 * T, toy.y - 8 * T) > 56) { G.laura.say("Closer to the cat tree!", 1.8); return false; }
    O.phase = "climbing";
    const cc = G.cat("cc"); cc.stopMoving();
    cc.goTo("livingRoom.catTreeTop", "sprint", () => {
      cc.setState("sit", 6); cc.say("*victory pose*", 2);
      const medal = O.t < 35 ? "gold" : O.t < 60 ? "silver" : "bronze";
      finish(G, "cc", medal, `CC's GQ Grand Prix in ${Math.round(O.t)} seconds!`);
    });
    return true;
  };

  // ---------------------------------------------------------------- per-frame
  LPK.olympicsUpdate = (G, dt, input) => {
    const O = G.olympics;
    if (!O || !O.event) return;
    if (O.event === "cc") {
      O.t += dt;
      const cc = G.cat("cc");
      if (O.phase === "lead" && cc.room === "livingRoom") {
        const r = O.rings[O.ring];
        if (r && Math.hypot(cc.x - r.x, cc.y - r.y) < 14) {
          O.ring++; LPK.audio.sfx.found(); G.addHeart(cc);
          G.laura.sayRandom(O.ring >= 3 ? D().lauraOlyClimb : D().lauraOlyRing, 2);
          if (O.ring >= 3) O.phase = "climb";
        }
      }
    } else if (O.event === "pop") {
      const pop = G.cat("popsicle");
      if (O.phase === "go") {
        const spot = LPK.getSpot(O.jumps[O.idx]);
        O.phase = "walking";
        pop.goTo({ room: "livingRoom", tx: spot.approach[0], ty: spot.approach[1] }, "walk", () => {
          pop.flip = spot.x * T < pop.x; pop.setState("prep", 99); O.phase = "cheer"; O.cheerT = 0;
        });
      } else if (O.phase === "cheer") {
        O.cheerT += dt;
        O.marker = (Math.sin(O.cheerT * 3.2) + 1) / 2;
        const pressed = input.pressed("act");
        if (pressed || O.cheerT > 4.5) {
          const good = pressed && O.marker > 0.36 && O.marker < 0.64;
          G.laura.sayRandom(good ? D().lauraCheer : D().lauraCheerMiss, 1.6);
          jump(G, pop, good);
        }
      }
    } else if (O.event === "marsh") {
      O.t -= dt;
      const s = G.petting.session;
      if (s && s.cat.id === "marshmallow") O.best = Math.max(O.best, Math.floor(s.best));
      if (O.best >= 25 || O.t <= 0) {
        G.petting.stop("olympics");
        const medal = O.best >= 25 ? "gold" : O.best >= 15 ? "silver" : "bronze";
        finish(G, "marsh", medal, `Marshmallow's Nap-athlon: a ${O.best}-pat Turbo combo!`);
        G.cat("marshmallow").settle();
      }
    }
  };
  // Orangey's jump: a good cheer means a clean jump; otherwise... "nailed it"
  function jump(G, pop, good) {
    const O = G.olympics, spot = LPK.getSpot(O.jumps[O.idx]);
    const to = { x: spot.x * T, y: spot.y * T, z: spot.z };
    const from = { x: pop.x, y: pop.y, z: pop.z };
    O.phase = "airborne";
    const next = () => {
      O.idx++;
      if (O.idx >= O.jumps.length) {
        pop.scripted = false;
        const medal = O.wins >= 3 ? "gold" : O.wins >= 2 ? "silver" : "bronze";
        finish(G, "pop", medal, O.wins >= 2 ? `Orangey landed ${O.wins} of 3 jumps!` : "Orangey: extremely enthusiastic participation.");
      } else O.phase = "go";
    };
    pop.state = "sit";
    if (good) {
      O.wins++;
      pop.tasks = [
        { type: "hopRaw", to, after: () => { pop.spot = spot; pop.say("*nailed it (for real)*", 1.6); G.addHeart(pop); LPK.audio.sfx.found(); } },
        { type: "wait", state: "sit", secs: 1.4 },
        { type: "call", fn: next },
      ];
    } else {
      pop.tasks = [
        { type: "hopRaw", to: { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2, z: to.z * 0.55 } },
        { type: "hopRaw", to: from, after: () => { pop.say(pick(D().popFail), 2); LPK.audio.sfx.startle(); LPK.events.emit("clumsyJump", { cat: "popsicle" }); } },
        { type: "wait", state: "sit", secs: 1.4 },
        { type: "call", fn: next },
      ];
    }
    pop.nextTask();
  }

  // ---------------------------------------------------------------- Level 6
  LPK.scripts.ultimateSetup = (G) => {
    const rec = LPK.save.data.missions.ultimateCuddle;
    if (!rec || rec.day === undefined) {
      G.skipTo(9 * 60, false);
      LPK.save.data.missions.ultimateCuddle = { doneSteps: [], day: G.clock.day };
      LPK.save.write();
    }
    G.flags.bellyBoost = true;
  };
})();
