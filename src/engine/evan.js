// EVAN — supporting character. A kid with a big gap-tooth grin who lives in
// the bottom-left room off the hallway. For now he has a simple routine from
// the game clock: hangs out in his room or on the living-room couch during
// the day, changes into pajamas and goes to bed at night.
window.LPK = window.LPK || {};

LPK.Evan = class Evan extends LPK.Cat {
  constructor(game) {
    super("evan", game, "evansRoom.evanPlay");
    this.present = true; this.mode = "day";
    this.lastX = this.x; this.lastY = this.y; this.dir = "down";
  }
  get pettable() { return []; }
  get available() { return false; }
  get sortY() { return this.y + (this.z > 0 ? 8 : 0); }
  headPos() { return { x: this.x, y: this.y - this.z - (this.state === "sleep" ? 14 : this.state === "sit" ? 26 : 34) }; }
  bedtime() {
    const m = this.game.clock.minutes, S = this.def.schedule, P = LPK.Clock.parse;
    return m >= P(S.bed) || m < P(S.wake);
  }
  outfit() {
    if (this.bedtime() || this.state === "sleep") return "pajamas";
    return this.game.clock.isWeekend ? "zip" : "sweater";
  }

  // Put him where he should be right now (new game, Continue, time skip)
  sync() {
    this.stopMoving(); this.tasks = [];
    if (this.bedtime()) { this.placeAt("evansRoom.evanSleep"); this.setState("sleep", 1e9); this.mode = "night"; return; }
    this.placeAt("evansRoom.evanPlay"); this.setState("stand", 4); this.mode = "day";
  }

  think() {
    const night = this.bedtime();
    if (night && this.mode !== "night") {
      this.mode = "night";
      this.say(this.pick(LPK.dialogue.evanBedtime), 2.2);
      this.goTo("evansRoom.evanSleep", "walk", () => this.setState("sleep", 1e9));
      return;
    }
    if (!night && this.mode === "night") {
      this.mode = "day";
      this.say(this.pick(LPK.dialogue.evanWake), 2.2);
      this.setState("stand", 2);
      return;
    }
    if (this.mode === "night") return;
    // say hi when Laura comes by
    const L = this.game.laura;
    if (this.sameRoomAsLaura() && this.distTo(L) < 40 && !this.cooldown("chat") && !this.bubble) {
      this.setCooldown("chat", 25);
      this.say(this.pick(LPK.dialogue.evanChat), 2.2);
    }
    if (this.timer <= 0 && !this.moving) this.activity();
  }

  activity() {
    const spots = ["evansRoom.evanPlay", "evansRoom.evanBedSit", "evansRoom.evanWindow", "livingRoom.couch", "evansRoom.evanPlay"];
    const key = spots[Math.floor(Math.random() * spots.length)], spot = LPK.getSpot(key);
    this.goTo(key, "walk", () => this.setState(spot.sit ? "sit" : "stand", this.rand(this.beh.activitySeconds)));
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
    const pose = lie ? "lie" : this.state === "sit" ? "sit" : walking ? "walk" : "stand";
    const shapes = LPK.sprites.evan(walking ? this.dir : "down", Math.floor(this.t * 6), { pose, outfit: this.outfit(), sleeping: this.state === "sleep" });
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
