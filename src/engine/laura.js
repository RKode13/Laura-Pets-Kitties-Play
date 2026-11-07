// Laura — the player character.
window.LPK = window.LPK || {};

LPK.Laura = class Laura {
  constructor(world, x, y) {
    this.world = world;
    this.x = x; this.y = y;
    this.dir = "down"; this.flip = false;
    this.state = "idle";          // idle | walk | run | kneel | reach | celebrate
    this.dist = 0; this.t = 0;
    this.speech = null;           // { text, t }
    this.blinkT = 2;
    this.patFrame = 0;
  }
  say(text, secs = 2.6) { this.speech = { text, t: secs }; }
  sayRandom(list, secs) { this.say(list[Math.floor(Math.random() * list.length)], secs); }

  get busy() { return ["kneel", "reach", "celebrate", "rest", "work"].includes(this.state); }
  get sortY() { return this.state === "rest" ? this.y + 14 : this.y; }

  update(dt, input) {
    this.t += dt;
    if (this.speech && (this.speech.t -= dt) <= 0) this.speech = null;
    this.blinkT -= dt; if (this.blinkT < -0.12) this.blinkT = 2 + Math.random() * 3;
    if (this.busy) return;

    const a = input.axis();
    const C = LPK.characters.laura;
    const running = (input.down("run") || a.strongStick) && (a.x || a.y);
    const sp = running ? C.runSpeed : C.walkSpeed;
    if (a.x || a.y) {
      const nx = this.x + a.x * sp * dt, ny = this.y + a.y * sp * dt;
      // feet collision box (axis by axis so Laura slides along furniture)
      if (this.world.boxFree(nx - 4, this.y - 3, 8, 4)) this.x = nx;
      if (this.world.boxFree(this.x - 4, ny - 3, 8, 4)) this.y = ny;
      if (Math.abs(a.x) > Math.abs(a.y)) { this.dir = "side"; this.flip = a.x < 0; }
      else this.dir = a.y < 0 ? "up" : "down";
      const before = Math.floor(this.dist / 8);
      this.dist += sp * dt;
      if (Math.floor(this.dist / 8) !== before && Math.floor(this.dist / 8) % 2 === 0) LPK.audio.sfx.step();
      this.state = running ? "run" : "walk";
    } else this.state = "idle";
  }

  // Point just in front of Laura (used to find what she's facing).
  interactPoint() {
    const d = this.dir === "side" ? (this.flip ? [-10, 0] : [10, 0]) : this.dir === "up" ? [0, -10] : [0, 8];
    return { x: this.x + d[0], y: this.y + d[1] };
  }

  draw(g) {
    if (this.state === "rest") { LPK.px.draw(g, LPK.sprites.laura("lie", "side", 0), this.x, this.y, false); return; }
    const pose = this.state === "kneel" ? "kneel" : this.state === "reach" ? "reach" : this.state === "celebrate" ? "celebrate"
      : this.state === "run" || this.state === "walk" ? "walk" : "stand";
    const frame = Math.floor(this.dist / (this.state === "run" ? 7 : 6));
    const dir = pose === "kneel" || pose === "reach" ? "side" : pose === "celebrate" ? "down" : this.state === "work" ? "up" : this.dir;
    const jump = pose === "celebrate" ? -Math.abs(Math.round(Math.sin(this.t * 8) * 3)) : 0;
    LPK.px.rect(g, this.x - 6, this.y - 1, 12, 2, "rgba(0,0,0,0.22)");
    LPK.px.draw(g, LPK.sprites.laura(pose, dir, frame, { pat: this.patFrame, blink: this.blinkT < 0 }), this.x, this.y + jump, dir === "side" && this.flip);
  }
};
