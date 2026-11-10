// JOE PINO — Laura's dad, the quiet, confident patriarch. Some weekend
// mornings he comes over with Tim Shortons donuts, donut holes and bagels.
// Once Robert's home and Laura's in the kitchen, he makes his famous
// cappuccino, hands it to Robert... and says the quiet part out loud.
// Shares the kid engine for walking around (LPK.Evan), with his own brain.
window.LPK = window.LPK || {};

LPK.Joe = class Joe extends LPK.Evan {
  constructor(game) {
    super(game, "joe", "livingRoom.frontDoorIn");
    this.present = false; this.mode = "away"; this.state = "away";
  }
  get sitStates() { return ["sit"]; }
  headPos() { return { x: this.x, y: this.y - this.z - (this.isSitting ? 38 : 46) }; }
  sync() {
    this.stopMoving(); this.tasks = []; this.holding = null; this.sc = null;
    this.present = false; this.mode = "away"; this.state = "away"; this.lastDay = null;
    const G = this.game; G.joeTreats = false; G.stareOff = null;
    if (G.robert) { G.robert.fighting = false; }
  }

  think(dt = 1 / 60) {
    const G = this.game, c = G.clock, m = this.mins(), S = this.S, D = this.D;
    if (c.day !== this.lastDay) { this.lastDay = c.day; this.decided = false; this.sceneDone = false; this.donutTaken = false; }
    // ---- should he come over today?
    if (!this.present) {
      if (!this.decided && c.isWeekend && m >= this.at(S.arrive) && m < this.at(S.leave) - 60) {
        this.decided = true;
        const sv = LPK.save.data;
        if (!sv.joeSeen || Math.random() < S.visitChance) this.arrive();
      }
      return;
    }
    if (this.sc) return this.scene(dt);
    // ---- time to go home
    if (this.mode === "visit" && m >= this.at(S.leave) && !this.moving) {
      this.mode = "leaving"; this.holding = null;
      this.say(D.joeBye[0], 2.4);
      this.goTo("livingRoom.frontDoorIn", "walk", () => { this.present = false; this.mode = "away"; this.state = "away"; G.joeTreats = false; G.notify("Ciao!", "Joe Pino headed home."); });
      return;
    }
    if (this.mode !== "visit" || this.moving) return;
    // ---- the cappuccino scene: Robert home, Laura in the kitchen
    const R = G.robert, L = G.laura;
    this.visitT = (this.visitT || 0) + dt;
    if (!this.sceneDone && this.visitT > 8 && R.present && R.mode === "home" && !R.moving && G.room === "kitchen" && this.room === "kitchen"
        && !L.busy && !G.hungry && !LPK.catFight.active && !G.yard && !G.petting.active) return this.startScene();
    // ---- the boys say hi to Grandpa
    for (const k of [G.evan, G.owen]) {
      if (k && k.mode === "day" && k.room === this.room && k.distTo(this) < 50 && !k.bubble && !this.cooldown("hi-" + k.id)) {
        this.setCooldown("hi-" + k.id, 120);
        k.say(this.pick(D.kidGrandpa), 2); setTimeout(() => this.present && this.say(this.pick(D.joeBuddy), 1.8), 1600);
      }
    }
    // ---- quiet, sharp questions now and then
    if (this.sameRoomAsLaura() && this.distTo(L) < 70 && !this.cooldown("ask") && !this.bubble) {
      this.setCooldown("ask", 40); this.say(this.pick(D.joeAsk), 2.6);
    }
    if (this.holding === "cup" && !this.cooldown("yours") && this.sameRoomAsLaura()) { this.setCooldown("yours", 25); this.say(D.joeYours[0], 2); }
  }

  arrive() {
    const G = this.game;
    this.placeAt("livingRoom.frontDoorIn");
    this.present = true; this.mode = "arriving"; this.holding = "donuts";
    LPK.save.data.joeSeen = true; LPK.save.write();
    this.say(this.D.joeHello[0], 2.4);
    G.notify("Joe Pino is here!", "He brought Tim Shortons: donuts, donut holes and bagels!");
    for (const k of [G.evan, G.owen]) if (k && k.mode === "day" && k.room === "livingRoom") k.say("Grandpa! DONUTS!", 2);
    this.goTo("kitchen.joeSeat", "walk", () => { this.holding = null; G.joeTreats = true; this.mode = "visit"; this.visitT = 0; this.setState("sit", 999); });
  }

  // ------------------------------------------------ the cappuccino scene
  startScene() {
    const G = this.game, R = G.robert;
    this.sc = { step: "toCounter", t: 0 };
    this.say(this.D.joeCappuccinoTime[0], 2.4);
    R.fighting = true; R.stopMoving();
    R.goTo("kitchen.robertCup", "walk", () => { R.setState("stand", 999); R.flip = true; });
    this.goTo("kitchen.joeCounter", "walk", () => { this.sc.step = "brew"; this.sc.t = 0; this.holding = "pitcher"; this.setState("brew", 999); this.flip = false; });
  }
  scene(dt) {
    const G = this.game, R = G.robert, L = G.laura, D = this.D, sc = this.sc;
    sc.t += dt;
    const lauraHere = G.room === "kitchen";
    switch (sc.step) {
      case "toCounter": if (sc.t > 25) { this.placeAt("kitchen.joeCounter"); sc.step = "brew"; sc.t = 0; this.holding = "pitcher"; this.setState("brew", 999); } break;
      case "brew":                                          // steaming the milk
        if ((sc.puff = (sc.puff || 0) - dt) <= 0) { sc.puff = 0.9; LPK.audio.sfx.steam(); }
        if (sc.t > 6) {
          this.holding = "cup"; this.setState("stand", 999);
          G.cupView = { t: 0, total: 3.2, who: sc.second ? "Laura" : "Robert" };
          if (sc.second) { sc.step = "toSeat"; this.goTo("kitchen.joeSeat", "walk", () => { this.setState("sit", 999); this.sc = null; this.say(D.joeYours[0], 2.2); }); }
          else { sc.step = "toRobert"; sc.t = 0; }
        }
        break;
      case "toRobert":
        if (R.moving || sc.t < 0.6) { if (sc.t > 20) { R.stopMoving(); R.placeAt("kitchen.robertCup"); } break; }
        sc.step = "walking";
        this.goTo({ room: "kitchen", tx: Math.floor(R.x / 16) - 1, ty: Math.floor(R.y / 16) }, "walk", () => {
          this.flip = R.x < this.x; R.flip = this.x < R.x; this.setState("stand", 999);
          this.holding = null; R.cup = 90;                  // Robert's holding his cappuccino now
          sc.step = "lines"; sc.t = 0;
          this.say(D.joeAdopted[0], 4);
        });
        break;
      case "lines": {
        const beat = (at, fn) => { if (sc.t >= at && !sc[at]) { sc[at] = true; fn(); } };
        const faceJoe = () => { if (lauraHere) { L.dir = "side"; L.flip = this.x < L.x; } };
        beat(4.2, () => { faceJoe(); L.say(D.lauraWhat[0], 1.4); });
        beat(5.7, () => this.say(D.joeWhat[0], 1.4));
        beat(7.2, () => { faceJoe(); L.say(D.lauraWhat[1], 1.4); });
        beat(8.7, () => this.say(D.joeWhat[0], 1.4));
        beat(10.2, () => {                                   // ...the stare
          G.stareOff = { t: 0, a: L, b: this };
          if (lauraHere) { L.state = "stare"; faceJoe(); }
          this.flip = L.x < this.x;
          R.say(D.robertStare[0], 3.8);
          LPK.audio.sfx.tension();
        });
        if (G.stareOff) G.stareOff.t += dt;
        beat(14.2, () => {                                   // ...and it's gone
          G.stareOff = null; if (L.state === "stare") L.state = "idle";
          R.say(D.robertSip[0], 2.4); R.fighting = false; R.setState("stand", 4);
          this.sceneDone = true;
          if (lauraHere) LPK.events.emit("joeStare", {});
        });
        beat(16.5, () => {                                   // now Laura's cup
          sc.step = "toCounter2";
          this.goTo("kitchen.joeCounter", "walk", () => { sc.step = "brew"; sc.second = true; sc.t = 0; this.holding = "pitcher"; this.setState("brew", 999); this.flip = false; });
        });
        break;
      }
    }
  }
  // Laura takes her cappuccino from him
  giveLauraCup() {
    const G = this.game;
    this.holding = null;
    G.laura.say(this.D.lauraCappuccino[0], 2.6);
    this.say(this.D.joeWelcome[0], 2);
    G.progression.addPoints(10); G.notify("The best cappuccino on the planet", "+10 Kitty Happiness Points");
    LPK.audio.sfx.found();
    LPK.events.emit("joeCappuccino", {});
  }

  draw(g) {
    if (!this.present || this.state === "transit") return;
    const walking = this.state === "move", sit = this.isSitting;
    const shapes = LPK.sprites.joe(walking ? this.dir : "down", Math.floor(this.t * 5), { pose: sit ? "sit" : walking ? "walk" : "stand", hold: this.holding });
    if (this.z === 0) LPK.px.rect(g, this.x - 8, this.y - 1, 16, 2, "rgba(0,0,0,0.22)");
    LPK.px.draw(g, shapes, this.x, this.y - this.z, walking && this.dir === "side" && this.flip);
    if (this.state === "brew") for (let i = 0; i < 3; i++) {    // steam
      const p = (this.t * 0.9 + i / 3) % 1;
      g.globalAlpha = 0.8 * (1 - p);
      LPK.px.rect(g, this.x - 1 + Math.sin(p * 7 + i) * 3, this.y - 24 - p * 14, 2, 2, "#f4f4f4");
      g.globalAlpha = 1;
    }
  }
};
