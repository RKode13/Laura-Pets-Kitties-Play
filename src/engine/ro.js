// RO PINO — Joe's wife (Laura's mom; "Grandma" to the boys). She comes over
// with Joe, and the first thing she does is try to pet the kitties... and
// it's mayhem every time. The boys offer her a diet root beer; she's driving,
// and she doesn't want any booze before bowling.
window.LPK = window.LPK || {};

LPK.Ro = class Ro extends LPK.Evan {
  constructor(game) {
    super(game, "ro", "livingRoom.frontDoorIn");
    this.present = false; this.mode = "away"; this.state = "away"; this.outfitKey = "hoodie";
  }
  get sitStates() { return []; }
  headPos() { return { x: this.x, y: this.y - this.z - 34 }; }
  freeKid() { if (this.rb && this.rb.kid) { this.rb.kid.fighting = false; this.rb.kid.setState("stand", 1); } this.rb = null; }
  sync() {
    this.freeKid();
    this.stopMoving(); this.tasks = []; this.present = false; this.mode = "away"; this.state = "away"; this.rb = null; this.tryCat = null;
  }
  arrive() {
    const keys = Object.keys(this.def.outfits);
    this.outfitKey = keys[Math.floor(Math.random() * keys.length)];
    this.placeAt("livingRoom.frontDoorIn"); this.x += 14;
    this.present = true; this.mode = "visit"; this.setCooldown("pet", 6); this.setCooldown("rootbeer", 40);
    this.say(this.D.roHello[0], 2.4);
    this.setState("stand", 3);
  }
  leave() {
    if (!this.present || this.mode === "leaving") return;
    this.mode = "leaving"; this.freeKid(); this.tryCat = null; this.stopMoving();
    this.say(this.D.roBye[0], 2.4);
    this.goTo("livingRoom.frontDoorIn", "walk", () => { this.present = false; this.mode = "away"; this.state = "away"; });
  }

  think(dt = 1 / 60) {
    if (!this.present || this.mode !== "visit") return;
    const G = this.game, D = this.D;
    if (this.rb) return this.rootBeer(dt);
    if (this.state === "petTry") return this.petTry(dt);
    if (this.moving) return;
    // the boys say hi / offer Grandma a diet root beer
    for (const k of [G.evan, G.owen]) {
      if (!k || k.mode !== "day" || k.room !== this.room || k.distTo(this) > 70 || k.fighting || k.moving) continue;
      if (!this.cooldown("rootbeer") && !G.hungry && !(G.joe && G.joe.sc)) {
        this.setCooldown("rootbeer", 150 + Math.random() * 90);
        k.stopMoving(); k.tasks = []; k.holding = null; k.fighting = true; k.setState("stand", 99);
        k.flip = this.x < k.x; this.flip = k.x < this.x;
        this.rb = { kid: k, t: 0, step: 0 };
        k.say(D.kidRootBeer[0], 2.4);
        return;
      }
      if (!this.cooldown("hi-" + k.id) && !k.bubble) { this.setCooldown("hi-" + k.id, 150); k.say(D.kidGrandma[0], 1.8); }
    }
    // try to pet a kitty
    if (!this.cooldown("pet") && !LPK.catFight.active) {
      const calm = ["sit", "sleep", "box", "confused", "intrigued", "inspect", "window"];
      const cats = G.cats.filter(c => !c.concealed && !c.scripted && !c.fighting && !c.begging && !c.zoomies && c.z === 0 && calm.includes(c.state) && LPK.rooms[c.room]);
      const here = cats.filter(c => c.room === this.room);
      const c = (here.length ? here : cats)[Math.floor(Math.random() * (here.length || cats.length))];
      this.setCooldown("pet", 45 + Math.random() * 40);
      if (!c) return;
      this.tryCat = c;
      const side = this.x < c.x ? -1 : 1;
      this.goTo({ room: c.room, tx: Math.floor((c.x + side * 16) / 16), ty: Math.floor(c.y / 16) }, "walk", () => { this.setState("petTry", 99); this.pt = 0; this.flip = c.x < this.x; });
      return;
    }
    if (this.timer <= 0) {                                    // otherwise, hang out
      const spots = ["kitchen.roTable", "livingRoom.roCouch"];
      this.goTo(spots[Math.floor(Math.random() * spots.length)], "walk", () => this.setState("stand", this.rand(this.beh.activitySeconds)));
    }
  }

  // ---- "Here, kitty kitty!" ... mayhem
  petTry(dt) {
    const G = this.game, D = this.D, c = this.tryCat;
    this.pt += dt;
    if (!c || c.room !== this.room) { this.setState("stand", 2); this.tryCat = null; return; }
    if (this.pt < 0.05 && !this.said) { this.said = true; this.say(this.pick(D.roKitty), 1.6); }
    if (this.pt < 1.6) return;
    this.said = false; this.tryCat = null; this.setState("stand", 4);
    const cc = G.cat("cc"), pop = G.cat("popsicle");
    const boysHere = cc.room === this.room && pop.room === this.room && !cc.moving && !pop.moving && !cc.concealed && !pop.concealed;
    if (boysHere && Math.random() < 0.3) {
      // she startles one of the boys right into the other... and it's a wrestling match
      LPK.catFight.start(G);
      this.say(D.roOops[3], 2.2);
    } else if (c.id === "popsicle") {
      c.say("!!", 1); LPK.audio.sfx.startle();
      const far = c.def.restingSpots.filter(k => !k.startsWith(c.room + "."));
      c.goTo(far[Math.floor(Math.random() * far.length)] || c.def.restingSpots[0], "sprint", () => c.setState("sit", 4));
      setTimeout(() => this.present && this.say(D.roOops[0], 1.8), 500);
    } else if (c.id === "cc") {
      // Blacky zooms circles around her
      const pts = [];
      for (let i = 0; i <= 16; i++) { const a = i / 8 * Math.PI * 2, x = this.x + Math.cos(a) * 20, y = this.y + Math.sin(a) * 12; if (G.worlds[this.room].pointOpen(x, y)) pts.push({ x, y }); }
      c.stopMoving(); c.path = pts; c.tasks = [{ type: "call", fn: () => { c.setState("sit", 4); c.say("*smug*", 1.6); } }]; c.moveMode = "sprint"; c.state = "move";
      setTimeout(() => this.present && this.say(D.roOops[2], 1.8), 1200);
    } else {
      // Marshmallow: the Judgmental Stare, then she leaves
      c.startStare(this, () => c.travelTo(c.otherSpot(), true), "ro");
      setTimeout(() => this.present && this.say(D.roOops[1], 1.8), 4200);
    }
    if (this.sameRoomAsLaura()) LPK.events.emit("roMayhem", { cat: c.id });
  }

  // ---- the diet root beer
  rootBeer(dt) {
    const G = this.game, D = this.D, R = this.rb;
    R.t += dt;
    if (R.step === 0 && R.t > 2.6) { R.step = 1; this.say(D.roRootBeer[0], 4); }
    if (R.step === 1 && R.t > 6.8) {                          // Ro gets the last word
      R.kid.fighting = false; R.kid.setState("stand", 1); this.rb = null;
      if (this.sameRoomAsLaura()) LPK.events.emit("rootBeer", {});
    }
  }

  draw(g) {
    if (!this.present || this.state === "transit") return;
    const walking = this.state === "move";
    const shapes = LPK.sprites.laura(walking ? "walk" : "stand", walking ? this.dir : this.state === "petTry" ? "side" : "down", Math.floor(this.t * 6),
      { who: "ro", outfitDef: this.def.outfits[this.outfitKey] });
    if (this.z === 0) LPK.px.rect(g, this.x - 6, this.y - 1, 12, 2, "rgba(0,0,0,0.22)");
    LPK.px.draw(g, shapes, this.x, this.y - this.z, (walking && this.dir === "side" || this.state === "petTry") && this.flip);
  }
};
