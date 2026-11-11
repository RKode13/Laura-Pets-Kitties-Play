// EVAN — Laura's son. Super curious, creative and full of energy: always
// running around and getting into things. Draws (his drawings go on the
// fridge), flies his toy plane, squeezes squishies, plays Laura Pets Kitties
// on his iPad, visits the cats and asks for pasta or fruit.
// Bedtime: tuck him in between 7:30 and 8:15 PM for bonus points — he says
// "Okay, mommy, I'm ready for bed" and goes straight to bed.
window.LPK = window.LPK || {};

LPK.Evan = class Evan extends LPK.Cat {
  constructor(game, id = "evan", spot = "evansRoom.evanPlay") {
    super(id, game, spot);
    this.present = true; this.mode = "day"; this.tucked = false; this.holding = null;
    this.lastX = this.x; this.lastY = this.y; this.dir = "down";
  }
  get pettable() { return []; }
  get available() { return false; }
  get sortY() { return this.y + (this.z > 0 ? 8 : 0); }
  get D() { return LPK.dialogue; }
  headPos() { return { x: this.x, y: this.y - this.z - (this.state === "sleep" ? 14 : this.isSitting ? 26 : 34) }; }
  get sitStates() { return ["sit", "draw", "squish", "ipad", "snack"]; }
  get isSitting() { return this.sitStates.includes(this.state) && this.spot && this.spot.sit; }
  mins() { return this.game.clock.minutes; }
  at(str) { return LPK.Clock.parse(str); }
  get S() { return this.def.schedule; }
  bedtime() { const m = this.mins(); return this.tucked || m >= this.at(this.S.bed) || m < this.wakeMins(); }
  // wake-up time: a set time, or (with wakeLatest) a random time each morning between wake and wakeLatest
  wakeMins() {
    const S = this.S, c = this.game.clock;
    if (!S.wakeLatest) return this.at(S.wake);
    if (this.wakeDay !== c.day) { this.wakeDay = c.day; const a = this.at(S.wake), b = this.at(S.wakeLatest); this.wakeAt = Math.round(a + Math.random() * (b - a)); }
    return this.wakeAt;
  }
  inBedtimeWindow() { const m = this.mins(); return !this.tucked && m >= this.at(this.S.bedWindow) && m < this.at(this.S.bed); }
  outfit() {
    if (this.bedtime() || this.state === "sleep") return "pajamas";
    return this.game.clock.isWeekend ? "zip" : "sweater";
  }
  fill(line, map) { return line.replace(/\{(\w+)\}/g, (_, k) => map[k]); }

  // Put him where he should be right now (new game, Continue, time skip)
  sync() {
    if (this.bonk) { const R = this.game.robert; if (R) { R.rubHead = false; R.fighting = false; } this.bonk = null; }
    this.fighting = false; this.handsOnHead = false;
    this.stopMoving(); this.tasks = []; this.holding = null; this.tucked = false;
    if (this.bedtime()) { this.placeAt("evansRoom.evanSleep"); this.setState("sleep", 1e9); this.mode = "night"; return; }
    this.placeAt("evansRoom.evanPlay"); this.setState("stand", 3); this.mode = "day";
  }

  think(dt = 1 / 60) {
    const G = this.game, night = this.bedtime();
    // ---- night & morning
    if (night && this.mode !== "night") {
      this.mode = "night"; this.holding = null;
      this.say(this.pick(this.D.evanBedtime), 2.2);
      this.goTo("evansRoom.evanSleep", "walk", () => this.setState("sleep", 1e9));
      return;
    }
    if (!night && this.mode === "night") {
      this.mode = "day"; this.tucked = false;
      this.say(this.pick(this.D.evanWake), 2.2);
      this.setState("stand", 2);
      return;
    }
    if (this.mode === "night") return;
    // ---- the bedtime window opens
    const key = G.clock.day;
    if (this.inBedtimeWindow() && this.windowNotified !== key) {
      this.windowNotified = key;
      G.notify("Evan's bedtime!", "Tuck Evan in between 7:30 and 8:15 PM for bonus points.");
    }
    // ---- say hi when Mommy comes by
    const L = G.laura;
    if (this.sameRoomAsLaura() && this.distTo(L) < 40 && !this.cooldown("chat") && !this.bubble && !["askSnack", "snack"].includes(this.state)) {
      this.setCooldown("chat", 30);
      this.say(this.pick(this.D.evanChat), 2.2);
    }
    // ---- what he's busy with
    switch (this.state) {
      case "draw":
        if (this.timer <= 0) this.finishDrawing();
        return;
      case "squish":
        if (Math.random() < dt * 0.25) this.say(this.pick(this.D.evanSquishy), 1.4);
        if (this.timer <= 0) { this.holding = null; this.setState("stand", 1); }
        return;
      case "ipad":
        this.witness("evanIpad");
        if (Math.random() < dt * 0.15) this.say(this.pick(this.D.evanIpad), 2);
        if (this.timer <= 0) { this.holding = null; this.setState("stand", 1); }
        return;
      case "askSnack":
        if (this.timer <= 0) { this.say(this.pick(this.D.evanSnackNever), 1.6); this.setState("stand", 1); }
        else if (!this.bubble && Math.random() < dt * 0.2) this.say(this.fill(this.pick(this.D.evanSnackAsk), { food: this.snackWant }), 2);
        return;
      case "snack":
        if (this.timer <= 0) { this.holding = null; this.setState("stand", 1); }
        return;
      case "explore":
        if (this.timer <= 0) this.setState("stand", 0.5);
        return;
      case "flying":
        if (this.timer > 0) return;
        if (--this.planeLeft > 0) { if (Math.random() < 0.4) this.say(this.pick(this.D.evanPlane), 1.2); this.planeHop(); }
        else { this.holding = null; this.setState("stand", 2); }
        return;
    }
    if (this.timer <= 0 && !this.moving) this.activity();
  }

  // Lots of energy: always off to do something new (and usually running)
  activity() {
    const acts = ["plane", "plane", "draw", "draw", "squishy", "ipad", "ipad", "cats", "cats", "snack", "explore", "explore", "explore"];
    const a = acts[Math.floor(Math.random() * acts.length)];
    if (a === "snack" && this.cooldown("snack")) return this.explore();
    if (a === "draw") return this.drawSomething();          // (draw() is what paints him on screen)
    this[a]();
  }
  go(key, then) {
    const spot = LPK.getSpot(key);
    if (!this.goTo(key, "run", () => { this.spot = spot; then(spot); })) this.setState("stand", 2);
  }
  plane() {
    this.holding = "plane"; this.planeLeft = 3 + Math.floor(Math.random() * 3);
    this.say(this.pick(this.D.evanPlane), 1.6);
    this.planeHop();
  }
  // one leg of the flight; the next leg starts from think() (state "flying")
  planeHop() {
    const w = this.world;
    for (let i = 0; i < 30; i++) {
      const tx = Math.floor(Math.random() * w.grid[0].length), ty = Math.floor(Math.random() * w.grid.length);
      if (w.walkable(tx, ty) && w.path(this.x, this.y, tx, ty).length >= 3) {
        this.goTo({ room: this.room, tx, ty }, "run", () => this.setState("flying", 0.2));
        return;
      }
    }
    this.holding = null; this.setState("stand", 2);
  }
  squishy() { this.go(Math.random() < 0.6 ? "evansRoom.evanBedSit" : "livingRoom.couch", () => { this.holding = "squishy"; this.setState("squish", this.rand([8, 14])); }); }
  ipad() { this.go(Math.random() < 0.6 ? "livingRoom.couch" : "evansRoom.evanBedSit", () => { this.holding = "ipad"; this.setState("ipad", this.rand([12, 22])); }); }
  explore() {
    // getting into things: anywhere in the house that's interesting
    const rooms = ["livingRoom", "kitchen", "backRoom", "hallway", "evansRoom"], room = rooms[Math.floor(Math.random() * rooms.length)];
    const poi = LPK.rooms[room].pointsOfInterest, [tx, ty] = poi[Math.floor(Math.random() * poi.length)];
    this.goTo({ room, tx, ty }, "run", () => { this.setState("explore", this.rand([2.5, 5])); this.say(this.pick(this.D.evanExplore), 1.6); });
  }
  cats() {
    const cats = this.game.cats.filter(c => !c.concealed && c.state !== "transit" && LPK.rooms[c.room]);
    const c = cats[Math.floor(Math.random() * cats.length)];
    if (!c) return this.explore();
    const tx = Math.floor(c.x / 16) + (Math.random() < 0.5 ? -1 : 1), ty = Math.floor(c.y / 16);
    const name = c.def.nicknames && c.def.nicknames[0] || c.def.name;
    this.goTo({ room: c.room, tx, ty }, "run", () => {
      this.flip = c.x < this.x; this.setState("stand", 3);
      this.say(this.fill(this.pick(this.D.evanCatHi), { cat: name }), 2);
      if (c.room === this.room && c.distTo(this) < 40 && ["sit", "sleep"].includes(c.state)) { c.say("*purr*", 1.4); c.happiness = Math.max(c.happiness, Math.min(100, c.happiness + 3)); }
      LPK.events.emit("evanCatVisit", { cat: c.id });
    });
  }
  snack() {
    this.setCooldown("snack", 90);
    this.snackWant = Math.random() < 0.55 ? "pasta" : "fruit";
    this.go("kitchen.table", () => {
      this.flip = false; this.setState("askSnack", 30);
      this.say(this.fill(this.pick(this.D.evanSnackAsk), { food: this.snackWant }), 2.4);
    });
  }
  giveSnack() {
    const G = this.game, food = this.snackWant;
    this.holding = food; this.setState("snack", 6);
    this.flip = G.laura.x < this.x;
    this.say(this.fill(this.pick(this.D.evanSnackYum), { food: food[0].toUpperCase() + food.slice(1) }), 2.4);
    G.progression.addPoints(this.def.snackPoints); LPK.audio.sfx.found();
    LPK.events.emit("evanSnack", { food });
  }
  drawSomething() {
    this.go(Math.random() < 0.65 ? "evansRoom.evanDraw" : "livingRoom.couch", () => { this.holding = "paper"; this.setState("draw", this.rand([10, 18])); });
  }
  finishDrawing() {
    const sv = LPK.save.data, what = this.pick(this.D.evanDrawSubjects);
    const pal = ["#e84a5a", "#4a8ae8", "#4ac06a", "#f2b43a", "#c77dff", "#ff7aa8", "#6e4128"];
    const c = [0, 1, 2].map(() => pal[Math.floor(Math.random() * pal.length)]);
    sv.evanDrawings = [...(sv.evanDrawings || []), { what, c, seed: Math.floor(Math.random() * 1e9) }].slice(-6);
    LPK.save.write();
    this.holding = null; this.setState("stand", 2);
    this.say(this.fill(this.pick(this.D.evanDrawDone), { what }), 2.6);
    LPK.events.emit("evanDrawing", { what });
  }
  // ---- The plane stunt: Evan throws his plane, it loops the loop, comes
  // back around... and BONKS Robert in the back. Robert rubs his head:
  // "What the heck?" Evan stares, then runs off screaming, hands on head.
  canBonk() {
    const G = this.game, R = G.robert;
    return this.id === "evan" && this.mode === "day" && !this.fighting && !this.moving && this.z === 0 && !this.tucked
      && !["askSnack", "snack", "flying"].includes(this.state)
      && R.present && R.mode === "home" && !R.moving && !R.fighting && R.room === this.room && this.room === G.room && ["sit", "stand"].includes(R.state)
      && !G.hungry && !(G.joe && G.joe.sc) && !(G.owen && G.owen.ten) && !LPK.catFight.active && !G.laura.busy;
  }
  startBonk() {
    const G = this.game, R = G.robert, w = this.world;
    // a spot 3-5 tiles to Robert's side, with room to throw
    let spot = null;
    for (const dx of [-4, 4, -5, 5, -3, 3]) for (const dy of [1, 0, 2]) {
      const tx = Math.floor(R.x / 16) + dx, ty = Math.floor(R.y / 16) + dy;
      if (!spot && w.walkable(tx, ty) && w.walkable(tx + Math.sign(dx), ty) && w.walkable(tx + 2 * Math.sign(dx), ty)) spot = { tx, ty, side: Math.sign(dx) };
    }
    if (!spot) return;
    this.fighting = true; R.fighting = true; this.holding = "plane";
    this.bonk = { t: 0, step: "walk", side: spot.side };
    this.say(this.pick(this.D.evanPlane), 1.4);
    this.goTo({ room: this.room, tx: spot.tx, ty: spot.ty }, "run", () => { this.bonk.step = "aim"; this.bonk.t = 0; });
  }
  updateBonk(dt) {
    const B = this.bonk; if (!B) return;
    const G = this.game, R = G.robert, D = this.D;
    B.t += dt;
    if (B.step === "walk") { if (B.t > 12) { this.stopMoving(); B.step = "aim"; B.t = 0; } return; }
    const beat = (at, fn) => { if (B.t >= at && !B[at]) { B[at] = true; fn(); } };
    if (B.step === "aim") {
      beat(0, () => { this.setState("stand", 99); this.flip = B.side > 0 ? false : true; this.say("Vrooooom!", 1.2); });
      beat(0.8, () => {                                     // throw! (away from Robert)
        this.holding = null; B.step = "fly"; B.t = 0;
        const hx = this.x + B.side * 6, hy = this.y - 22;
        B.p0 = { x: hx, y: hy }; B.p1 = { x: hx + B.side * 44, y: hy - 6 };
        B.tg = { x: R.x - B.side * 2, y: R.y - R.z - 22 };
        LPK.audio.sfx.boing();
      });
      return;
    }
    if (B.step === "fly") {
      // out (0.6s) -> loop-the-loop (0.9s) -> back around to Robert (0.9s)
      const t = B.t;
      if (t < 0.6) { const k = t / 0.6; B.pos = { x: B.p0.x + (B.p1.x - B.p0.x) * k, y: B.p0.y + (B.p1.y - B.p0.y) * k }; B.dir = B.side; }
      else if (t < 1.5) { const a = (t - 0.6) / 0.9 * Math.PI * 2; B.pos = { x: B.p1.x + Math.sin(a) * 14 * B.side, y: B.p1.y - 14 + Math.cos(a) * 14 }; B.dir = Math.cos(a) >= 0 ? B.side : -B.side; }
      else {
        const k = Math.min(1, (t - 1.5) / 0.9), cx = B.p1.x + B.side * 30, cy = B.p1.y + 12;   // a wide curve back around
        const u = 1 - k; B.pos = { x: u * u * B.p1.x + 2 * u * k * cx + k * k * B.tg.x, y: u * u * B.p1.y + 2 * u * k * cy + k * k * B.tg.y }; B.dir = -B.side;
        if (k >= 1) {
          B.step = "bonk"; B.t = 0; B.pos = null; B.floor = { x: R.x + B.side * 6, y: R.y + 2 };
          LPK.audio.sfx.kick(); G.shake = 0.2; R.say("*BONK*", 1.0);
        }
      }
      return;
    }
    if (B.step === "bonk") {
      beat(0.6, () => { R.rubHead = true; });
      beat(2.2, () => { R.say(D.robertBonk[0], 2.2); });
      beat(4.0, () => { this.flip = R.x < this.x; this.say("!", 0.8); });          // Evan looks at him...
      beat(4.9, () => {                                                          // ...and RUNS
        this.say(D.evanScream[0], 3.2); this.handsOnHead = true; LPK.audio.sfx.startle();
        const away = ["kitchen.table", "backRoom.field", "evansRoom.evanPlay", "livingRoom.couch"].filter(k => !k.startsWith(this.room + "."));
        this.goTo(away[Math.floor(Math.random() * away.length)], "run", () => { this.handsOnHead = false; this.setState("stand", 2); });
        if (this.sameRoomAsLaura()) LPK.events.emit("planeBonk", {});
      });
      beat(5.6, () => { R.rubHead = false; R.fighting = false; R.setState(R.state === "sit" ? "sit" : "stand", 4); this.fighting = false; });
      beat(12, () => { this.bonk = null; this.bonkCool = 420 + Math.random() * 300; });
    }
  }
  drawBonk(g) {
    const B = this.bonk; if (!B) return;
    const P = LPK.px;
    if (B.pos) {                                           // the paper... er, toy plane in flight
      const x = Math.round(B.pos.x), y = Math.round(B.pos.y), d = B.dir || 1;
      P.rect(g, x - 5, y, 10, 2, "#eef0f6"); P.rect(g, x - 1, y - 3, 3, 8, "#4a8ae8"); P.rect(g, d > 0 ? x - 6 : x + 4, y - 2, 2, 2, "#e84a5a");
      P.rect(g, d > 0 ? x - 10 : x + 7, y + 1, 3, 1, "rgba(255,255,255,0.6)");
    }
    if (B.floor) { const x = B.floor.x, y = B.floor.y; P.rect(g, x - 5, y - 2, 10, 2, "#eef0f6"); P.rect(g, x - 1, y - 3, 3, 4, "#4a8ae8"); }
  }

  // Mommy says it's bedtime: straight to bed, bonus points
  tuckIn() {
    const G = this.game;
    this.tucked = true; this.mode = "night"; this.holding = null;
    this.stopMoving(); this.tasks = [];
    this.say(this.D.evanTuckIn[0], 2.8);
    G.progression.addPoints(this.def.bedtimePoints);
    G.notify("Bedtime Hero!", `+${this.def.bedtimePoints} Kitty Happiness Points: Evan went right to bed.`);
    LPK.audio.sfx.achievement();
    LPK.events.emit("evanBedtime", {});
    setTimeout(() => this.goTo("evansRoom.evanSleep", "walk", () => this.setState("sleep", 1e9)), 900);
  }

  update(dt) {
    super.update(dt);
    if (this.id === "evan") {
      if (this.bonk) this.updateBonk(dt);
      else if ((this.bonkCool = (this.bonkCool ?? 100) - dt) <= 0 && this.canBonk() && Math.random() < dt / 40) this.startBonk();
    }
    const dx = this.x - this.lastX, dy = this.y - this.lastY;
    if (Math.abs(dx) + Math.abs(dy) > 0.01) {
      if (Math.abs(dx) > Math.abs(dy)) { this.dir = "side"; this.flip = dx < 0; } else this.dir = dy < 0 ? "up" : "down";
    }
    this.lastX = this.x; this.lastY = this.y;
  }

  draw(g) {
    if (this.state === "transit") return;
    const walking = this.state === "move";
    const lie = this.state === "sleep" && this.spot && this.spot.lie;
    const pose = lie ? "lie" : this.isSitting ? "sit" : walking ? "walk" : "stand";
    const fps = this.moveMode === "run" ? 11 : 6;
    const anim = this.state === "squish" ? Math.floor(this.t * 3) : this.state === "draw" ? Math.floor(this.t * 5) : Math.floor(this.t * fps);
    const shapes = LPK.sprites.kid(this.id, walking ? this.dir : "down", anim, { pose, outfit: this.outfit(), sleeping: this.state === "sleep", hold: this.holding, swing: this.swinging, handsOnHead: this.handsOnHead });
    if (this.z === 0) LPK.px.rect(g, this.x - 6, this.y - 1, 12, 2, "rgba(0,0,0,0.22)");
    LPK.px.draw(g, shapes, this.x, this.y - this.z, lie ? !!this.spot.headRight : walking && this.dir === "side" && this.flip);
    if (this.state === "sleep") {
      const p = (this.t * 0.5) % 1, zx = lie ? (this.spot.headRight ? this.x + 12 : this.x - 18) : this.x, zy = this.y - this.z;
      LPK.px.rect(g, zx + 4 + p * 4, zy - 22 - p * 6, 3, 1, `rgba(140,150,220,${1 - p})`);
      LPK.px.rect(g, zx + 6 + p * 4, zy - 23 - p * 6, 1, 1, `rgba(140,150,220,${1 - p})`);
      LPK.px.rect(g, zx + 4 + p * 4, zy - 24 - p * 6, 3, 1, `rgba(140,150,220,${1 - p})`);
    }
    this.drawExtra && this.drawExtra(g);
  }
  // the plane can fly far from Evan, so it's drawn on top of the room
  drawOverlay(g) { if (this.bonk) this.drawBonk(g); }
};
