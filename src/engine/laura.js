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

  get busy() { return ["kneel", "reach", "celebrate", "rest", "work", "dance", "stare", "smooch", "whistle"].includes(this.state); }
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
    if (this.state === "whistle") {                         // strolling away, whistling
      LPK.px.rect(g, this.x - 6, this.y - 1, 12, 2, "rgba(0,0,0,0.22)");
      LPK.px.draw(g, LPK.sprites.laura("walk", "side", Math.floor(this.dist / 6)), this.x, this.y, this.flip);
      for (let i = 0; i < 2; i++) { const p = (this.t * 0.9 + i / 2) % 1, nx = this.x + (this.flip ? -6 : 6) + i * 4, ny = this.y - 30 - p * 14; g.globalAlpha = 1 - p; LPK.px.rect(g, nx, ny, 2, 2, "#ffd166"); LPK.px.rect(g, nx + 1, ny - 4, 1, 4, "#ffd166"); g.globalAlpha = 1; }
      return;
    }
    if (this.state === "smooch") {
      LPK.px.rect(g, this.x - 6, this.y - 1, 12, 2, "rgba(0,0,0,0.22)");
      LPK.px.draw(g, LPK.sprites.laura("smooch", "side", Math.floor(this.t * 4)), this.x, this.y, this.flip);
      return;
    }
    if (this.state === "dance") {
      LPK.px.rect(g, this.x - 6, this.y - 1, 12, 2, "rgba(0,0,0,0.22)");
      LPK.px.draw(g, LPK.sprites.laura("dance", "side", Math.floor(this.t * 6)), this.x, this.y, this.flip);
      for (let i = 0; i < 3; i++) {                         // little music notes
        const p = (this.t * 0.8 + i / 3) % 1, nx = this.x + (this.flip ? -8 : 8) + Math.sin(p * 6 + i) * 5 + (i - 1) * 6, ny = this.y - 26 - p * 18;
        const c = ["#ff7aa8", "#ffd166", "#7fd0ff"][i];
        g.globalAlpha = 1 - p;
        LPK.px.rect(g, nx, ny, 2, 2, c); LPK.px.rect(g, nx + 1, ny - 4, 1, 4, c); LPK.px.rect(g, nx + 2, ny - 4, 1, 1, c);
        g.globalAlpha = 1;
      }
      return;
    }
    const pose = this.state === "kneel" ? "kneel" : this.state === "reach" ? "reach" : this.state === "celebrate" ? "celebrate"
      : this.state === "run" || this.state === "walk" ? "walk" : "stand";
    const frame = Math.floor(this.dist / (this.state === "run" ? 7 : 6));
    const dir = pose === "kneel" || pose === "reach" ? "side" : pose === "celebrate" ? "down" : this.state === "work" ? "up" : this.dir;
    const jump = pose === "celebrate" ? -Math.abs(Math.round(Math.sin(this.t * 8) * 3)) : 0;
    LPK.px.rect(g, this.x - 6, this.y - 1, 12, 2, "rgba(0,0,0,0.22)");
    LPK.px.draw(g, LPK.sprites.laura(pose, dir, frame, { pat: this.patFrame, blink: this.blinkT < 0 }), this.x, this.y + jump, dir === "side" && this.flip);
  }
};
