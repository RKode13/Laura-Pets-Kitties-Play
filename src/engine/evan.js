// EVAN — Laura's son. Super curious, creative and full of energy: always
// running around and getting into things. Draws (his drawings go on the
// fridge), flies his toy plane, squeezes squishies, plays Laura Pets Kitties
// on his iPad, visits the cats and asks for pasta or fruit.
// Bedtime: tuck him in between 7:30 and 8:15 PM for bonus points — he says
// "Okay, mommy, I'm ready for bed" and goes straight to bed.
window.LPK = window.LPK || {};

LPK.Evan = class Evan extends LPK.Cat {
  constructor(game) {
    super("evan", game, "evansRoom.evanPlay");
    this.present = true; this.mode = "day"; this.tucked = false; this.holding = null;
    this.lastX = this.x; this.lastY = this.y; this.dir = "down";
  }
  get pettable() { return []; }
  get available() { return false; }
  get sortY() { return this.y + (this.z > 0 ? 8 : 0); }
  get D() { return LPK.dialogue; }
  headPos() { return { x: this.x, y: this.y - this.z - (this.state === "sleep" ? 14 : this.isSitting ? 26 : 34) }; }
  get isSitting() { return ["sit", "draw", "squish", "ipad", "snack"].includes(this.state) && this.spot && this.spot.sit; }
  mins() { return this.game.clock.minutes; }
  at(str) { return LPK.Clock.parse(str); }
  get S() { return this.def.schedule; }
  bedtime() { const m = this.mins(); return this.tucked || m >= this.at(this.S.bed) || m < this.at(this.S.wake); }
  inBedtimeWindow() { const m = this.mins(); return !this.tucked && m >= this.at(this.S.bedWindow) && m < this.at(this.S.bed); }
  outfit() {
    if (this.bedtime() || this.state === "sleep") return "pajamas";
    return this.game.clock.isWeekend ? "zip" : "sweater";
  }
  fill(line, map) { return line.replace(/\{(\w+)\}/g, (_, k) => map[k]); }

  // Put him where he should be right now (new game, Continue, time skip)
  sync() {
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
    const shapes = LPK.sprites.evan(walking ? this.dir : "down", anim, { pose, outfit: this.outfit(), sleeping: this.state === "sleep", hold: this.holding });
    if (this.z === 0) LPK.px.rect(g, this.x - 6, this.y - 1, 12, 2, "rgba(0,0,0,0.22)");
    LPK.px.draw(g, shapes, this.x, this.y - this.z, walking && this.dir === "side" && this.flip);
    if (this.state === "sleep") {
      const p = (this.t * 0.5) % 1, zx = lie ? this.x - 18 : this.x, zy = this.y - this.z;
      LPK.px.rect(g, zx + 4 + p * 4, zy - 22 - p * 6, 3, 1, `rgba(140,150,220,${1 - p})`);
      LPK.px.rect(g, zx + 6 + p * 4, zy - 23 - p * 6, 1, 1, `rgba(140,150,220,${1 - p})`);
      LPK.px.rect(g, zx + 4 + p * 4, zy - 24 - p * 6, 3, 1, `rgba(140,150,220,${1 - p})`);
    }
  }
};
