// ROBERT — the Legendary GQ Protector (spec section 7). A supporting
// character who runs on his own schedule from the game clock:
//   weekdays: wakes 4:45 AM (CC comes looking for him), leaves for work,
//             comes home late, guards Marshmallow's dinner, dozes off.
//   weekends: home more, relaxing; still guards her dinner.
// Late at night he's asleep in the pink chair — the Tiny Snore.
window.LPK = window.LPK || {};

LPK.Robert = class Robert extends LPK.Cat {
  constructor(game) {
    super("robert", game, "livingRoom.sofa");
    this.present = true; this.mode = "home"; this.didDinner = {};
    this.lastX = this.x; this.lastY = this.y; this.dir = "down";
    this.snoreT = 0; this.shadesT = 0;
  }
  get pettable() { return []; }
  get available() { return false; }
  get sortY() { return this.y + (this.z > 0 ? 8 : 0); }
  headPos() { return { x: this.x, y: this.y - this.z - (this.state === "sit" || this.state === "sleep" ? 38 : 46) }; }
  T2(str) { return LPK.Clock.parse(str); }

  // What should Robert be doing right now, according to the clock?
  desired() {
    const c = this.game.clock, m = c.minutes, S = this.def.schedule;
    const day = c.isWeekend ? S.weekend : S.weekday;
    let want;
    if (!c.isWeekend) {
      if (m < this.T2(day.wake)) want = "sleep";
      else if (m < this.T2(day.leave)) want = "morning";
      else if (m < this.T2(day.home)) want = "away";
      else if (m < this.T2(day.sleep)) want = "home";
      else want = "sleep";
    } else {
      want = m < this.T2(day.wake) || m >= this.T2(day.sleep) ? "sleep" : "home";
    }
    const dinner = this.T2(day.dinner), key = `${c.day}`;
    if (want === "home" && m >= dinner && m < dinner + 40 && !this.didDinner[key]) want = "dinner";
    if (want === "home" && this.mode === "dinner") want = "dinner";     // stays on guard until she's done
    if (this.mode === "chicken" && want !== "sleep") want = "chicken";  // finishes sharing his chicken first
    return want;
  }

  // Put him where he should be instantly (new game, Continue, time skip)
  sync() {
    const want = this.desired();
    this.stopMoving(); this.tasks = [];
    if (this.chicken) { this.chicken = null; for (const c of this.game.cats) c.begging = null; }
    this.casual = this.game.clock.isWeekend;
    if (want === "away") { this.present = false; this.mode = "away"; this.state = "away"; return; }
    this.present = true;
    if (want === "sleep") { this.placeAt("owensRoom.bed"); this.setState("sleep", 1e9); this.mode = "sleep"; return; }
    this.placeAt("livingRoom.sofa"); this.setState("sit", 20); this.mode = "home";
  }

  arrive() {
    this.placeAt("livingRoom.frontDoorIn");
    this.present = true; this.casual = this.game.clock.isWeekend;
    this.shadesT = 5;                            // Stylish Entrance
    this.say(this.pick(LPK.dialogue.robertHome), 2.5);
    const late = !this.game.clock.isWeekend && this.game.clock.hour >= 17;
    this.game.notify(late ? "Home Late" : "Robert's home!", late ? "Robert is back from work. CC is SO excited." : "Robert walks in.");
    LPK.events.emit("robertHome", { late });
  }

  think() {
    const want = this.desired();
    if (want !== this.mode) return this.transition(want);
    if (this.mode === "away" || this.mode === "sleep") return;
    if (this.mode === "dinner") return this.guard();
    if (this.mode === "chicken") return this.thinkChicken(this.game.dt || 1 / 60);
    if (this.timer <= 0 && !this.moving) this.activity();
  }

  transition(want) {
    const prev = this.mode;
    this.mode = want;
    const G = this.game;
    if (want === "away") {
      this.briefcase = true;
      this.say(this.pick(LPK.dialogue.robertLeave), 2.5);
      this.goTo("livingRoom.frontDoorIn", "walk", () => { this.present = false; this.state = "away"; this.briefcase = false; G.notify("Off to work", "Robert left for the day. See you tonight!"); });
      return;
    }
    if (!this.present) {
      this.arrive();
      // Some nights he comes home with a rotisserie chicken (the first time is a sure thing)
      const sv = LPK.save.data;
      if (want === "home" && !G.clock.isWeekend && (!sv.chickenSeen || Math.random() < 0.4)) { sv.chickenSeen = true; this.mode = "chicken"; this.startChicken(); return; }
    }
    if (prev === "sleep") {
      this.setState("sit", 2.5);
      this.say(this.pick(LPK.dialogue.robertWake), 2.5);
      const early = !G.clock.isWeekend && G.clock.hour < 6;
      if (early) { this.casual = false; G.notify("4:45 AM", "Robert's up before work... and CC comes looking for him."); }
      LPK.events.emit("robertWake", { early });
      return;
    }
    if (prev === "chicken" && this.chicken) this.endChicken(), this.mode = want;
    if (want === "chicken") { this.startChicken(); return; }
    if (want === "sleep") {
      this.goTo("owensRoom.bed", "walk", () => { this.setState("sleep", 1e9); });
      return;
    }
    if (want === "dinner") {
      this.didDinner[`${G.clock.day}`] = true;
      this.goTo("kitchen.guard", "walk", () => {
        const b = G.bowls.herBowl;
        if (!b.food) { b.food = "crunchies"; LPK.audio.sfx.crunch(); }
        this.setState("guard", 240);
        this.flip = true;
        this.say(LPK.dialogue.robertGuard[0], 3);
        G.flags.robertGuarding = true;
        G.notify("Food Guard", "Robert is guarding Marshmallow's dinner. Help him keep the boys away!");
      });
      return;
    }
    this.setState("sit", 0);
  }

  // ---- Rotisserie chicken night ----
  // He heads to the kitchen counter and starts pulling the chicken apart.
  // Orangey and Blacky come running, sit by him and beg; he tosses them
  // about half a dozen small pieces over the whole time.
  startChicken() {
    const G = this.game;
    this.mode = "chicken";
    this.chicken = { left: 6, next: 4, pieces: [], started: false };
    this.say(this.pick(LPK.dialogue.robertChickenHome), 2.6);
    G.notify("Chicken Night!", "Robert brought home a rotisserie chicken. The boys can smell it...");
    this.goTo("kitchen.counter", "walk", () => {
      this.setState("chicken", 1e9); this.flip = false; this.chicken.started = true;
      this.callBoys();
    });
  }
  callBoys() {
    const G = this.game, w = G.worlds.kitchen, T = this.T;
    const rx = Math.floor(this.x / T), ry = Math.floor(this.y / T);
    // two open floor tiles on either side, just in front of him
    const pick = (dir) => {
      for (const [dx, dy] of [[2 * dir, 1], [2 * dir, 2], [1 * dir, 2], [3 * dir, 1], [3 * dir, 2], [0, 2]])
        if (w.walkable(rx + dx, ry + dy)) return [rx + dx, ry + dy];
      return [rx, ry + 2];
    };
    const spots = { popsicle: pick(-1), cc: pick(1) };
    for (const id of ["popsicle", "cc"]) {
      const c = G.cat(id);
      if (!c || c.state === "petted" || c.concealed || c.scripted) continue;
      c.stopMoving(); c.stopEating(); c.zoomies = null;
      if (c.state === "headSleep") c.setState("sit", 1);
      c.begging = { spot: spots[id] };
      c.say("!!", 1); 
      c.goTo({ room: "kitchen", tx: spots[id][0], ty: spots[id][1] }, id === "cc" ? "sprint" : "run", () => { c.setState("begSit", 1); c.flip = this.x < c.x; });
    }
  }
  thinkChicken(dt) {
    const G = this.game, ch = this.chicken;
    if (!ch || !ch.started) return;
    const boys = G.cats.filter(c => c.begging && c.state === "begSit");
    if (ch.left > 0 && boys.length && (ch.next -= dt) <= 0) {
      // toss a small piece to one of the boys (whoever's been waiting longest)
      const c = boys.sort((a, b) => (a.lastPiece || 0) - (b.lastPiece || 0))[0];
      c.lastPiece = G.time;
      ch.left--; ch.next = 3.5 + Math.random() * 3;
      ch.pieces.push({ to: c, sx: this.x + 4, sy: this.y - 22, p: 0 });
      this.say(this.pick(LPK.dialogue.robertChickenToss), 1.6);
      this.witness("chickenShared", {}, true);
    }
    for (const pc of ch.pieces) {
      pc.p += dt / 0.6;
      if (pc.p >= 1 && !pc.done) {
        pc.done = true;
        const c = pc.to;
        if (c.begging) { c.state = "eat"; c.timer = 0.9; c.eatingBowl = null; c.eatingFood = "chicken"; c.say(c.id === "popsicle" ? "*GOBBLE*" : "*nom*", 0.9); LPK.audio.sfx.crunch(); G.petting.addRaw(c, 4); }
      }
    }
    ch.pieces = ch.pieces.filter(pc => !pc.done);
    if (ch.left <= 0 && !ch.pieces.length && (ch.wrap = (ch.wrap || 2.5) - dt) <= 0) this.endChicken();
  }
  endChicken() {
    const G = this.game;
    this.say(this.pick(LPK.dialogue.robertChickenDone), 2.4);
    for (const c of G.cats) if (c.begging) { c.begging = null; if (c.state === "begSit") { c.say(c.id === "popsicle" ? "*licks lips*" : "*satisfied*", 1.6); c.setState("sit", 4); } }
    this.chicken = null; this.mode = "home"; this.setState("stand", 3);
  }

  activity() {
    const G = this.game;
    const morning = this.mode === "morning";
    const spots = morning ? ["kitchen.counter", "livingRoom.sofa", "kitchen.counter"] : ["livingRoom.sofa", "backRoom.chair", "kitchen.counter", "livingRoom.sofa"];
    const key = spots[Math.floor(Math.random() * spots.length)];
    const spot = LPK.getSpot(key);
    this.goTo(key, "walk", () => this.setState(spot.sit ? "sit" : "stand", this.rand(this.beh.activitySeconds) * (morning ? 0.3 : 1)));
  }

  // Food Guard: redirect any boy who comes for Marshmallow's food
  guard() {
    const G = this.game;
    if (this.state !== "guard") return;
    const bowl = LPK.getSpot("kitchen.atHerBowl"), bx = bowl.x * this.T, by = bowl.y * this.T;
    for (const b of G.cats) {
      if (b.id === "marshmallow" || b.room !== "kitchen") continue;
      const comingForIt = b.eatingBowl === "herBowl" || (b.moving && b.tasks.some(t => t.spot && t.spot.id === "atHerBowl"));
      if (!comingForIt || Math.hypot(b.x - bx, b.y - by) > 46 || this.cooldown("block")) continue;
      this.setCooldown("block", this.beh.blockCooldown);
      b.stopEating(); b.stopMoving(); b.setCooldown("shooed", 8);
      b.say("!", 1);
      b.goTo(b.def.restingSpots[0], "run", () => b.setState("sit", 4));
      this.say(this.pick(LPK.dialogue.robertBlock), 1.8);
      this.flip = b.x < this.x;
    }
    if (this.timer <= 0) this.endGuard(false);
  }
  endGuard(success) {
    const G = this.game;
    G.flags.robertGuarding = false;
    if (success) {
      this.say(LPK.dialogue.robertGuardDone[0], 2.5);
      if (G.room === "kitchen") LPK.events.emit("foodGuardDone", {});
    }
    this.mode = "home"; this.setState("stand", 3);
  }

  update(dt) {
    if (!this.present) { this.think(dt); return; }
    super.update(dt);
    this.shadesT -= dt;
    if (this.cup > 0) this.cup -= dt;
    const dx = this.x - this.lastX, dy = this.y - this.lastY;
    if (Math.abs(dx) + Math.abs(dy) > 0.01) {
      if (Math.abs(dx) > Math.abs(dy)) { this.dir = "side"; this.flip = dx < 0; } else this.dir = dy < 0 ? "up" : "down";
    }
    this.lastX = this.x; this.lastY = this.y;
    // The Tiny Snore: extraordinarily quiet and cute
    if (this.state === "sleep" && this.room === this.game.room && this.distTo(this.game.laura) < 140) {
      if ((this.snoreT -= dt) <= 0) { this.snoreT = 2.4; LPK.audio.sfx.tinySnore(); }
    }
  }

  draw(g) {
    if (!this.present || this.state === "transit") return;
    const walking = this.state === "move";
    const pose = this.state === "sleep" ? "sleep" : this.state === "sit" ? "sit" : walking ? "walk" : "stand";
    const shapes = LPK.sprites.robert(walking ? this.dir : "down", Math.floor(this.t * 5), {
      pose: this.state === "sleep" && this.spot && this.spot.lie ? "lie" : pose, casual: this.casual, shades: this.shadesT > 0 && !this.casual, briefcase: this.briefcase, sleeping: this.state === "sleep", glasses: this.casual, rubHead: this.rubHead,
    });
    if (this.z === 0) LPK.px.rect(g, this.x - 8, this.y - 1, 16, 2, "rgba(0,0,0,0.22)");
    LPK.px.draw(g, shapes, this.x, this.y - this.z, walking && this.dir === "side" && this.flip);
    if (this.rubHead) {                                       // confused little "?"
      const qx = this.x + 9, qy = this.y - this.z - 54 - Math.floor(this.t * 3) % 2;
      LPK.px.rect(g, qx, qy, 3, 1, "#ffd166"); LPK.px.rect(g, qx + 2, qy + 1, 1, 2, "#ffd166"); LPK.px.rect(g, qx + 1, qy + 3, 1, 1, "#ffd166"); LPK.px.rect(g, qx + 1, qy + 5, 1, 1, "#ffd166");
    }
    if (this.wallet) {                                        // his wallet...
      const s = this.walletSide || 1, wx = this.x + s * 8, wy = this.y - this.z - (this.wallet === "up" ? 30 : 17);
      if (this.wallet === "up") {
        // ...and the hand that comes up instead. Censored.
        const t = Math.floor(LPK.game.time * 10);
        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) LPK.px.rect(g, wx - 4 + i * 2, wy - 6 + j * 2, 2, 2, ["#e2b08e", "#c8946e", "#f0c8a8", "#b88262", "#9a6a52"][(i * 3 + j * 7 + t) % 5]);
        LPK.px.rect(g, wx - 5, wy - 7, 10, 1, "rgba(0,0,0,0.35)"); LPK.px.rect(g, wx - 5, wy + 2, 10, 1, "rgba(0,0,0,0.35)");
      } else { LPK.px.rect(g, wx - 2, wy - 1, 5, 4, "#4a2e1e"); LPK.px.rect(g, wx - 2, wy, 5, 1, "#6a442c"); }
    }
    if (this.cup > 0 && this.state !== "sleep") {             // his cappuccino from Joe
      const cx = this.x + 8, cy = this.y - this.z - 18;
      LPK.px.rect(g, cx - 2, cy - 3, 5, 4, "#fbfbf8"); LPK.px.rect(g, cx - 2, cy - 4, 5, 2, "#e8d8b8"); LPK.px.rect(g, cx - 1, cy - 4, 3, 1, "#6a3a22");
    }
    if (this.chicken) {
      // the rotisserie chicken (in its container on the counter while he pulls it apart)
      const cx = this.x + 1, cy = this.y - 24, pull = this.state === "chicken" ? Math.floor(this.t * 3) % 2 : 0;
      LPK.px.rect(g, cx - 7, cy + 2, 14, 3, "#2a2a2e");
      LPK.px.ellipse(g, cx, cy, 6, 3, "#3a2210"); LPK.px.ellipse(g, cx, cy, 5, 2.5, "#c47a2c");
      LPK.px.rect(g, cx - 3, cy - 2, 3, 1, "#e0a050"); LPK.px.rect(g, cx + 3 + pull, cy - 3 - pull, 2, 2, "#e8b468");
      for (const pc of this.chicken.pieces) {
        const t = Math.min(1, pc.p), tx = pc.to.x + (pc.to.flip ? -6 : 6), ty = pc.to.y - 2;
        const x = pc.sx + (tx - pc.sx) * t, y = pc.sy + (ty - pc.sy) * t - Math.sin(t * Math.PI) * 14;
        LPK.px.rect(g, x - 1, y - 1, 3, 2, "#e8b468"); LPK.px.rect(g, x, y - 1, 1, 1, "#c47a2c");
      }
    }
    if (this.state === "sleep") {                 // a very small "z"
      const p = (this.t * 0.5) % 1, lie = this.spot && this.spot.lie, zx = lie ? this.x - 22 : this.x, zy = lie ? this.y - this.z + 18 : this.y - this.z;
      LPK.px.rect(g, zx + 6 + p * 4, zy - 40 - p * 6, 3, 1, `rgba(140,150,220,${1 - p})`);
      LPK.px.rect(g, zx + 8 + p * 4, zy - 41 - p * 6, 1, 1, `rgba(140,150,220,${1 - p})`);
      LPK.px.rect(g, zx + 6 + p * 4, zy - 42 - p * 6, 3, 1, `rgba(140,150,220,${1 - p})`);
    }
  }
};
