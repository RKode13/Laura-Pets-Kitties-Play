// Laura Pets Kitties — main game: rooms, screens, camera, update loop.
window.LPK = window.LPK || {};

LPK.game = (() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const buffer = document.createElement("canvas");
  const bctx = buffer.getContext("2d");
  const input = LPK.input;
  input.bind(canvas);
  const D = () => LPK.dialogue;

  const G = {
    screen: "title", prevScreen: "title",
    worlds: {}, room: "livingRoom", world: null,
    laura: null, cats: [], clock: null,
    petting: null, progression: null,
    floaters: [], celebration: null, prompt: null,
    bowls: {}, holding: null, foodMenu: null, clues: [], flags: {}, trashOpen: false,
    cam: { x: 0, y: 0 }, S: 4, dpr: 1, viewW: 0, viewH: 0, fade: 0,
    time: 0, notices: {},
    ui: { buttons: [], sel: 0, page: 0, profile: "laura", confirmReset: false },
  };

  // --------------------------------------------------------- setup
  function buildWorld() {
    G.worlds = {};
    for (const [id, r] of Object.entries(LPK.rooms)) if (r.available) G.worlds[id] = new LPK.World(id);
    G.room = "livingRoom"; G.world = G.worlds.livingRoom;
    const st = G.world.def.lauraStart, T = G.world.T;
    G.laura = new LPK.Laura(G.world, st.x * T, st.y * T);
    G.bowls = { herBowl: { owner: "marshmallow", food: null, eater: null }, boysBowls: { owner: "boys", food: null, eater: null } };
    G.holding = null; G.foodMenu = null; G.clues = []; G.flags = {}; G.trashOpen = false;
    G.cats = [new LPK.Marshmallow(G), new LPK.CC(G), new LPK.Popsicle(G)];
    G.toys = [];
    for (const [room, r] of Object.entries(LPK.rooms)) if (r.available) (r.toys || []).forEach(t => G.toys.push({ ...t, room, x: t.x * 16 + 8, y: t.y * 16 + 8, bounce: 0 }));
    G.holdingToy = null; G.springTosses = 0; G.bellyGame = null;
    G.olympics = null; G.freePlay = false; G.hangoutDone = false; G.dailyFull = null; G.clown = null; G.clownCool = 0;
    G.garageOpen = 0; G.garageTarget = 0;
    G.desk = { screen: "idle", coffee: "full", session: null }; G.choiceMenu = null;
    G.robert = new LPK.Robert(G);
    G.robert.sync();
    G.evan = new LPK.Evan(G);
    G.evan.sync();
    G.owen = new LPK.Owen(G);
    G.owen.sync();
    G.joe = new LPK.Joe(G);
    G.joe.sync(); G.cupView = null;
    G.ro = new LPK.Ro(G);
    G.ro.sync();
    LPK.catFight.end(G); LPK.sneak.end(); G.fightText = null; G.shake = 0; G.hungry = null; G.hungryCool = 60; G.smoochOwed = false; G.smooches = null; G.affirm = null; G.affirmDay = null; G.affirmNoteDay = null; G.peek = null; G.tv = null; G.tvScare = null; G.debris = []; G.dishwasher = null; G.laundry = null;
    G.petting = new LPK.Petting(G);
    G.floaters = []; G.celebration = null; G.notices = {};
    G.cam.x = G.laura.x - 100; G.cam.y = G.laura.y - 100;
  }
  G.progression = new LPK.Progression(G);
  G.notify = (title, text) => { G.progression.toasts.push({ title, text, t: 4.5 }); };
  // Robert's Food Guard ends happily when Marshmallow finishes in peace
  LPK.events.on("ateInPeace", () => { if (G.robert && G.robert.mode === "dinner") G.robert.endGuard(true); });
  // Level 4: calm the household — pet all three cats
  LPK.events.on("petProgress", (p) => {
    if (!G.calmSet || p.gained < 10) return;
    G.calmSet.add(p.cat);
    if (G.calmSet.size >= 3) { G.calmSet = null; LPK.events.emit("calmAll", {}); }
  });
  G.cat = (id) => G.cats.find(c => c.id === id);

  function startMissionBanner() {
    const m = G.progression.currentMission();
    G.banner = m ? { title: `Level ${m.level}: ${m.name}`, text: m.intro, t: 4.5 } : null;
  }
  G.newGame = () => {
    LPK.save.newGame();
    G.clock = new LPK.Clock(LPK.config.startDay, LPK.Clock.parse(LPK.config.startTime));
    buildWorld();
    G.screen = "play";
    G.laura.sayRandom(D().lauraStart, 3.2);
    G.progression.setupCurrent();
    startMissionBanner();
  };
  G.continueGame = () => {
    const s = LPK.save.data;
    G.clock = s.clock ? new LPK.Clock(s.clock.day, s.clock.minutes) : new LPK.Clock(LPK.config.startDay, LPK.Clock.parse(LPK.config.startTime));
    buildWorld();
    G.screen = "play";
    G.progression.setupCurrent();
    startMissionBanner();
  };
  G.startFreePlay = () => {
    G.continueGame();
    G.freePlay = true; G.banner = { title: "Free Play", text: "No missions — just you and the kitties. Daily goal: fill all three Purr Meters!", t: 4 };
    G.laura.sayRandom(D().lauraFreePlay, 2.5);
  };
  G.saveNow = () => {
    if (!G.clock) return;
    const s = LPK.save.data;
    s.hasGame = true;
    s.clock = { day: G.clock.day, minutes: G.clock.minutes };
    G.cats.forEach(c => s.cats[c.id] = c.toSave());
    LPK.save.write();
  };

  // --------------------------------------------------------- level scripts
  // Named scripted moments used by missions.js
  const scripts = {
    hideMarshmallow() {
      const m = G.cat("marshmallow"), spots = m.def.hidingSpots;
      const key = spots[Math.floor(Math.random() * spots.length)];
      m.hideAt(key);
      const s = LPK.getSpot(key), T = LPK.config.tile;
      G.clues = [{ room: s.room, x: s.approach[0] * T + 10, y: s.approach[1] * T + 12 }];
      // a trail of fur leading out of the room she's NOT in
      const other = s.room === "kitchen" ? "livingRoom" : "kitchen";
      const ex = G.worlds[other].exitTo(s.room);
      if (ex) { const p = G.worlds[other].entryPoint(ex.id); G.clues.push({ room: other, x: p.x + 6, y: p.y + 14 }); }
      const ex2 = G.worlds[s.room].exitTo(other);
      if (ex2) { const p = G.worlds[s.room].entryPoint(ex2.id); G.clues.push({ room: s.room, x: p.x - 8, y: p.y + (p.y > 100 ? -18 : 18) }); }
    },
    marshmallowToKitchen() {
      const m = G.cat("marshmallow");
      m.concealed = false; m.placeAt("kitchen.kitchenMat"); m.setState("sleep", 60);
    },
    popsicleToTrash() { const p = G.cat("popsicle"); p.forcedTrash = true; p.stopEating(); p.goRaidTrash(9999); },
    emptyHerBowl() { G.bowls.herBowl.food = null; },
    boysWantHerFood() { G.flags.boysGreedy = true; },
    midnightZoomies() {
      G.skipTo(23 * 60 + 50, false);
      G.flags.zoomies = true;
      const m = G.cat("marshmallow"); m.concealed = false; m.placeAt("livingRoom.rugByLamp"); m.setState("sleep", 999);
    },
    endZoomies() {
      G.flags.zoomies = false;
      const cc = G.cat("cc"), fav = G.toys.find(t => t.favorite);
      cc.stopMoving();
      cc.goTo({ room: fav.room, tx: Math.floor(fav.x / 16), ty: Math.floor(fav.y / 16) }, "sprint", () => { cc.x = fav.x; cc.y = fav.y + 2; cc.setState("springGuard", 9999); });
    },
    boysBotherMarshmallow() {
      const m = G.cat("marshmallow"); m.cool = {}; G.flags.forceStare = true;
      if (m.state !== "sleep" && m.state !== "sit") m.setState("sleep", 999);
      for (const b of G.cats.filter(c => c.id !== "marshmallow")) {
        b.stopMoving(); b.setState("sit", 0);
        b.goTo({ room: m.room, tx: m.spot.approach[0] + (b.id === "cc" ? 1 : -1), ty: m.spot.approach[1] }, "run", () => b.setState("sit", 8));
      }
    },
    startCalmAll() { G.flags.forceStare = false; G.calmSet = new Set(); },
  };
  G.runScript = (name) => { if (scripts[name]) scripts[name](); else if (LPK.scripts && LPK.scripts[name]) LPK.scripts[name](G); };

  G.addHeart = (cat) => {
    const h = cat.headPos();
    G.floaters.push({ room: cat.room, x: h.x + (Math.random() * 10 - 5), y: h.y - 4, t: 0, kind: "heart" });
    G.progression.addPoints(LPK.config.pointsPerHeart);
    LPK.audio.sfx.heart();
  };

  G.celebrate = (mission) => {
    G.petting.stop("celebrate");
    G.laura.state = "celebrate";
    G.laura.sayRandom(D().lauraCelebrate, 4);
    G.celebration = { mission, t: 0, finale: !!mission.finale, medals: Object.assign({}, LPK.save.data.medals || {}) };
    if (mission.finale) { LPK.save.data.freePlay = true; LPK.save.write(); }
    G.flags = {};
    LPK.audio.sfx.celebrate();
    G.saveNow();
  };
  G.endCelebration = () => {
    G.celebration = null; G.laura.state = "idle";
    G.progression.setupCurrent();
    startMissionBanner();
  };

  // --------------------------------------------------------- rooms
  // Safety net: if Laura ever ends up overlapping furniture (so no move is
  // allowed), slide her to the nearest open spot.
  function unstickLaura() {
    const L = G.laura, w = G.world;
    if (w.boxFree(L.x - 4, L.y - 3, 8, 4)) return;
    for (let r = 2; r <= 40; r += 2)
      for (let a = 0; a < 16; a++) {
        const x = L.x + Math.round(Math.cos(a * Math.PI / 8) * r), y = L.y + Math.round(Math.sin(a * Math.PI / 8) * r);
        if (w.boxFree(x - 4, y - 3, 8, 4)) { L.x = x; L.y = y; return; }
      }
  }
  G.unstickLaura = unstickLaura;

  G.switchRoom = (to, toExit) => {
    const w = G.worlds[to]; if (!w) return;
    const visited = LPK.save.data.visited = LPK.save.data.visited || {};
    if (to === "basement" && !visited.basement) setTimeout(() => G.laura.sayRandom(D().lauraBasement, 2.4), 400);
    visited[to] = true;
    if (visited.garage && visited.basement) LPK.events.emit("exploredAll", {});
    G.room = to; G.world = w; G.laura.world = w;
    const p = w.entryPoint(toExit);
    G.laura.x = p.x; G.laura.y = p.y;
    unstickLaura();
    G.fade = 0.35;
    G.cam.x = p.x - G.viewW / 2; G.cam.y = p.y - G.viewH / 2;
    LPK.audio.sfx.door();
  };

  // --------------------------------------------------------- interactions
  // Everything Laura can press Pet/Use on, nearest first.
  function findTarget() {
    const L = G.laura, ip = L.interactPoint(), T = G.world.T;
    if (L.state === "rest") return { kind: "getUp", label: "Get up", ok: true };
    const ev = G.evan;
    if (ev && ev.room === G.room && ev.distTo(L) < 34 && ev.state !== "sleep") {
      if (ev.inBedtimeWindow()) return { kind: "evanBed", label: "It's bedtime, Evan!", ok: true };
      if (ev.state === "askSnack") return { kind: "evanSnack", label: `Give Evan some ${ev.snackWant}`, ok: true };
    }
    const jo = G.joe;
    if (jo && jo.present && jo.room === G.room && jo.holding === "cup" && !jo.sc && jo.distTo(L) < 36) return { kind: "joeCup", label: "Take your cappuccino from Joe", ok: true };
    if (G.joeTreats && G.room === "kitchen" && !jo.donutTaken && Math.hypot(L.x - 17 * T, L.y - 10.8 * T) < 26) return { kind: "donut", label: "Grab a donut", ok: true };
    const ow = G.owen;
    if (ow && ow.room === G.room && ow.distTo(L) < 36 && ow.state !== "sleep" && ow.state !== "streaks" && ow.streakWindow()) return { kind: "owenStreak", label: "Owen, do your streaks!", ok: true };
    const mess = (G.debris || []).filter(p => p.room === G.room && p.z === 0 && Math.hypot(p.x - L.x, p.y - L.y) < 30).length;
    if (mess >= 4) return { kind: "sweep", label: "Sweep up the cardboard", ok: true };
    const popc = G.cat("popsicle");
    if (popc.state === "sinkEat" && popc.room === G.room && Math.hypot(popc.x - L.x, popc.y - L.y) < 40) return { kind: "shoo", label: "Get Orangey off the counter!", ok: true };
    const Rb = G.robert;
    if (G.smoochOwed && Rb.present && Rb.room === G.room && Rb.state !== "sleep" && Rb.distTo(L) < 36 && !G.smooches) return { kind: "smooch", label: "Give Robert 10 smoochies", ok: true };
    // standing right at the sliding door: the backyard view wins over nearby cats
    if (G.room === "kitchen" && Math.hypot(L.x - 17.25 * T, L.y - 4.2 * T) < 20) return { kind: "backyard", label: G.yard ? "(admiring the yard...)" : "Look out at the backyard", ok: !G.yard };
    const art = LPK.save.data.evanDrawings || [];
    if (G.room === "kitchen" && art.length && Math.hypot(L.x - 14 * T, L.y - 5.4 * T) < 22) return { kind: "fridgeArt", label: "Look at Evan's drawings", ok: true };
    const cc = G.cat("cc");
    if (cc.room === G.room && cc.state === "bellyUp" && cc.distTo(L) < 36) return { kind: "belly", cat: cc, label: "Royal Belly Rub!", ok: true };
    const toy = G.toys.find(t => t.room === G.room && !t.held && !t.flight && Math.hypot(t.x - L.x, t.y - L.y) < 24);
    if (toy && !G.holdingToy) return { kind: "spring", toy, label: "Pick up the spring toy", ok: true };
    if (G.holdingToy) return { kind: "toss", label: "Toss the spring!", ok: true };
    // While Marshmallow is hiding, searching beats petting when Laura is right at a hiding spot
    if (G.cat("marshmallow").concealed) {
      for (const [id, sp] of Object.entries(G.world.def.restingSpots)) {
        if (!sp.hidden) continue;
        const px = sp.approach[0] * T + 8, py = sp.approach[1] * T + 10;
        if (Math.hypot(L.x - px, L.y - py) < 18) return { kind: "hide", obj: { key: `${G.room}.${id}`, label: `Search ${sp.label}` }, label: `Search ${sp.label}`, ok: true };
      }
    }
    const cats = G.cats.filter(c => c.room === G.room && !c.concealed && c.state !== "transit" &&
      (Math.hypot(ip.x - c.x, ip.y - c.y) < 32 || Math.hypot(L.x - c.x, L.y - c.y) < 34))
      .sort((a, b) => Math.hypot(L.x - a.x, L.y - a.y) - Math.hypot(L.x - b.x, L.y - b.y));
    if (cats.length) {
      const c = cats[0];
      // shooing a boy away from Marshmallow's bowl takes priority
      const atHerBowl = c.id !== "marshmallow" && ((c.eatingBowl === "herBowl") || (c.moving && c.tasks.some(t => t.spot && t.spot.id === "atHerBowl")));
      if (atHerBowl) return { kind: "shoo", cat: c, label: `Shoo ${c.def.nicknames[0]} away from her bowl!`, ok: true };
      if (c.state === "trash") return { kind: "trashCat", cat: c, label: "Get Popsicle out of the trash!", ok: true };
      if (c.id === "popsicle" && !G.holding && G.affirmReady() && c.z === 0 && !c.fighting && !c.begging && !c.zoomies && !c.moving
          && ["sit", "sleep", "box", "confused", "intrigued", "inspect", "window", "stand"].includes(c.state)) return { kind: "affirm", cat: c, label: "Daily affirmations for Orangey", ok: true };
      if (G.holding) return { kind: "feed", cat: c, label: `Give ${LPK.foods[G.holding].name} to ${c.def.nicknames && c.def.nicknames[0] || c.def.name}`, ok: c.state !== "transit" };
      return { kind: "pet", cat: c, label: `Pet ${c.def.nicknames && c.def.nicknames[0] || c.def.name}`, ok: c.available };
    }
    const objs = (G.world.def.interactables || []).map(o => ({ ...o, px: o.x * T, py: o.y * T }));
    // hiding spots are searchable
    for (const [id, s] of Object.entries(G.world.def.restingSpots)) if (s.hidden) objs.push({ kind: "hide", key: `${G.room}.${id}`, label: `Search ${s.label}`, px: s.approach[0] * T + 8, py: s.approach[1] * T + 10 });
    const near = objs.map(o => ({ o, d: Math.min(Math.hypot(ip.x - o.px, ip.y - o.py), Math.hypot(L.x - o.px, L.y - o.py)) }))
      .filter(x => x.d < 26).sort((a, b) => a.d - b.d)[0];
    if (!near) return null;
    const o = near.o;
    if (o.kind === "pantry") return { kind: "pantry", obj: o, label: "Open the treat cabinet", ok: true };
    if (o.kind === "desk") return { kind: "desk", obj: o, label: "Sit at Laura's desk", ok: true };
    if (o.kind === "clownSwitch") return { kind: "clownSwitch", obj: o, label: G.clown ? "(the clown is busy...)" : "Flip the clown's switch", ok: !G.clown };
    if (o.kind === "garageDoor") return { kind: "garageDoor", obj: o, label: G.garageTarget ? "Close the garage door" : "Open the garage door", ok: true };
    if (o.kind === "rest") return { kind: "rest", obj: o, label: G.clock.phase === "night" ? "Rest on the couch (time flies)" : "Rest on the couch", ok: true };
    if (o.kind === "bowl") return { kind: "bowl", obj: o, label: G.holding ? `Fill ${o.label} with ${LPK.foods[G.holding].name}` : `${o.label} (empty-handed)`, ok: true };
    if (o.kind === "trash") return { kind: "trash", obj: o, label: "Check the trash can", ok: true };
    if (o.kind === "dishwasher") return { kind: "dishwasher", obj: o, label: G.dishwasher ? "(the dishwasher is running...)" : "Start the dishwasher", ok: !G.dishwasher };
    if (o.kind === "laundry") { const empty = G.laundry && G.laundry.emptyDay === G.clock.day; return { kind: "laundry", obj: o, label: G.laundry && G.laundry.running > 0 ? "(the washer is running...)" : empty ? "(the basket's empty... for now)" : "Do the laundry", ok: !(G.laundry && (G.laundry.running > 0 || empty)) }; }
    if (o.kind === "peekWindow") return { kind: "peekWindow", obj: o, label: o.which === "evan" ? "Open the curtains" : "Open the window", ok: !G.peek };
    if (o.kind === "moodLamp") return { kind: "moodLamp", obj: o, label: "Change the lamp", ok: true };
    if (o.kind === "tv") { const on = G.tv && G.tv.room === G.room; return { kind: "tv", obj: o, label: !on ? "Turn on the TV" : G.tv.ch === "bears" || G.tv.ch < 3 ? "Change the channel" : "Turn off the TV", ok: true }; }
    if (o.kind === "backyard") return { kind: "backyard", obj: o, label: G.yard ? "(admiring the yard...)" : "Look out at the backyard", ok: !G.yard };
    return { kind: "hide", obj: o, label: o.label, ok: true };
  }

  function useTarget(tg) {
    const L = G.laura;
    switch (tg.kind) {
      case "evanBed": L.say(D().lauraBedtime[0], 1.6); G.evan.tuckIn(); break;
      case "backyard": G.admireYard(); break;
      case "tv": G.pressTV(); break;
      case "dishwasher":
        G.dishwasher = { t: 0, run: 90, popDone: false }; L.sayRandom(D().lauraDishes, 2); LPK.audio.sfx.click(); LPK.audio.sfx.hum();
        break;
      case "laundry": G.startLaundry(); break;
      case "shoo": {
        const pc = G.cat("popsicle"); L.sayRandom(D().lauraShoo, 1.8); pc.say("!", 0.8);
        pc.setState("sit", 1); pc.goTo(pc.def.restingSpots[0], "run", () => pc.setState("sit", 3));
        break;
      }
      case "moodLamp": {
        const set = (mode, line) => () => { const sv = LPK.save.data; sv.lampModes = sv.lampModes || {}; sv.lampModes[G.room] = mode; LPK.save.write(); LPK.audio.sfx.click(); if (line) L.say(line, 2); if (["christmas", "halloween", "unicorn"].includes(mode)) LPK.events.emit("lampMode", { mode }); };
        G.choiceMenu = { title: "The Lamp", sub: "Set the mood", sel: 0, options: [
          { label: "Christmas (red and green fade)", fn: set("christmas", "Ooh, festive!") },
          { label: "Halloween (candle flicker)", fn: set("halloween", "Spooky...") },
          { label: "Unicorn Farts in a Bottle", fn: set("unicorn", "WHOA. Unicorn farts!") },
          { label: "Bright light", fn: set("bright", "Nice and bright.") },
          { label: "Dim light", fn: set("dim", "Ahh, cozy.") },
          { label: "Off", fn: set("off") },
          { label: "Never mind", fn: () => {} },
        ] };
        LPK.audio.sfx.click();
        break;
      }
      case "sweep": G.sweepCardboard(); break;
      case "smooch": G.giveSmooches(); break;
      case "joeCup": G.joe.giveLauraCup(); break;
      case "donut": G.joe.donutTaken = true; L.sayRandom(D().lauraDonut, 2.2); G.progression.addPoints(3); LPK.audio.sfx.crunch(); break;
      case "evanSnack": G.evan.giveSnack(); break;
      case "owenStreak": L.say(D().owenStreakAsk[0], 1.6); G.owen.doStreaks(); break;
      case "fridgeArt": {
        const n = (LPK.save.data.evanDrawings || []).length;
        G.artView = { i: n - 1, t: 0 }; LPK.audio.sfx.click();
        LPK.events.emit("artViewed", {});
        break;
      }
      case "affirm": G.startAffirm(tg.cat); break;
      case "peekWindow": G.startPeek(tg.obj); break;
      case "pet": tg.cat.available ? G.petting.start(tg.cat) : G.petting.start(tg.cat); break;
      case "feed": {
        const c = tg.cat;
        if (!["sit", "sleep", "beg", "confused", "box", "inspect", "meow", "grumble"].includes(c.state)) { L.say("Hold still, kitty!", 1.5); break; }
        LPK.audio.sfx.crunch();
        if (c.offerFood(G.holding)) { c.say(c.id === "popsicle" ? "*GOBBLE*" : c.id === "marshmallow" ? D().marshmallowCrunchies[0] : "*nom*", 1.6); }
        break;
      }
      case "shoo": {
        const c = tg.cat;
        L.sayRandom(D().lauraShoo, 1.8);
        c.stopEating(); c.stopMoving();
        c.setCooldown("shooed", 8);
        c.say("!", 1);
        const dest = G.bowls.boysBowls.food && !G.bowls.boysBowls.eater ? "kitchen.byBoysBowls" : c.def.restingSpots[0];
        c.goTo(dest, "run", () => dest === "kitchen.byBoysBowls" ? LPK.arriveAtBowl(c, "boysBowls") : c.setState("sit", 4));
        LPK.events.emit("boyShooed", { cat: c.id });
        break;
      }
      case "trashCat": L.sayRandom(D().lauraTrash, 2); tg.cat.redirectFromTrash(); break;
      case "trash": {
        const pop = G.cat("popsicle");
        if (pop.state === "trash") { L.sayRandom(D().lauraTrash, 2); pop.redirectFromTrash(); }
        else L.sayRandom(D().lauraTrashIdle, 2);
        break;
      }
      case "pantry": G.foodMenu = { sel: 0 }; LPK.audio.sfx.click(); break;
      case "clownSwitch": G.activateClown(); break;
      case "desk": {
        const opts = [
          { label: "Check emails", fn: () => startDesk("email") },
          { label: "Take a quick call", fn: () => startDesk("call") },
          { label: "Join a Zoom meeting", fn: () => startDesk("meeting") },
        ];
        if (G.desk.coffee !== "full") opts.push({ label: "Get a fresh cup of coffee", fn: () => { G.desk.coffee = "full"; G.laura.sayRandom(D().lauraCoffeeRefill, 2); } });
        opts.push({ label: "Never mind", fn: () => {} });
        G.choiceMenu = { title: "Laura's Desk", sub: "Working from home (with supervision)", options: opts, sel: 0 };
        break;
      }
      case "garageDoor":
        G.garageTarget = G.garageTarget ? 0 : 1;
        L.sayRandom(G.garageTarget ? D().lauraGarageOpen : D().lauraGarageClose, 1.8);
        LPK.audio.sfx.door();
        break;
      case "rest": {
        L.restFrom = { x: L.x, y: L.y };
        L.x = tg.obj.seat.x * G.world.T; L.y = tg.obj.seat.y * G.world.T; L.state = "rest";
        L.sayRandom(D().lauraRest, 2); G.holding = null; G.holdingToy = null;
        break;
      }
      case "getUp": L.x = L.restFrom.x; L.y = L.restFrom.y; L.state = "idle"; L.sayRandom(D().lauraUp, 1.6); break;
      case "spring": {
        const cc = G.cat("cc");
        if (cc.state === "springGuard" && cc.distTo(tg.toy) < 24) {
          if (L.recentRun > 0) { cc.say(cc.pick(D().ccSpringUpset), 1.6); L.sayRandom(D().lauraRejectedCC, 2); break; }
          cc.say(D().ccSpringOk[0], 2); cc.setState("sit", 6);
        }
        G.holding = null; G.holdingToy = tg.toy; tg.toy.held = true;
        L.sayRandom(D().lauraSpringGet, 1.6);
        break;
      }
      case "toss": {
        const toy = G.holdingToy, ip2 = L.interactPoint();
        const dx = (ip2.x - L.x), dy = (ip2.y - L.y), len = Math.hypot(dx, dy) || 1;
        const oly = G.olympics && G.olympics.event === "cc" && G.olympics.phase === "climb";
        toy.held = false; toy.room = G.room; toy.bounce = 8;
        if (oly) {
          // Kitty Olympics: a short, straight toss so you can aim it at the cat tree
          let tx = L.x, ty = L.y;
          for (let d = 8; d <= 56; d += 4) { const nx = L.x + dx / len * d, ny = L.y + dy / len * d; if (!G.world.boxFree(nx - 2, ny - 2, 4, 4)) break; tx = nx; ty = ny; }
          toy.x = tx; toy.y = ty;
        } else {
          // it flies, ricochets off walls and furniture, and ends up somewhere random
          const f = G.springFlight(L.x + dx / len * 6, L.y - 2, dx / len, dy / len);
          toy.flight = f; toy.x = f.pts[0][0]; toy.y = f.pts[0][1];
          toy.landX = f.end[0]; toy.landY = f.end[1];
        }
        G.holdingToy = null; LPK.audio.sfx.boing();
        L.sayRandom(D().lauraToss, 1.4);
        const cc = G.cat("cc");
        if (LPK.olympicsOnToss(G, toy)) break;
        if (cc.room === G.room && !cc.concealed) {
          if (toy.flight && !["petted", "eat", "bellyRub"].includes(cc.state)) { cc.stopMoving(); cc.setState("intrigued", 8); toy.chaser = cc; }   // watches it bounce...
          else cc.chaseSpring(toy);
        }
        break;
      }
      case "belly": {
        const cc = tg.cat; cc.setState("bellyRub", 999);
        L.flip = cc.x < L.x; L.dir = "side"; L.state = "kneel";
        G.bellyGame = { cat: cc, t: 0, hits: 0, flash: 0 };
        break;
      }
      case "bowl": {
        const b = G.bowls[tg.obj.id];
        if (!G.holding) { L.sayRandom(D().lauraBowlEmpty, 2.2); break; }
        if (b.food) { L.sayRandom(D().lauraBowlFull, 1.6); break; }
        b.food = G.holding;
        LPK.audio.sfx.crunch();
        L.say(`${LPK.foods[G.holding].name} served!`, 1.6);
        LPK.events.emit("bowlFilled", { owner: b.owner, food: b.food, bowl: tg.obj.id });
        break;
      }
      case "hide": {
        const key = tg.obj.key, m = G.cat("marshmallow");
        LPK.events.emit("spotSearched", { spot: key });
        if (m.concealed && m.spot.key === key) {
          m.reveal();
          L.sayRandom(D().lauraFoundHidden, 2.8);
          LPK.audio.sfx.found();
          LPK.events.emit("catFound", { cat: "marshmallow", hidden: true, searched: true, spot: key });
        } else if (!m.concealed && m.spot.key === key && m.room === G.room) {
          L.sayRandom(D().lauraFound, 2);
        } else L.sayRandom(D().lauraSearchEmpty, 1.8);
        break;
      }
    }
  }

  // Jump the clock forward (to the next time it's `minutes`; weekdayOnly = next Mon-Fri)
  G.skipTo = (minutes, weekdayOnly) => {
    const c = G.clock;
    if (minutes <= c.minutes) { c.day = (c.day + 1) % 7; }
    if (weekdayOnly) while (c.day === 0 || c.day === 6) c.day = (c.day + 1) % 7;
    c.minutes = minutes;
    G.robert.sync(); G.evan.sync(); G.owen.sync(); G.joe.sync(); G.ro.sync(); LPK.catFight.end(G);
    G.cats.forEach(cat => { if (cat.state === "headSleep") cat.setState("sleep", 10); });
    G.banner = { title: c.label(), text: "Time flies...", t: 2.5 };
  };

  // While Laura rests: step the clock one hour back or ahead (left/right arrows or the on-screen buttons)
  G.shiftHour = (n) => {
    const c = G.clock;
    c.minutes += n * 60;
    while (c.minutes < 0) { c.minutes += 1440; c.day = (c.day + 6) % 7; }
    while (c.minutes >= 1440) { c.minutes -= 1440; c.day = (c.day + 1) % 7; }
    G.robert.sync(); G.evan.sync(); G.owen.sync(); G.joe.sync(); G.ro.sync(); LPK.catFight.end(G);
    G.tv = null; G.tvScare = null; G.hungry = null; G.cupView = null; G.stareOff = null;
    G.cats.forEach(cat => { if (cat.state === "headSleep") cat.setState("sleep", 10); });
    LPK.audio.sfx.click();
    G.restSkip = { text: (n < 0 ? "◀ 1 hour back: " : "1 hour ahead ▶: ") + c.label(), t: 1.6 };
  };

  // Simulate a thrown spring bouncing around the room. Returns the path
  // (one point per frame at 60 fps), the frames where it hit something, and
  // where it ends up.
  G.springFlight = (x, y, ux, uy) => {
    const w = G.world, free = (px, py) => w.boxFree(px - 2, py - 2, 4, 4);
    if (!free(x, y)) { x = G.laura.x; y = G.laura.y - 2; }
    const a0 = Math.atan2(uy, ux) + (Math.random() - 0.5) * 0.35, sp = 300 + Math.random() * 80;
    let vx = Math.cos(a0) * sp, vy = Math.sin(a0) * sp;
    const pts = [[x, y]], hits = [], dt = 1 / 60;
    const turn = () => { const a = (Math.random() - 0.5) * 0.9, c = Math.cos(a), s = Math.sin(a); [vx, vy] = [vx * c - vy * s, vx * s + vy * c]; };
    for (let i = 0; i < 420 && Math.hypot(vx, vy) > 16; i++) {
      let hit = false;
      if (free(x + vx * dt, y)) x += vx * dt; else { vx = -vx * 0.8; hit = true; }
      if (free(x, y + vy * dt)) y += vy * dt; else { vy = -vy * 0.8; hit = true; }
      if (hit) { turn(); hits.push(i); }
      vx *= 0.989; vy *= 0.989;
      pts.push([x, y]);
    }
    return { pts, hits, i: 0, end: [x, y] };
  };

  // The kitchen's sliding door: open the blinds, admire the yard Robert
  // worked so hard on, and reward him with 10 smoochies.
  G.admireYard = () => {
    const L = G.laura, R = G.robert;
    G.yard = { t: 0, said: 0 };
    L.flip = false; L.dir = "up";
    LPK.audio.sfx.click();
  };
  function updateYard(dt) {
    const Y = G.yard; if (!Y) return;
    const L = G.laura, R = G.robert, here = R.present && R.room === "kitchen";
    Y.t += dt;
    if (Y.t > 2.0 && Y.said === 0) { Y.said = 1; L.say(L.pick ? L.pick(D().lauraYard) : D().lauraYard[Math.floor(Math.random() * D().lauraYard.length)], 2.8); }
    if (Y.t > 4.9 && Y.said === 1) {
      Y.said = 2;
      L.say(R.present ? D().lauraSmooch[0] : D().lauraSmoochAway[0], 2.6);
      if (!G.smoochOwed) { G.smoochOwed = true; G.notify("Smoochie award!", here ? "Robert's right here. Give him his 10 smoochies!" : R.present ? "Go find Robert and give him his 10 smoochies!" : "Save them for when Robert gets home!"); }
      LPK.events.emit("yardPraise", {});
    }
    if (Y.t > 10.3) G.yard = null;
  }
  // The smoochie award: Laura finds Robert and gives him all 10 (with the
  // foot pop: knee bent, foot up off the ground).
  G.giveSmooches = () => {
    const L = G.laura, R = G.robert;
    G.smoochOwed = false;
    L.state = "smooch"; L.dir = "side"; L.flip = R.x < L.x; L.smoochT = 0;
    R.flip = L.x < R.x;
    G.smooches = { t: 0, x: L.x + (L.flip ? -6 : 6), y: L.y - 26, to: R, room: G.room, n: 0, give: true };
  };
  function updateSmooches(dt) {
    const S = G.smooches; if (!S) return;
    S.t += dt;
    const n = Math.min(10, Math.floor(S.t / 0.22) + 1);
    if (n > S.n) { S.n = n; LPK.audio.sfx.kiss(); }
    if (S.give && S.t > 2.8 && !S.done) {
      S.done = true;
      const L = G.laura, R = G.robert;
      if (L.state === "smooch") L.state = "idle";
      R.say(R.pick(D().robertSmooch), 2.4);
      G.progression.addPoints(10); G.notify("10 smoochies!", "+10 Kitty Happiness Points");
      LPK.events.emit("smoochies", {});
    }
    if (S.t > 4.5) G.smooches = null;
  }

  // Orangey's DAILY AFFIRMATIONS (10-11 AM): Laura kneels, cups his face in one
  // hand and pets him with the other, they look right at each other, and she
  // tells him how orange, handsome, pretty and silky he is. Last line, always:
  // "And everybody loves you."
  G.affirmReady = () => { const c = G.clock; return c.minutes >= 600 && c.minutes < 660 && G.affirmDay !== c.day && !G.affirm; };
  G.startAffirm = (cat) => {
    const L = G.laura;
    cat.stopMoving(); cat.tasks = []; cat.stopEating && cat.stopEating();
    cat.fighting = true; cat.fightPose = "sit"; cat.state = "sit";
    // kneel right beside him, nose to nose
    let side = L.x <= cat.x ? -1 : 1;
    if (!G.world.boxFree(cat.x + side * 13 - 4, cat.y - 3, 8, 4)) side = -side;
    L.x = cat.x + side * 13; L.y = cat.y; L.dir = "side"; L.flip = side > 0; L.state = "affirm";
    cat.flip = side < 0;
    G.holdingToy = null;
    G.affirm = { cat, t: 0, i: -1, next: 0.2 };
    G.affirmDay = G.clock.day;
    LPK.audio.purr(0.6);
  };
  function updateAffirm(dt) {
    const A = G.affirm; if (!A) return;
    const L = G.laura, c = A.cat, lines = D().lauraAffirm;
    A.t += dt;
    if (c.room !== G.room && A.i < lines.length - 1) { endAffirm(false); return; }
    // halfway through, Cookies and Cream sprints right past them: "DORK!"
    if (A.t > 8.2 && !A.dork) { A.dork = { said: false }; ccDorkRun(A); }
    if (A.dork && A.dork.cc && !A.dork.said && Math.abs(A.dork.cc.x - (L.x + c.x) / 2) < 26) {
      A.dork.said = true; A.dork.cc.say("DORK!", 1.6); LPK.audio.sfx.startle && LPK.audio.sfx.startle();
    }
    if (A.t >= A.next) {
      A.i++;
      if (A.i < lines.length) {
        L.say(lines[A.i], A.i === lines.length - 1 ? 3.2 : 2.4);
        if (A.i > 0 && A.i < lines.length - 1) setTimeout(() => G.affirm === A && c.say(D().popAffirm[(A.i - 1) % D().popAffirm.length], 1.2), 1500);
        A.next = A.t + (A.i === lines.length - 1 ? 3.6 : 2.7);
      } else endAffirm(true);
    }
  }
  function ccDorkRun(A) {
    const cc = G.cat("cc"), L = G.laura, w = G.world, T = w.T; if (!cc) return;
    const cols = w.def.cols, mid = (L.x + A.cat.x) / 2;
    let best = null;
    for (const dy of [18, -18, 30, -30]) {                     // a clear lane just in front of (or behind) them
      const y = L.y + dy, pts = [];
      for (let x = 1.5 * T; x <= (cols - 1.5) * T; x += 8) if (w.pointOpen(x, y)) pts.push({ x, y }); else if (pts.length && pts[pts.length - 1].x < mid) pts.length = 0; else if (pts.length) break;
      if (pts.length > 6 && pts[0].x < mid - 30 && pts[pts.length - 1].x > mid + 30 && (!best || pts.length > best.length)) best = pts;
    }
    if (!best) return;
    const fromLeft = cc.room === G.room ? cc.x < mid : Math.random() < 0.5;
    if (!fromLeft) best.reverse();
    cc.stopMoving(); cc.tasks = []; cc.stopEating && cc.stopEating();
    cc.room = G.room; cc.z = 0; cc.x = best[0].x; cc.y = best[0].y; cc.flip = !fromLeft;
    cc.path = best.slice(1); cc.moveMode = "sprint"; cc.state = "move";
    cc.tasks = [{ type: "call", fn: () => { const far = cc.def.restingSpots.filter(k => !k.startsWith(G.room + ".")); cc.goTo(far[Math.floor(Math.random() * far.length)] || cc.def.restingSpots[0], "sprint", () => cc.setState("sit", 4)); } }];
    A.dork.cc = cc;
  }
  // ---------------------------------------------------------- PATRICK at the windows
  // Evan's room (daytime): open the curtains and Patrick is RIGHT there, waving
  // like a maniac. Laura slooowly raises a hand, slooowly closes the curtains,
  // says something awkward and backs away.
  // Owen's room: open the window and look straight back (picket fence, trees)
  // or to the left (wooden fence, Patrick & his mom's yard). At night Patrick
  // is out there with a flashlight, checking things.
  G.peekDark = () => G.clock.darkness() > 0.3;
  G.startPeek = (o) => {
    const L = G.laura, T = G.world.T;
    L.restFrom = { x: L.x, y: L.y };
    L.x = o.x * T; L.y = Math.max(L.y, (G.world.def.wallRows + 0.9) * T); L.dir = "up"; L.state = "peek"; L.raise = 0;
    G.holding = null; G.holdingToy = null;
    G.peek = { which: o.which, t: 0, open: 0, look: "straight", patrick: o.which === "evan" ? !G.peekDark() : G.peekDark(), lines: 0,
      pat: { x: 60, i: 0, wait: 1.5, flip: false, aim: null, say: null, sayT: 0, nextSay: 2.5 } };
    LPK.audio.sfx.click();
  };
  function updatePeek(dt) {
    const P = G.peek; if (!P) return;
    const L = G.laura, D0 = D();
    P.t += dt;
    if (P.which === "evan") {
      const beat = (at, fn) => { if (P.t >= at && !P[at]) { P[at] = true; fn(); } };
      P.open = P.t < 0.9 ? P.t / 0.9 : P.t < 5 ? 1 : Math.max(0, 1 - (P.t - 5) / 1.8);   // ...and sloooowly closed
      if (!P.patrick) {                                                    // nighttime: nobody there
        beat(1.2, () => L.say("Just the dark side yard.", 1.8));
        if (P.t > 1.6 && P.t < 5) P.t = 5;
        if (P.t > 6.9) endPeek();
        return;
      }
      beat(0.9, () => LPK.audio.sfx.startle && LPK.audio.sfx.startle());
      if (P.t > 2.2 && P.t < 4.4) L.raise = Math.min(1, (P.t - 2.2) / 2.0);  // one slow, limp little wave back
      beat(7.0, () => { L.raise = 0; L.say(D0.lauraPatrickWave[Math.floor(Math.random() * D0.lauraPatrickWave.length)], 2.8); });
      if (P.t > 7.4 && P.t < 9.0) {                                         // ...backing away from the window
        P.back = true; L.dir = "up";
        const ny = L.y + 14 * dt; if (G.world.boxFree(L.x - 4, ny - 3, 8, 4)) L.y = ny;
        L.dist += 14 * dt;
      }
      if (P.t > 9.1) { endPeek(); LPK.events.emit("patrickWave", {}); }
      return;
    }
    // Owen's window: look around until you close it
    const input = LPK.input;
    if (P.closing != null) { P.closing += dt; P.open = Math.max(0, 1 - P.closing / 0.5); if (P.closing > 0.55) endPeek(); return; }
    P.open = Math.min(1, P.t / 0.6);
    if (input.pressed("left")) P.look = "left";
    else if (input.pressed("right")) P.look = "straight";
    else if (P.t > 0.4 && (input.pressed("act") || input.pressed("stop"))) { P.closing = 0; LPK.audio.sfx.click(); return; }
    if (P.patrick) {
      const pat = P.pat, spots = [{ x: 56, ax: 34, ay: 52 }, { x: 70, ax: 72, ay: 14 }, { x: 84, ax: 101, ay: 54 }, { x: 110, ax: 128, ay: 52 }, { x: 128, ax: 148, ay: 54 }, { x: 60, ax: 16, ay: 44 }];
      if (pat.wait > 0) { pat.wait -= dt; pat.walking = false; }
      else {
        const s = spots[pat.i % spots.length], d = s.x - pat.x;
        if (Math.abs(d) < 1) { pat.wait = 2 + Math.random() * 1.5; pat.aim = { x: s.ax, y: s.ay }; pat.flip = s.ax < pat.x; pat.i++; }
        else { pat.walking = true; pat.flip = d < 0; pat.x += Math.sign(d) * Math.min(Math.abs(d), 16 * dt); pat.aim = { x: pat.x + (pat.flip ? -26 : 26), y: 58 }; }
      }
      pat.walkT = (pat.walkT || 0) + (pat.walking ? dt : 0);
      if ((pat.sayT -= dt) <= 0) pat.say = null;
      if (P.look === "left" && (pat.nextSay -= dt) <= 0) { pat.nextSay = 4.5 + Math.random() * 3; pat.say = D0.patrickNight[Math.floor(Math.random() * D0.patrickNight.length)]; pat.sayT = 2.2; }
      if (P.look === "left") {
        P.leftT = (P.leftT || 0) + dt;
        if (P.leftT > 0.8 && P.lines === 0) { P.lines = 1; L.say(D0.lauraPatrickNight[0], 2.8); }
        if (P.leftT > 3 && !P.seen) { P.seen = true; LPK.events.emit("patrickNight", {}); }
        if (P.leftT > 9 * P.lines + 2) { L.say(D0.lauraPatrickNight[1 + (P.lines - 1) % (D0.lauraPatrickNight.length - 1)], 2.6); P.lines++; }
      }
    }
  }
  function endPeek() {
    const L = G.laura;
    G.peek = null; L.raise = 0;
    if (L.state === "peek") L.state = "idle";
  }
  G.endPeek = endPeek;

  function endAffirm(done) {
    const A = G.affirm; if (!A) return;
    const L = G.laura, c = A.cat;
    G.affirm = null;
    c.fighting = false; c.fightPose = null; c.setState("sit", 5);
    if (L.state === "affirm") L.state = "idle";
    LPK.audio.purr(0);
    if (done) {
      c.say("*the happiest purr*", 2.2);
      G.progression.addPoints(10); G.notify("Daily affirmations: done!", "Orangey feels very orange. +10 Kitty Happiness Points");
      LPK.audio.sfx.found();
      LPK.events.emit("dailyAffirmations", {});
    }
  }

  G.blindsOpen = () => { const Y = G.yard; if (!Y) return 0; return Y.t < 0.7 ? Y.t / 0.7 : Y.t > 9.5 ? Math.max(0, (10.3 - Y.t) / 0.8) : 1; };

  // "Mom, I'm hungry!" — every so often one of the boys says it, Laura does
  // the hungry dance (bent over, hands on knees, bouncing) singing it back
  // four times, then asks what they want. Evan: "Food!!!!!" Owen: "I'm not
  // telling you."
  G.hungryCool = 60;
  function updateHungry(dt) {
    const L = G.laura, H = G.hungry, Dl = D();
    if (!H) {
      if ((G.hungryCool -= dt) > 0 || L.busy || G.petting.active || G.foodMenu || G.artView || G.yard || G.clown || LPK.catFight.active) return;
      const kids = [G.evan, G.owen].filter(k => k && k.room === G.room && k.mode === "day" && !k.moving && k.z === 0 && k.distTo(L) < 90
        && !["askSnack", "snack", "streaks", "flying", "watchBall", "catch", "throw", "swing"].includes(k.state));
      if (!kids.length || Math.random() > dt / 45 || (G.joe && G.joe.sc)) return;
      const kid = kids[Math.floor(Math.random() * kids.length)];
      kid.stopMoving(); kid.tasks = []; kid.holding = null; kid.fighting = true; kid.setState("stand", 99);
      kid.say(Dl.kidHungry[0], 2.2);
      G.hungry = { kid, t: 0, step: 0 };
      return;
    }
    H.t += dt;
    const k = H.kid, evan = k.id === "evan";
    const at = (sec) => { const n = at.n++; return H.t >= sec && H.step === n; };     // the scene's beats, in order
    at.n = 0;
    if (at(2.2)) { H.step++; L.state = "dance"; L.dir = "side"; L.flip = k.x < L.x; }
    for (let i = 0; i < 4; i++) if (at(2.3 + i * 1.15)) { H.step++; L.say(Dl.lauraHungrySong[0], 1.1); LPK.audio.sfx.sing(); }
    if (at(7.0)) { H.step++; L.state = "idle"; L.say(Dl.lauraWhatWant[0], 2.2); }
    if (at(9.3)) { H.step++; k.say(evan ? Dl.evanWant[0] : Dl.owenWant[0], 2.2); }
    if (at(11.6)) { H.step++; L.say(evan ? Dl.lauraOkEvan[0] : Dl.lauraOkOwen[0], 2); }
    if (at(13.4)) {
      k.fighting = false; k.setState("stand", 1);
      LPK.events.emit("momHungry", { kid: k.id });
      G.hungry = null; G.hungryCool = 150 + Math.random() * 150;
    }
  }

  // The TV: on (channel 1) -> channel 2 -> channel 3 -> off. Three scary
  // movie spoofs. If one of the boys is in the room, "What is that?" and he
  // runs out screaming.
  G.pressTV = () => {
    const L = G.laura, Dl = D(), on = G.tv && G.tv.room === G.room;
    LPK.audio.sfx.click();
    if (on && G.tv.ch >= 3) {
      const surfed = G.tv.seen && G.tv.seen.size >= 3;
      G.tv = null;
      L.say(Dl.lauraTvOff[0], 3);
      if (surfed) LPK.events.emit("tvSurfed", {});
      return;
    }
    if (!on) G.tv = { room: G.room, ch: 1, t: 0, seen: new Set([1]), scared: false };
    else if (G.tv.ch === "bears") G.tv = { room: G.room, ch: 1, t: 0, seen: new Set([1]), scared: false };   // Robert won't like this
    else { G.tv.ch++; G.tv.t = 0; G.tv.seen.add(G.tv.ch); }
    LPK.audio.sfx.sting();
    G.notify(`Channel ${G.tv.ch}: ${Dl.tvShows[G.tv.ch]}`, Dl.tvBlurbs[G.tv.ch]);
  };
  function updateTV(dt) {
    const T = G.tv; if (!T) { G.tvScare = null; return; }
    T.t += dt;
    const Dl = D();
    // a boy is in (or wanders into) the room while it's on
    if (!T.scared && !G.tvScare && T.room === G.room && T.t > 0.6) {
      const kids = [G.evan, G.owen].filter(k => k && k.mode === "day" && k.room === T.room && !k.fighting && !k.moving && k.state !== "streaks");
      if (kids.length) {
        const k = kids[Math.floor(Math.random() * kids.length)];
        T.scared = true;
        k.stopMoving(); k.tasks = []; k.holding = null; k.fighting = true; k.setState("stand", 99);
        k.say(Dl.kidWhatIsThat[0], 1.8);
        G.tvScare = { kid: k, t: 0 };
      }
    }
    const S = G.tvScare;
    if (S) {
      S.t += dt;
      if (S.t > 1.9 && !S.ran) {
        S.ran = true; const k = S.kid;
        k.say(Dl.kidTvScream[0], 2.6); k.handsOnHead = true; LPK.audio.sfx.startle();
        const away = ["kitchen.table", "backRoom.field", "evansRoom.evanPlay", "owensRoom.owenFloor", "livingRoom.couch"].filter(key => !key.startsWith(k.room + "."));
        k.fighting = false;
        k.goTo(away[Math.floor(Math.random() * away.length)], "run", () => { k.handsOnHead = false; k.setState("stand", 2); });
        if (k.sameRoomAsLaura()) LPK.events.emit("tvScare", { kid: k.id });
      }
      if (S.t > 3) G.tvScare = null;
    }
  }

  // Orangey chomping his box flings bits of cardboard all over the floor;
  // they pile up until Laura sweeps them.
  G.flickCardboard = (cat) => {
    const d = G.debris = G.debris || [];
    const a = Math.random() * Math.PI * 2, sp = 30 + Math.random() * 55;
    d.push({ room: cat.room, x: cat.x + (cat.flip ? -4 : 4), y: cat.y - 1, z: 10, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 35 + Math.random() * 45,
      c: ["#b8885a", "#a87848", "#c89a68", "#9a6a3e"][Math.floor(Math.random() * 4)], w: 1 + Math.floor(Math.random() * 2), h: 1 + Math.floor(Math.random() * 2), t: 0 });
    const inRoom = d.filter(p => p.room === cat.room);
    if (inRoom.length > 45) d.splice(d.indexOf(inRoom[0]), 1);
    if (cat.room === G.room && Math.random() < 0.3) LPK.audio.sfx.tear();
  };
  function updateDebris(dt) {
    const d = G.debris; if (!d || !d.length) return;
    for (const p of d) {
      p.t += dt;
      if (p.z > 0 || p.vz > 0) {
        const w = G.worlds[p.room], nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
        if (w && w.pointOpen(nx, ny)) { p.x = nx; p.y = ny; } else { p.vx *= -0.3; p.vy *= -0.3; }
        p.vz -= 220 * dt; p.z += p.vz * dt;
        if (p.z <= 0) { p.z = 0; p.vz = 0; p.vx = p.vy = 0; }
      }
    }
    G.debris = d.filter(p => p.t < 600);                      // they stick around about 10 minutes
  }
  G.sweepCardboard = () => {
    const L = G.laura, before = G.debris.length;
    G.debris = G.debris.filter(p => !(p.room === G.room && Math.hypot(p.x - L.x, p.y - L.y) < 48));
    const n = before - G.debris.length;
    L.sayRandom(D().lauraSweep, 2.2); LPK.audio.sfx.click();
    if (n >= 5) { G.progression.addPoints(2); LPK.events.emit("sweep", { n }); }
  };

  // The dishwasher runs ~90 seconds; partway through, Orangey sometimes hops
  // up on the counter and eats out of the sink. num num num num.
  function updateDishwasher(dt) {
    const W = G.dishwasher; if (!W) return;
    W.t += dt;
    if ((W.hum = (W.hum || 0) - dt) <= 0 && G.room === "kitchen") { W.hum = 2.5; LPK.audio.sfx.hum(); }
    const pop = G.cat("popsicle");
    if (!W.popDone && W.t > 6 && Math.random() < dt / 8 && !pop.scripted && !pop.fighting && !pop.concealed && !pop.begging && !pop.zoomies && !pop.moving
        && ["sit", "sleep", "confused", "beg", "box"].includes(pop.state)) {
      W.popDone = true;
      pop.say("!", 0.8);
      pop.goTo("kitchen.counterTop", "run", () => { pop.flip = true; pop.setState("sinkEat", 10 + Math.random() * 6); pop.say(pop.pick(D().popSink), 1.6); });
    }
    if (W.t > W.run) G.dishwasher = null;
  }
  // Laundry: "Whites... darks... eh!" — everything goes in, the washer
  // starts, and Laura strolls off whistling.
  G.startLaundry = () => {
    const L = G.laura;
    G.laundry = { t: 0, step: "talk", running: 0, emptyDay: (G.laundry && G.laundry.emptyDay) };
    L.dir = "side"; L.flip = false;
    L.sayRandom(D().lauraLaundry, 2.4);
  };
  function updateLaundry(dt) {
    const Ld = G.laundry; if (!Ld) return;
    const L = G.laura;
    if (Ld.running > 0) Ld.running -= dt;
    if (Ld.step === "done") return;
    Ld.t += dt;
    if (Ld.step === "talk" && Ld.t > 2.4) {                  // throw everything in
      Ld.step = "throw"; Ld.t = 0; Ld.emptyDay = G.clock.day;
      const T = G.world.T, bx = 14.5 * T, by = 11 * T - 8, wx = 15.5 * T, wy = 10.5 * T;
      Ld.bits = Array.from({ length: 12 }, (_, i) => ({ d: i * 0.08, c: ["#e84a5a", "#4a8ae8", "#f2f2f0", "#2a2a30", "#f2b43a", "#7ac04a", "#c77dff", "#ff8ab0"][i % 8], bx, by, wx, wy }));
    }
    if (Ld.step === "throw" && Ld.t > 1.4) {                 // start it, and stroll away whistling
      Ld.step = "whistle"; Ld.t = 0; Ld.running = 120; Ld.bits = null;
      LPK.audio.sfx.click(); LPK.audio.sfx.whistle();
      L.state = "whistle"; L.dir = "side"; L.flip = true; L.say("*whistles*", 2);
      if (G.room === "basement") LPK.events.emit("laundry", {});
    }
    if (Ld.step === "whistle") {
      const nx = L.x - 22 * dt;
      if (G.world.boxFree(nx - 4, L.y - 3, 8, 4)) { L.x = nx; L.dist += 22 * dt; }
      if (Ld.t > 2.2) { L.state = "idle"; Ld.step = "done"; }
    }
  }
  G.drawLaundryBits = (g) => {
    const Ld = G.laundry; if (!Ld || !Ld.bits || G.room !== "basement") return;
    for (const b of Ld.bits) {
      const p = Math.max(0, Math.min(1, (Ld.t - b.d) / 0.5)); if (p <= 0 || p >= 1) continue;
      const x = b.bx + (b.wx - b.bx) * p, y = b.by + (b.wy - b.by) * p - Math.sin(p * Math.PI) * 16;
      LPK.px.rect(g, Math.round(x), Math.round(y), 4, 3, b.c);
    }
  };

  G.pickFood = (food) => {
    G.foodMenu = null;
    if (!food) { G.holding = null; G.laura.say("Put it away.", 1.2); return; }
    G.holding = food;
    G.laura.say(D().lauraPicked[0].replace("{food}", LPK.foods[food].name), 1.8);
    LPK.events.emit("foodPicked", { food });
  };

  // --------------------------------------------------------- sizing
  function resize() {
    const V = LPK.view; V.update();
    G.dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.width = Math.round(V.w * G.dpr);
    canvas.height = Math.round(V.h * G.dpr);
    canvas.style.width = V.w + "px";
    canvas.style.height = V.h + "px";
    // upright phone: turn the whole game sideways (top of the game toward the right edge)
    canvas.style.transformOrigin = "0 0";
    canvas.style.transform = V.rotated ? `translateX(${window.innerWidth}px) rotate(90deg)` : "none";
  }
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => setTimeout(resize, 250));
  if (window.visualViewport) window.visualViewport.addEventListener("resize", resize);
  // Stop the browser from scrolling, bouncing, pulling the page down or
  // pinch-zooming while you play (iPhone Safari especially).
  const block = (e) => e.preventDefault();
  document.addEventListener("touchmove", block, { passive: false });
  document.addEventListener("gesturestart", block, { passive: false });
  document.addEventListener("dblclick", block, { passive: false });
  resize();

  function computeView(zoomBoost) {
    const T = LPK.config.tile, mv = LPK.config.minVisibleTiles;
    let S = Math.max(1, Math.floor(Math.min(canvas.width / (mv.w * T), canvas.height / (mv.h * T))));
    S += zoomBoost;
    G.S = S;
    G.viewW = Math.ceil(canvas.width / S); G.viewH = Math.ceil(canvas.height / S);
    if (buffer.width !== G.viewW || buffer.height !== G.viewH) { buffer.width = G.viewW; buffer.height = G.viewH; }
  }
  function updateCamera(dt, focus, free) {
    const w = G.world;
    let tx = focus.x - G.viewW / 2, ty = focus.y - 12 - G.viewH / 2;
    if (!free) tx = w.width <= G.viewW ? (w.width - G.viewW) / 2 : Math.max(0, Math.min(w.width - G.viewW, tx));
    if (!free) ty = w.height <= G.viewH ? (w.height - G.viewH) / 2 : Math.max(0, Math.min(w.height - G.viewH, ty));
    const k = Math.min(1, dt * 6);
    G.cam.x += (tx - G.cam.x) * k; G.cam.y += (ty - G.cam.y) * k;
  }
  G.worldToScreen = (x, y) => ({ x: (x - Math.round(G.cam.x)) * G.S / G.dpr, y: (y - Math.round(G.cam.y)) * G.S / G.dpr });

  // --------------------------------------------------------- update
  function updatePlay(dt) {
    G.fade = Math.max(0, G.fade - dt);
    if (G.celebration) {
      G.celebration.t += dt;
      G.laura.update(dt, input);
      G.cats.forEach(c => c.update(dt));
      if (G.celebration.t > 1 && input.pressed("act")) G.endCelebration();
      return;
    }
    if (G.foodMenu) { updateFoodMenu(); return; }
    if (G.artView) { updateArtView(dt); return; }
    if (G.choiceMenu) { updateChoiceMenu(); return; }
    if (G.bellyGame) { updateBellyGame(dt); return; }
    if (!G.petting.active && input.pressed("pause")) { G.screen = "pause"; G.ui.sel = 0; LPK.audio.purr(0); return; }

    G.clock.update(dt * (G.laura.state === "rest" ? LPK.config.restTimeSpeed : 1));
    G.laura.update(dt, input);
    G.laura.recentRun = G.laura.state === "run" ? 1.2 : Math.max(0, (G.laura.recentRun || 0) - dt);
    G.cats.forEach(c => c.update(dt));
    G.robert.update(dt);
    G.evan.update(dt);
    G.owen.update(dt);
    G.joe.update(dt);
    G.ro.update(dt);
    if (G.cupView && (G.cupView.t += dt) > G.cupView.total) G.cupView = null;
    updateYard(dt);
    updateHungry(dt);
    updateTV(dt);
    updateDebris(dt);
    updateDishwasher(dt);
    updateLaundry(dt);
    updateSmooches(dt);
    updateAffirm(dt);
    updatePeek(dt);
    if (G.clock.minutes >= 600 && G.clock.minutes < 660 && G.affirmNoteDay !== G.clock.day && G.affirmDay !== G.clock.day) {
      G.affirmNoteDay = G.clock.day; G.notify("10 AM: Daily affirmations!", "Find Orangey and remind him how handsome he is.");
    }
    LPK.catFight.update(G, dt);
    LPK.sneak.update(G, dt);
    if (G.fightText && (G.fightText.t -= dt) <= 0) G.fightText = null;
    G.shake = Math.max(0, (G.shake || 0) - dt);
    G.toys.forEach(t => {
      t.bounce = Math.max(0, t.bounce - dt * 10);
      if (t.held) { t.room = G.room; t.x = G.laura.x + 6; t.y = G.laura.y - 10; }
      else if (t.flight) {
        const f = t.flight, prev = Math.floor(f.i); f.i += dt * 60;
        const k = Math.min(f.pts.length - 1, Math.floor(f.i));
        if (f.hits.some(h => h > prev && h <= k)) { LPK.audio.sfx.boing(); t.bounce = 6; }
        t.x = f.pts[k][0]; t.y = f.pts[k][1];
        t.bounce = Math.max(t.bounce, 3 + Math.abs(Math.sin(f.i / 7)) * 5 * (1 - k / f.pts.length));
        if (t.chaser && f.pts.length - k < 50) { const c = t.chaser; t.chaser = null; c.chaseSpring(t); }   // ...then POUNCES as it slows down
        else if (t.chaser) t.chaser.flip = t.x < t.chaser.x;
        if (k >= f.pts.length - 1) { t.flight = null; t.landX = t.landY = undefined; t.bounce = 4; }
      }
    });
    G.petting.update(dt, input);
    LPK.olympicsUpdate(G, dt, input);
    checkHappiness(dt);
    // Weekend hangout: rest on the couch while Robert's on the sofa
    const R = G.robert;
    if (G.laura.state === "rest" && R.present && R.state === "sit" && R.room === G.room && R.spot && R.spot.id === "sofa" && !G.hangoutDone) {
      G.hangoutDone = true;
      R.say(R.pick(D().robertHangout), 2.5); G.laura.sayRandom(D().lauraHangout, 2.5);
      G.cats.filter(c => c.room === G.room).forEach(c => G.petting.addRaw(c, 6));
      LPK.events.emit("weekendHangout", {});
    }
    if (G.laura.state !== "rest") G.hangoutDone = false;
    updateClown(dt);
    updateDesk(dt);
    G.garageOpen = G.garageOpen || 0;
    G.garageOpen += Math.sign((G.garageTarget || 0) - G.garageOpen) * Math.min(Math.abs((G.garageTarget || 0) - G.garageOpen), dt * 0.6);
    if (G.room === "garage" && G.garageOpen > 0.5 && G.laura.x > (G.world.def.cols - 2.2) * 16) {
      if (!G.notices.garageWalk) { G.notices.garageWalk = true; G.laura.sayRandom(D().lauraGarageWalk, 2.4); }
    } else G.notices.garageWalk = false;
    // Level 4: tag CC while he zooms
    const cc = G.cat("cc");
    G.zoomCool = Math.max(0, (G.zoomCool || 0) - dt);
    if (G.flags.zoomies && cc.room === G.room && cc.distTo(G.laura) < 28 && !G.zoomCool) {
      G.zoomCool = 1.5; G.laura.sayRandom(D().lauraZoomTag, 1.2); LPK.audio.sfx.found(); LPK.events.emit("zoomTag", {});
    }

    const L = G.laura, T = G.world.T;
    // Walking through a doorway into another room
    const door = G.world.doorwayAt(L.x, L.y);
    if (door && !G.petting.active) { G.switchRoom(door.to, door.toExit); return; }

    // Spotting cats
    for (const c of G.cats) {
      if (c.room !== G.room || c.concealed || c.state === "transit") { if (c.room !== G.room) c.found = false; continue; }
      if (!c.found && c.distTo(L) < 70) {
        c.found = true;
        const lines = c.id === "cc" ? D().lauraFoundCC : c.id === "popsicle" ? D().lauraFoundPop : D().lauraFound;
        if (!L.speech) L.sayRandom(lines, 2.4);
        if (c.id === "marshmallow") LPK.audio.sfx.found();
        LPK.events.emit("catFound", { cat: c.id, hidden: !!(c.spot && c.spot.hidden && !c.moving), spot: c.spot && c.spot.key });
      }
    }
    // Fur clues (Level 2)
    for (const cl of G.clues) {
      if (cl.room === G.room && !cl.found && Math.hypot(L.x - cl.x, L.y - cl.y) < 20) {
        cl.found = true; L.sayRandom(D().lauraClue, 2.4); LPK.events.emit("clueFound", {});
      }
    }
    // What can Laura do right here?
    G.prompt = null;
    const cheering = G.olympics && G.olympics.phase === "cheer";
    if (!G.petting.active && !cheering && (!L.busy || L.state === "rest")) {
      if (L.state === "rest" && !G.choiceMenu) {
        if (input.pressed("left")) G.shiftHour(-1);
        else if (input.pressed("right")) G.shiftHour(1);
      }
      if (G.restSkip && (G.restSkip.t -= dt) <= 0) G.restSkip = null;
      G.prompt = findTarget();
      if (G.prompt && input.pressed("act")) useTarget(G.prompt);
      else if (G.holding && input.pressed("stop")) G.pickFood(null);
    }
    // Doorways to rooms that aren't built yet
    for (const ex of G.world.def.exits) {
      if (ex.to && G.worlds[ex.to]) continue;
      let near;
      if (ex.side === "back") near = L.x > ex.x * T - 4 && L.x < (ex.x + ex.w) * T + 4 && L.y < (G.world.def.wallRows + 0.6) * T;
      else if (ex.side === "front") near = L.x > ex.x * T - 4 && L.x < (ex.x + ex.w) * T + 4 && L.y > (G.world.def.rows - 1.6) * T;
      else near = L.y > ex.y * T - 4 && L.y < (ex.y + ex.h) * T + 4 && (ex.side === "right" ? L.x > (G.world.def.cols - 1.8) * T : L.x < 1.8 * T);
      const key = "exit-" + G.room + ex.id;
      if (near) { if (!G.notices[key]) { G.notices[key] = true; L.say(ex.message || "Not yet!", 2.6); } }
      else G.notices[key] = false;
    }
    G.floaters = G.floaters.filter(f => (f.t += dt) < 1.4);
    G.autosave = (G.autosave || 0) + dt;
    if (G.autosave > 15) { G.autosave = 0; G.saveNow(); }
  }

  // All-three-happy check (Level 6), and Level 6's "one in-game day" rule
  function checkHappiness(dt) {
    G.happyCheck = (G.happyCheck || 0) - dt;
    if (G.happyCheck > 0) return;
    G.happyCheck = 1;
    if (G.cats.every(c => c.happiness >= 80)) LPK.events.emit("allHappy", {});
    const rec = LPK.save.data.missions.ultimateCuddle, m = G.progression.currentMission();
    if (m && m.id === "ultimateCuddle" && rec && rec.day !== undefined && G.clock.day !== rec.day && G.clock.hour >= 5) {
      rec.doneSteps = []; rec.day = G.clock.day; LPK.save.write();
      G.laura.sayRandom(D().lauraDayOver, 3);
      G.banner = { title: "A brand-new day", text: "The Ultimate Kitty Cuddle starts over. All three, one day!", t: 4 };
    }
  }
  // Everybody Gets Some Love: all three Purr Meters filled in the same day
  LPK.events.on("purrFull", (p) => {
    if (!G.clock) return;
    if (!G.dailyFull || G.dailyFull.day !== G.clock.day) G.dailyFull = { day: G.clock.day, set: new Set() };
    G.dailyFull.set.add(p.cat);
    if (G.dailyFull.set.size >= 3) LPK.events.emit("everybodyLove", {});
  });

  // The back-room clown: Laura flips its switch -> head turns, eyes glow, it
  // says a friendly line (mask closed), then the mask splits wide open to show
  // the scary face inside, whose jaw snaps up and down while it says the evil
  // line. Creepy carnival music plays the whole time.
  LPK.CLOWN = { turn: 0.6, talk1: 1.0, split: 4.8, evil: 5.8, close: 10.6, shut: 11.4, total: 12.4 };
  function clownSpot() {
    const w = G.worlds.backRoom, f = w && w.def.furniture.find(o => o.kind === "clown");
    return f ? { room: "backRoom", x: f.x * 16 + 8, y: f.y * 16 + f.h * 16 } : null;
  }
  G.activateClown = () => {
    if (G.clown) return;
    const C = LPK.CLOWN, lines = D().clownLines;
    G.clownIdx = ((G.clownIdx == null ? Math.floor(Math.random() * lines.length) : G.clownIdx) + 1) % lines.length;
    G.clownPos = clownSpot();
    G.clown = { t: C.total, total: C.total, pair: lines[G.clownIdx], line: null };
    G.laura.sayRandom(D().lauraSwitch, 1.0);
    LPK.audio.sfx.click(); LPK.audio.clownShow(C);
    LPK.events.emit("clownWoke", {});
  };
  function updateClown(dt) {
    if (!G.clown) return;
    G.clown.t -= dt;
    const C = LPK.CLOWN, e = G.clown.total - G.clown.t, c = G.clownPos;
    G.clown.line = e > C.talk1 && e < C.split ? G.clown.pair.friendly : e > C.evil - 0.2 && e < C.close ? G.clown.pair.evil : null;
    if (e > C.split + 0.4 && !G.clown.reacted) {
      // the face splits open: the cats have opinions
      G.clown.reacted = true;
      const pop = G.cat("popsicle"), cc = G.cat("cc"), m = G.cat("marshmallow");
      if (pop.room === c.room && !pop.scripted && pop.distTo(c) < 170 && !["eat", "petted", "headSleep"].includes(pop.state)) {
        pop.say("!!", 1.2); LPK.audio.sfx.startle(); pop.startle(c.x);
      }
      if (cc.room === c.room && cc.distTo(c) < 170) cc.say("*unimpressed*", 1.8);
    }
    if (e > C.shut + 0.2 && !G.clown.lauraDone) {
      // after the show: Laura's opinion, then Marshmallow's (straight to camera)
      G.clown.lauraDone = true; G.laura.sayRandom(D().lauraClown, 2.4);
      const m = G.cat("marshmallow");
      if (m.room === c.room && !m.concealed && ["sleep", "sit", "grumble"].includes(m.state) && m.sameRoomAsLaura()) m.startStare(c, () => m.settle(), "clown");
    }
    if (G.clown.t <= 0) G.clown = null;
  }

  // ---- Laura's desk: emails and calls (and Marshmallow "helping") ----
  function startDesk(kind) {
    const L = G.laura;
    L.restFrom = { x: L.x, y: L.y };
    L.x = 3 * 16 + 8; L.y = 4 * 16 + 10; L.state = "work"; L.dir = "up";
    G.desk.screen = kind;
    G.desk.session = { kind, t: 0, idx: -1, nextT: 0, lines: kind === "email" ? D().lauraEmail : kind === "meeting" ? D().lauraMeeting : D().lauraCall };
  }
  function updateDesk(dt) {
    const s = G.desk && G.desk.session;
    if (!s) {
      if (G.desk && G.desk.screen === "nonsense" && (G.desk.nonsenseT -= dt) <= 0) G.desk.screen = "idle";
      return;
    }
    const L = G.laura;
    s.t += dt;
    if (!s.marshTried && s.t > 1.5) {
      s.marshTried = true;
      const m = G.cat("marshmallow");
      if (m.room === "masterBedroom" && !m.concealed && ["sleep", "sit"].includes(m.state) && Math.random() < 0.75) { m.keyboardRaid(); s.waitCat = true; }
    }
    if (s.waitCat) {                                   // Laura's lines pause while Marshmallow "helps"
      const m = G.cat("marshmallow");
      s.nextT = s.t + 1.2;
      if (m.room !== "masterBedroom" || (!m.moving && !["keyWalk", "sip"].includes(m.state) && !m.onAMission)) s.waitCat = false;
    }
    if (s.t >= s.nextT) {
      s.idx++;
      if (s.idx < s.lines.length) { L.say(s.lines[s.idx], 2.2); s.nextT += 2.4; if (s.kind === "email") LPK.audio.sfx.pat(s.idx % 2); }
      else {
        G.desk.session = null; G.desk.screen = "idle";
        L.state = "idle"; if (L.restFrom) { L.x = L.restFrom.x; L.y = L.restFrom.y; }
        L.sayRandom(D().lauraDeskDone, 2);
        LPK.events.emit("workFromHome", {});
        if (s.kind === "meeting") LPK.events.emit("zoomMeeting", {});
      }
    }
  }
  G.stopDesk = () => { if (G.desk.session) { G.desk.session.idx = 99; G.desk.session.nextT = 0; } };
  function updateChoiceMenu() {
    const M = G.choiceMenu, n = M.options.length;
    if (input.pressed("up")) M.sel = (M.sel + n - 1) % n;
    if (input.pressed("down")) M.sel = (M.sel + 1) % n;
    if (input.pressed("act")) { const o = M.options[M.sel]; G.choiceMenu = null; o.fn(); }
    else if (input.pressed("pause") || input.pressed("stop")) G.choiceMenu = null;
  }

  // The Royal Belly Rub timing mini-game (spec 17B)
  function updateBellyGame(dt) {
    const bg = G.bellyGame; bg.t += dt; bg.flash = Math.max(0, bg.flash - dt);
    const speed = 2.2 + bg.hits * 0.7;
    bg.marker = (Math.sin(bg.t * speed) + 1) / 2;
    G.cats.forEach(c => { if (c !== bg.cat) c.update(dt); });
    if (input.pressed("act") || input.pressed("patL") || input.pressed("patR")) {
      if (bg.marker > 0.36 && bg.marker < 0.64) {
        bg.hits++; bg.flash = 0.3; LPK.audio.sfx.rub(); G.addHeart(bg.cat);
        if (bg.hits >= 3) {
          G.petting.addRaw(bg.cat, 25); bg.cat.say(bg.cat.happyLine(), 2.5);
          G.laura.sayRandom(D().lauraBellyWin, 2.5);
          LPK.events.emit("bellyRub", {});
          endBelly();
        }
      } else {
        LPK.audio.sfx.kick(); bg.cat.say("*bunny kicks*", 1.6);
        G.laura.sayRandom(D().lauraBellyKick, 2.4);
        endBelly();
      }
    } else if (input.pressed("stop") || input.pressed("pause")) endBelly();
  }
  function endBelly() { const c = G.bellyGame.cat; G.bellyGame = null; c.setState("sit", 4); G.laura.state = "idle"; }

  function updateFoodMenu() {
    const keys = Object.keys(LPK.foods), n = keys.length + 1;
    if (input.pressed("up")) G.foodMenu.sel = (G.foodMenu.sel + n - 1) % n;
    if (input.pressed("down")) G.foodMenu.sel = (G.foodMenu.sel + 1) % n;
    if (input.pressed("act")) G.pickFood(keys[G.foodMenu.sel] || null);
    else if (input.pressed("pause") || input.pressed("stop")) G.foodMenu = null;
  }

  // Looking at Evan's drawings on the fridge: ← → flip through, Space/Q closes
  function updateArtView(dt) {
    const A = G.artView, n = (LPK.save.data.evanDrawings || []).length;
    A.t += dt;
    if (input.pressed("left")) { A.i = (A.i + n - 1) % n; A.t = 0.15; LPK.audio.sfx.click(); }
    else if (input.pressed("right")) { A.i = (A.i + 1) % n; A.t = 0.15; LPK.audio.sfx.click(); }
    else if (input.pressed("act") || input.pressed("stop") || input.pressed("pause")) G.artView = null;
  }
  G.artStep = (d) => { const A = G.artView, n = (LPK.save.data.evanDrawings || []).length; if (!A) return; A.i = (A.i + n + d) % n; A.t = 0.15; LPK.audio.sfx.click(); };

  // --------------------------------------------------------- render world
  function renderWorld() {
    const stareCat = G.cats.find(c => c.room === G.room && (c.state === "stare" || c.state === "turnCam"));
    const ce = G.clown && G.clownPos && G.clownPos.room === G.room ? G.clown.total - G.clown.t : -1;
    const clownCam = ce > 0.4 && ce < LPK.CLOWN.shut + 0.1;
    // once the mask opens, push in close on the clown's face (even past the room edge)
    const faceCam = clownCam && !stareCat && ce > LPK.CLOWN.split && ce < LPK.CLOWN.shut;
    const so = G.stareOff && G.room === "kitchen" ? G.stareOff : null;
    const tb = G.owen && G.owen.ten && G.owen.ten.step === "ask" && G.owen.room === G.room ? G.owen
      : G.evan && G.evan.bonk && ["aim", "fly", "bonk"].includes(G.evan.bonk.step) && G.evan.bonk.t < 6 && G.evan.room === G.room ? G.evan : null;
    const fightCam = so ? { x: (so.a.x + so.b.x) / 2, y: (so.a.y + so.b.y) / 2 - 22 }
      : tb ? { x: (tb.x + G.robert.x) / 2, y: (tb.y + G.robert.y) / 2 - 22 } : !stareCat && !clownCam && (LPK.catFight.focus(G) || LPK.sneak.focus(G));
    const tvCam = null;                                         // the TV no longer zooms; the view stays put
    const yardCam = !stareCat && !fightCam && !tvCam && G.yard && G.room === "kitchen" && G.yard.t < 2.0 ? { x: 17.25 * 16, y: 3 * 16 + 4 } : null;
    computeView(faceCam ? 3 : fightCam || tvCam ? 2 : yardCam || stareCat || clownCam ? 1 : 0);
    const focus = tvCam ? tvCam : yardCam ? yardCam : fightCam ? fightCam : stareCat ? { x: stareCat.x, y: stareCat.y - stareCat.z }
      : faceCam ? { x: G.clownPos.x + 8, y: G.clownPos.y - 30 }
      : clownCam ? { x: G.clownPos.x + 20, y: G.clownPos.y - 10 } : G.laura;
    updateCamera(G.dt, focus, faceCam || !!fightCam || !!yardCam || !!tvCam);
    const g = bctx;
    g.imageSmoothingEnabled = false;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = "#1c1626"; g.fillRect(0, 0, buffer.width, buffer.height);
    const sh = G.shake > 0 ? Math.round((Math.random() - 0.5) * 6 * G.shake / 0.35) : 0;
    g.translate(-Math.round(G.cam.x) + sh, -Math.round(G.cam.y) + Math.round(sh / 2));
    const w = G.world, R = LPK.roomRenderer, t = G.time;
    R.drawFloor(g, w);
    R.drawWalls(g, w, t);
    for (const cl of G.clues) if (cl.room === G.room) { LPK.px.rect(g, cl.x - 2, cl.y, 4, 2, "#f6f3ee"); LPK.px.rect(g, cl.x - 1, cl.y - 1, 2, 1, "#ffffff"); LPK.px.rect(g, cl.x + 2, cl.y + 1, 2, 1, "#8f877e"); }
    const items = w.def.furniture.map(f => R.furnitureDraw(f, w, t));
    items.push({ sortY: G.laura.sortY, draw: (g) => G.laura.draw(g) });
    G.cats.filter(c => c.room === G.room).forEach(c => items.push({ sortY: c.sortY, draw: (g) => c.draw(g) }));
    if (G.robert.present && G.robert.room === G.room) items.push({ sortY: G.robert.sortY, draw: (g) => G.robert.draw(g) });
    if (G.evan && G.evan.room === G.room) items.push({ sortY: G.evan.sortY, draw: (g) => G.evan.draw(g) });
    if (G.evan && G.evan.bonk && G.evan.room === G.room) items.push({ sortY: 9998, draw: (g) => G.evan.drawOverlay(g) });
    if (G.owen && G.owen.room === G.room) items.push({ sortY: G.owen.sortY, draw: (g) => G.owen.draw(g) });
    if (G.joe && G.joe.present && G.joe.room === G.room) items.push({ sortY: G.joe.sortY, draw: (g) => G.joe.draw(g) });
    if (G.ro && G.ro.present && G.ro.room === G.room) items.push({ sortY: G.ro.sortY, draw: (g) => G.ro.draw(g) });
    if (G.joeTreats && G.room === "kitchen") items.push({ sortY: 10 * 16 + 1, draw: (g) => {     // Tim Shortons on the dining table
      const P = LPK.px, x = 16.2 * 16, y = 7.6 * 16;
      P.rect(g, x, y, 18, 8, "#f6a8c4"); P.rect(g, x, y, 18, 2, "#e07aa0"); P.rect(g, x + 2, y + 3, 14, 3, "#c87850");
      P.rect(g, x + 4, y + 3, 3, 2, "#5a2e1a"); P.rect(g, x + 10, y + 3, 3, 2, "#f2d8a0"); P.rect(g, x + 7, y + 4, 2, 1, "#ff7aa8");
      P.rect(g, x + 22, y - 2, 9, 10, "#d8b888"); P.rect(g, x + 22, y - 2, 9, 2, "#c8a070"); P.rect(g, x + 24, y + 3, 5, 2, "#c84a3a");
    } });
    LPK.catFight.drawItems(items, G);
    LPK.sneak.drawItems(items, G);
    if (G.laundry && G.laundry.bits) items.push({ sortY: 9990, draw: (g) => G.drawLaundryBits(g) });
    for (const p of (G.debris || [])) if (p.room === G.room) items.push({ sortY: p.z > 0 ? p.y + 20 : p.y - 6, draw: (g) => LPK.px.rect(g, Math.round(p.x), Math.round(p.y - p.z), p.w, p.h, p.c) });
    if (G.smooches && G.smooches.room === G.room) {
      const S = G.smooches;
      items.push({ sortY: 9999, draw: (g) => {
        const n = Math.min(10, Math.floor(S.t / 0.22) + 1);
        for (let i = 0; i < n; i++) {
          const a = S.t - i * 0.22, p = Math.min(1, a / 1.6), tx = S.to ? S.to.x : S.x + (i % 2 ? 14 : -14), ty = S.to ? S.to.y - 40 : S.y - 30;
          const x = S.x + (tx - S.x) * p + Math.sin(a * 6 + i) * 4, y = S.y + (ty - S.y) * p - Math.sin(p * Math.PI) * 12;
          g.globalAlpha = Math.max(0, Math.min(1, 2.2 - a));
          LPK.px.heart(g, Math.round(x - 3), Math.round(y - 3), i % 3 ? "#ff5a8a" : "#ff8ab0");
          g.globalAlpha = 1;
        }
        // the count
        g.fillStyle = "#ffffff"; g.font = "bold 7px sans-serif"; g.textAlign = "center";
        g.fillText(`x${n}`, S.x + 12, S.y - 6);
      } });
    }
    for (const toy of G.toys) if (toy.room === G.room) items.push({ sortY: toy.held ? G.laura.sortY + 1 : toy.y, draw: (g) => R.drawSpring(g, toy.x, toy.y, toy.colors, t, toy.bounce) });
    items.sort((a, b) => a.sortY - b.sortY).forEach(i => i.draw(g));
    if (w.def.ambient) { g.fillStyle = w.def.ambient; g.fillRect(0, 0, w.width, w.height); }   // fairy-light / LED room glow
    R.drawLighting(g, w, Math.max(G.clock.darkness(), w.def.dim || 0), t);
    R.drawMoodLamps(g, w, Math.max(G.clock.darkness(), w.def.dim || 0), t);
    const O = G.olympics;
    if (O && O.event === "cc" && G.room === "livingRoom") O.rings.forEach((r, i) => {
      const done = i < O.ring, next = i === O.ring, pulse = next ? Math.round(Math.sin(t * 6)) : 0;
      g.strokeStyle = done ? "rgba(126,217,154,0.8)" : next ? "#ffd166" : "rgba(255,209,102,0.5)"; g.lineWidth = 2;
      g.beginPath(); g.ellipse(Math.round(r.x), Math.round(r.y), 9 + pulse, 5 + pulse, 0, 0, 7); g.stroke();
    });
    for (const f of G.floaters) if (f.room === G.room) LPK.px.heart(g, f.x - 3, f.y - f.t * 18, `rgba(255,79,134,${1 - f.t / 1.4})`);
    g.setTransform(1, 0, 0, 1, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(buffer, 0, 0, G.viewW * G.S, G.viewH * G.S);
    if (G.fade > 0) { ctx.fillStyle = `rgba(28,22,38,${G.fade / 0.35})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  }

  // --------------------------------------------------------- loop
  let last = performance.now();
  function frame(now) {
    try { step(now); } catch (e) { console.error(e); input.endFrame(); }
    requestAnimationFrame(frame);
  }
  function step(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    G.dt = dt; G.time += dt;
    const clicks = input.takeClicks();
    LPK.ui.handleClicks(G, clicks);
    if (G.screen === "play") updatePlay(dt);
    else LPK.ui.handleMenuKeys(G);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#1c1626"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!G.clock) G.clock = new LPK.Clock(LPK.config.startDay, LPK.Clock.parse(LPK.config.startTime));
    if (!G.laura) buildWorld();
    if (G.screen === "title") { G.cats.forEach(c => c.update(dt)); G.robert.update(dt); G.evan && G.evan.update(dt); G.owen && G.owen.update(dt); }
    renderWorld();
    ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    LPK.ui.draw(G, ctx);
    input.endFrame();
  }

  // Android back button (called by the app wrapper)
  window.onAndroidBack = () => {
    if (G.screen === "play") {
      if (G.celebration) { G.endCelebration(); return true; }
      if (G.foodMenu) { G.foodMenu = null; return true; }
      if (G.artView) { G.artView = null; return true; }
      if (G.choiceMenu) { G.choiceMenu = null; return true; }
      if (G.bellyGame) { endBelly(); return true; }
      if (G.petting.active) { G.petting.stop("back"); return true; }
      G.screen = "pause"; G.ui.sel = 0; return true;
    }
    if (G.screen === "pause") { G.screen = "play"; return true; }
    if (["profiles", "achievements", "settings", "skip", "wardrobe"].includes(G.screen)) { G.screen = G.prevScreen; G.ui.sel = 0; return true; }
    return false;
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { LPK.audio.purr(0); if (G.screen === "play") { G.saveNow(); if (!G.celebration) G.screen = "pause"; } }
  });

  requestAnimationFrame(frame);
  return G;
})();
