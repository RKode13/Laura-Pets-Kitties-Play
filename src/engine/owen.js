// OWEN — Laura's son, Evan's big brother. Plays flag football and baseball,
// and loves video games: Fortress Evening on his Pretendo Stitch, and Laura
// Pets Kitties. Every night he has to keep up his streaks: remind him
// between 7:00 and 8:30 PM (before or after Evan's bedtime) for bonus points.
// Miss 8:30 and he loses his streak. He sleeps in Laura's big bed.
// Shares Evan's kid engine (movement, drawing, saying hi to the cats).
window.LPK = window.LPK || {};

LPK.Owen = class Owen extends LPK.Evan {
  constructor(game) { super(game, "owen", "livingRoom.owenCouch"); this.gear = null; }
  get sitStates() { return ["sit", "gaming", "streaks"]; }
  headPos() { return { x: this.x, y: this.y - this.z - (this.state === "sleep" ? 14 : this.isSitting ? 30 : 38) }; }
  inBedtimeWindow() { return false; }
  get today() { return this.game.clock.day; }
  streakWindow() { const m = this.mins(); return this.streakDay !== this.today && m >= this.at(this.S.streakStart) && m < this.at(this.S.streakBy); }
  outfit() {
    if (this.bedtime() || this.state === "sleep") return "pajamas";
    if (this.gear) return this.gear;
    return this.game.clock.isWeekend ? "football" : "school";
  }

  sync() {
    this.stopMoving(); this.tasks = []; this.holding = null; this.gear = null; this.ball = null; this.tucked = false;
    if (this.bedtime()) { this.placeAt("masterBedroom.owenSleep"); this.setState("sleep", 1e9); this.mode = "night"; return; }
    this.placeAt("livingRoom.owenCouch"); this.setState("sit", 3); this.mode = "day";
  }

  think(dt = 1 / 60) {
    const G = this.game, D = this.D, night = this.bedtime(), m = this.mins();
    if (night && this.mode !== "night") {
      this.mode = "night"; this.holding = null; this.gear = null; this.ball = null;
      this.say(this.pick(D.owenBedtime), 2.2);
      this.goTo("masterBedroom.owenSleep", "walk", () => this.setState("sleep", 1e9));
      return;
    }
    if (!night && this.mode === "night") { this.mode = "day"; this.say(this.pick(D.owenWake), 2.2); this.setState("stand", 2); return; }
    if (this.mode === "night") return;
    // ---- streaks
    if (this.streakWindow() && this.streakNotified !== this.today) {
      this.streakNotified = this.today;
      G.notify("Owen's streaks!", "Remind Owen to do his streaks before 8:30 PM (before or after Evan's bedtime).");
    }
    if (m >= this.at(this.S.streakBy) && m < this.at(this.S.bed) && this.streakDay !== this.today && this.lostDay !== this.today) {
      this.lostDay = this.today;
      this.say(D.owenStreakLost[0], 3);
      G.notify("Streak lost!", "Owen didn't do his streaks by 8:30 PM.");
      LPK.events.emit("owenStreakLost", {});
    }
    // ---- say hi to Mom
    const L = G.laura;
    if (this.sameRoomAsLaura() && this.distTo(L) < 40 && !this.cooldown("chat") && !this.bubble && this.state !== "streaks") {
      this.setCooldown("chat", 35); this.say(this.pick(D.owenChat), 2.2);
    }
    switch (this.state) {
      case "gaming":
        this.witness("owenGaming");
        if (Math.random() < dt * 0.2) this.say(this.pick(D.owenGame), 2);
        if (this.timer <= 0) { this.holding = null; this.setState("stand", 1); }
        return;
      case "streaks":
        if (this.timer <= 0) {
          this.holding = null; this.setState("stand", 2);
          this.say(this.pick(D.owenStreakDone), 2.4);
          G.progression.addPoints(this.def.streakPoints); LPK.audio.sfx.found();
          G.notify("Streak saved!", `+${this.def.streakPoints} Kitty Happiness Points: Owen kept his streak alive.`);
          LPK.events.emit("owenStreaks", {});
        }
        return;
      case "throw":                                 // wind up... and throw
        if (this.timer <= 0) this.launchBall();
        return;
      case "watchBall":
        if (this.ball && this.ball.t >= 1) {
          const b = this.ball;
          this.goTo({ room: this.room, tx: Math.floor(b.x1 / 16), ty: Math.floor(b.y1 / 16) }, "run", () => this.setState("catch", 0.5));
        }
        return;
      case "catch":
        if (this.timer > 0) return;
        this.ball = null;
        if (--this.ballsLeft > 0) { this.holding = "football"; this.setState("throw", 0.8); if (Math.random() < 0.5) this.say(this.pick(D.owenFootball), 1.4); }
        else { this.holding = null; this.gear = null; this.setState("stand", 2); }
        return;
      case "swing":                                 // batting practice
        this.swingT = (this.swingT || 0) + dt;
        this.swinging = (this.swingT % 1.4) > 1.1;
        if (this.swinging && !this.cracked) { this.cracked = true; LPK.audio.sfx.kick(); if (Math.random() < 0.35) this.say(this.pick(D.owenBaseball), 1.4); }
        if (!this.swinging) this.cracked = false;
        if (this.timer <= 0) { this.holding = null; this.gear = null; this.swinging = false; this.setState("stand", 2); }
        return;
      case "explore":
        if (this.timer <= 0) this.setState("stand", 0.5);
        return;
    }
    if (this.timer <= 0 && !this.moving) this.activity();
  }

  activity() {
    const acts = ["gaming", "gaming", "gaming", "football", "baseball", "cats", "explore"];
    const a = acts[Math.floor(Math.random() * acts.length)];
    this[a === "gaming" ? "gamingTime" : a]();
  }
  gamingTime() {
    this.go(Math.random() < 0.6 ? "livingRoom.owenCouch" : "owensRoom.owenFloor", () => { this.holding = "stitch"; this.setState("gaming", this.rand([15, 28])); });
  }
  football() {
    this.gear = "football";
    this.go("backRoom.field", () => { this.ballsLeft = 3; this.holding = "football"; this.setState("throw", 0.8); this.say(this.pick(this.D.owenFootball), 1.4); });
  }
  baseball() {
    this.gear = "baseball"; this.swingT = 0;
    this.go("backRoom.field", () => { this.holding = "bat"; this.setState("swing", this.rand([7, 11])); this.say(this.D.owenBaseball[2], 1.4); });
  }
  launchBall() {
    const w = this.world;
    for (let i = 0; i < 30; i++) {
      const tx = Math.floor(Math.random() * w.grid[0].length), ty = Math.floor(Math.random() * w.grid.length);
      const d = Math.hypot(tx * 16 + 8 - this.x, ty * 16 + 8 - this.y);
      if (w.walkable(tx, ty) && d > 48 && d < 130 && w.path(this.x, this.y, tx, ty).length >= 3) {
        this.ball = { x0: this.x, y0: this.y - 20, x1: tx * 16 + 8, y1: ty * 16 + 10, t: 0, dur: 0.5 + d / 220 };
        this.flip = this.ball.x1 < this.x; this.holding = null;
        this.setState("watchBall", 99);
        return;
      }
    }
    this.holding = null; this.gear = null; this.setState("stand", 2);
  }
  // Laura: "Owen, do your streaks!"
  doStreaks() {
    this.streakDay = this.today;
    this.stopMoving(); this.tasks = [];
    this.say(this.D.owenStreakOk[0], 2.2);
    this.holding = "phone"; this.setState("streaks", 5);
  }

  update(dt) {
    super.update(dt);
    if (this.ball) this.ball.t = Math.min(1, this.ball.t + dt / this.ball.dur);
  }
  drawExtra(g) {
    const b = this.ball;
    if (!b || b.t >= 1 && this.state !== "watchBall") return;
    const t = b.t, x = b.x0 + (b.x1 - b.x0) * t, y = b.y0 + (b.y1 - b.y0) * t - Math.sin(t * Math.PI) * 30;
    LPK.px.rect(g, x - 1, b.y0 + (b.y1 - b.y0) * t - 1, 4, 1, "rgba(0,0,0,0.2)");
    LPK.px.rect(g, x - 2, y - 1, 5, 3, "#8a4a26"); LPK.px.rect(g, x - 1, y, 3, 1, "#f4f2ee");
  }
};
