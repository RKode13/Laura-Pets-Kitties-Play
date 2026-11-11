// The three personalities (spec sections 4-6 and 12). Each one decides
// what its cat does next; the shared engine in cat.js does the moving.
window.LPK = window.LPK || {};

const weighted = (choices) => {
  const total = Object.values(choices).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [k, w] of Object.entries(choices)) { if ((r -= w) <= 0) return k; }
  return Object.keys(choices)[0];
};
const D = () => LPK.dialogue;

// ===================================================================
//  MARSHMALLOW — the Grumpy Sleep Queen
// ===================================================================
LPK.Marshmallow = class Marshmallow extends LPK.Cat {
  constructor(game) {
    const spots = LPK.characters.marshmallow.restingSpots;
    super("marshmallow", game, spots[Math.floor(Math.random() * spots.length)]);
    this.state = "sleep"; this.timer = this.rand(this.beh.sleepBout);
  }
  get pettable() { return ["sleep", "sit", "grumble", "petted", "break"]; }
  get maxHappiness() { return 200; }
  get boys() { return this.game.cats.filter(c => c.id !== "marshmallow"); }

  settle() { this.setState("sleep", this.rand(this.beh.sleepBout)); }
  otherSpot() {
    const opts = this.def.restingSpots.filter(s => s !== this.spot.key);
    return opts[Math.floor(Math.random() * opts.length)];
  }
  travelTo(key, turbo) { this.goTo(key, turbo ? "turbo" : "walk", () => this.settle()); }
  onHopStart(to) { if (to.z > this.z + 4) this.say("hnngh...", 1.2); }

  think(dt = 1 / 60) {
    switch (this.state) {
      case "peek": {
        if ((this.peekTurn = (this.peekTurn || 0) - dt) <= 0) { this.peekTurn = 0.9; this.flip = !this.flip; }
        this.witness("marshPeek");
        if (this.timer <= 0) this.emergeFromBed();
        break;
      }
      case "sleep": case "sit": case "grumble":
        if (this.pendingRaid && this.state === "sit") { this.pendingRaid = false; this.keyboardRaid(); return; }
        if (this.happiness > 100.5 && !this.concealed && this.z === 0 && !this.scripted) { this.startZoomies(); return; }
        if (this.state === "sleep" && this.spot && this.spot.id === "underBigBed" && !this.concealed && this.sameRoomAsLaura()
            && this.distTo(this.game.laura) < 130 && !this.cooldown("peek")) { this.startPeek(); return; }
        if (this.checkCrunchies()) return;
        this.checkSpook();
        this.checkBoys();
        this.checkThrone();
        if (this.state === "grumble" && this.timer <= 0) this.settle();
        else if (this.state === "sleep" && this.timer <= 0) this.wakeDecide();
        else if (this.state === "sit" && this.timer <= 0) {
          if (Math.random() < this.beh.wanderChance * 4) this.travelTo(this.otherSpot(), false); else this.settle();
        }
        break;
      case "keyWalk": {
        // marching across Laura's keyboard
        this.x += 14 * dt; this.flip = false;
        const G = this.game; G.desk.screen = "nonsense"; G.desk.nonsenseT = 10;
        if ((this.clack = (this.clack || 0) - 1) <= 0) { this.clack = 8; LPK.audio.sfx.pat(Math.random() < 0.5 ? 0 : 1); }
        if (this.timer <= 0) this.afterKeyWalk();
        break;
      }
      case "sip": if (this.timer <= 0) this.travelTo("masterBedroom.bigBed", false); break;
      case "look":     if (this.timer <= 0) this.setState("turnCam", 0.35); break;
      case "turnCam":  if (this.timer <= 0) this.beginStare(); break;
      case "stare":    if (this.timer <= 0) { this.setState("turnAway", 0.6); this.flip = !this.flip; } break;
      case "turnAway": if (this.timer <= 0) { const f = this.afterStare; this.afterStare = null; f ? f() : this.settle(); } break;
      default: if (this.timer <= 0) this.settle();
    }
  }

  wakeDecide() {
    if (this.concealed) { this.timer = 9999; return; }
    if (this.spot && this.spot.id === "underBigBed" && !this.cooldown("peek")) { this.startPeek(); return; }
    if (Math.random() < this.beh.keepSleepingChance) { this.timer = this.rand(this.beh.sleepBout); return; }
    if (Math.random() < this.beh.wanderChance) { this.travelTo(this.otherSpot(), false); return; }
    this.setState("sit", 5 + Math.random() * 6);
  }

  // Crunchies in her bowl? Even the Sleep Queen gets moving (Turbo Tiny Paws!)
  checkCrunchies() {
    const b = this.game.bowls.herBowl;
    if (this.concealed || !b || b.food !== "crunchies" || b.eater || this.cooldown("sulk")) return false;
    this.say("!", 1);
    this.goTo("kitchen.atHerBowl", "turbo", () => { this.flip = true; this.eatDisturbed = false; this.startEating("herBowl", this.beh.eatSeconds); this.say(this.pick(D().marshmallowCrunchies), 2); });
    return true;
  }
  onDoneEating(bowl) {
    if (!bowl) { this.setState("sit", 6); return; }          // hand-fed treat: she stays put
    if (bowl === "herBowl" && !this.eatDisturbed) LPK.events.emit("ateInPeace", { cat: this.id });
    this.happiness = Math.max(this.happiness, Math.min(100, this.happiness + 15));
    this.travelTo(this.otherSpot(), false);
  }
  // One of the boys got to her food
  onFoodStolen(thief) {
    this.eatDisturbed = true;
    this.stopEating();
    this.setCooldown("sulk", 6);
    this.startStare(thief, () => this.goTo("kitchen.kitchenMat", "walk", () => this.settle()));
  }

  // ---- Overcharged zoomies ----
  // Every bit of Purr Meter over 100% becomes zoomies: the more overcharged,
  // the more dashes and the faster she goes. Each dash zigzags across the
  // room, then she hunkers down staring up at Laura with darting eyes, then
  // takes off again. When it's all burned off, she's back to exactly 100%.
  startZoomies() {
    const over = Math.min(100, this.happiness - 100);
    const dashes = Math.max(1, Math.min(6, Math.ceil(over / 17)));
    const per = over / dashes;
    this.beginZoomies({
      dashes, speed: 45 + over * 0.75,                       // tops out at 120 — she's never this fast otherwise
      onDash: () => { this.happiness = Math.max(100, this.happiness - per); },
      onDone: () => { this.happiness = 100; this.say(this.pick(D().marshmallowAfterZoomies), 2.2); this.setState("sit", 4 + Math.random() * 3); },
    });
    this.witness("marshZoomies", { dashes }, false);
  }

  // Running near her wakes her up grumpy. Do it enough and you get The Stare.
  checkSpook() {
    const L = this.game.laura;
    if (!this.sameRoomAsLaura() || L.state !== "run" || this.cooldown("spook")) return;
    if (this.distTo(L) > this.beh.spookRadius) return;
    this.setCooldown("spook", 3);
    this.annoyance += 1;
    LPK.audio.sfx.meowGrumpy();
    L.sayRandom(D().lauraWhileRunningNear, 1.8);
    if (this.annoyance >= this.beh.annoyanceToStare) {
      this.annoyance = 0;
      this.startStare(L, () => this.travelTo(this.otherSpot(), true));
    } else {
      this.setState("grumble", 2.4);
      this.flip = L.x < this.x;
      this.say(this.pick(D().marshmallowGrumpy), 2);
    }
  }

  // From the top of the dresser: condescending looks at Laura
  checkThrone() {
    const L = this.game.laura;
    if (!this.spot || this.spot.id !== "dresserTop" || this.z === 0 || !this.sameRoomAsLaura() || this.cooldown("throne")) return;
    if (this.distTo(L) > 100 || Math.random() > 0.02) return;
    this.setCooldown("throne", 45);
    this.startStare(L, () => this.settle(), "throne");
  }

  // Under the big bed: peek out (looking left... right...), then pop out
  startPeek() {
    const T = this.T;
    this.setCooldown("peek", 60);
    this.x = 10.5 * T; this.y = 164; this.z = 0;
    this.peekClip = [this.x - 12, 144, 24, 13];         // only her face pokes out from under the bed's edge
    this.setState("peek", 4.5);
    this.say(this.pick(D().marshPeek), 1.5);
  }
  emergeFromBed() {
    this.peekClip = null;
    const bed = LPK.getSpot("masterBedroom.bigBed");
    this.tasks = [
      { type: "hop", to: { x: bed.x * this.T, y: bed.y * this.T, z: bed.z }, spot: bed },
      { type: "wait", state: "sit", secs: 2.5 },
      { type: "call", fn: () => { this.spot = bed; this.tasks = []; this.waiting = false; this.state = "sit"; this.timer = 0; this.pendingRaid = true; } },
    ];
    this.nextTask();
  }

  // Laura's working... the perfect time to walk across her keyboard
  keyboardRaid() {
    const G = this.game;
    this.stopMoving();
    this.onAMission = true;                       // the keyboard is worth hurrying for
    this.goTo("masterBedroom.deskTop", "turbo", () => {
      this.onAMission = false;
      this.setState("keyWalk", 2.6);
      if (G.laura.state === "work") G.laura.sayRandom(D().lauraKeyboard, 2.4);
      else if (this.sameRoomAsLaura()) G.laura.sayRandom(D().lauraKeyboardSolo, 2.4);
      LPK.events.emit("keyboardCat", {});
    });
  }
  speedFor(mode) { return this.onAMission ? 34 : super.speedFor(mode); }
  afterKeyWalk() {
    const G = this.game, r = Math.random();
    if (G.desk.session) G.desk.session.waitCat = false;
    if (r < 0.4 && G.desk.coffee === "full") {
      this.flip = true; this.setState("sip", 1.8); this.say("*sip*", 1.6); G.desk.coffee = "sipped";
      G.laura.sayRandom(D().lauraCoffeeSip, 2.4); LPK.events.emit("coffeeCat", { how: "sip" });
    } else if (r < 0.7 && G.desk.coffee !== "spilled") {
      this.say("*bonk*", 1.2); G.desk.coffee = "spilled"; LPK.audio.sfx.startle();
      G.laura.sayRandom(D().lauraCoffeeSpill, 2.4); LPK.events.emit("coffeeCat", { how: "spill" });
      this.travelTo("masterBedroom.bigBed", false);
    } else this.travelTo("masterBedroom.bigBed", false);
  }

  // The boys come too close -> occasional Judgmental Camera Stare
  checkBoys() {
    if (this.cooldown("boys") || !this.sameRoomAsLaura() || this.concealed) return;
    const boy = this.boys.find(b => b.room === this.room && !b.concealed && b.state !== "transit" && b.distTo(this) < this.beh.boysStareRadius);
    if (!boy) return;
    this.setCooldown("boys", this.beh.boysStareCooldown);
    if (!this.game.flags.forceStare && Math.random() > this.beh.boysStareChance) { this.say(this.pick(D().marshmallowGrumpy), 1.6); return; }
    this.startStare(boy, () => this.settle());
  }

  // ---- The Judgmental Camera Stare (spec section 4) ----
  startStare(offender, after, source) {
    this.stopMoving();
    this.setState("look", 0.9);
    this.flip = offender.x < this.x;
    this.stareSource = source || (offender === this.game.laura ? "laura" : "boys");
    this.afterStare = after;
  }
  beginStare() {
    this.setState("stare", 3.0);
    const lines = this.stareSource === "boys" ? D().marshmallowStareBoys : this.stareSource === "clown" ? D().marshmallowStareClown
      : this.stareSource === "throne" ? D().marshmallowStareThrone : this.stareSource === "ro" ? D().marshmallowStareRo : D().marshmallowStareLaura;
    this.say(LPK.save.data.settings.familyFriendly ? lines.family : lines.normal, 3.0, "thought");
    LPK.audio.sfx.stare();
    if (this.sameRoomAsLaura()) LPK.events.emit("catStare", { cat: this.id, source: this.stareSource });
  }

  onFoodRefused() { this.say(this.pick(D().marshmallowRefuse), 2); this.game.laura.sayRandom(D().lauraFoodRefused, 2.4); }
  onPetEnd() { if (this.lyingWhilePetted) this.settle(); else this.setState("sit", 3 + Math.random() * 3); }
  happyLine() { return this.pick(D().marshmallowHappy); }

  // Level 2: tucked away out of sight in a hiding spot
  hideAt(key) { this.placeAt(key); this.concealed = true; this.found = false; this.setState("sleep", 9999); }
  reveal() {
    this.concealed = false; this.found = true;
    // she pops out of hiding (grumpily) where Laura can reach her
    const T = this.T;
    this.startHop({ x: this.spot.approach[0] * T + 8, y: this.spot.approach[1] * T + 12, z: 0 });
    this.tasks = [{ type: "call", fn: () => this.setState("sit", 25) }];
    this.say(this.pick(LPK.dialogue.marshmallowGrumpy), 1.6);
  }

  poseFor() {
    const t = this.t;
    switch (this.state) {
      case "petted": return this.lyingWhilePetted ? { pose: "sleep", frame: Math.floor(t / 1.4) } : { pose: "stand", eyes: "happy", sway: this.patWiggle ? 1 : -1 };
      case "grumble": case "look": case "turnAway": return { pose: "sit", eyes: "annoyed" };
      case "keyWalk": return { pose: "walk", frame: Math.floor(t * 6) };
      case "peek": return { pose: "front", eyes: "open" };
      case "sip": return { pose: "eat", frame: Math.floor(t * 4), eyes: "closed" };
      case "turnCam": return { pose: "front", eyes: "annoyed" };
      case "stare": return { pose: "front", eyes: "stare" };
      default: return super.poseFor();
    }
  }
};

// ===================================================================
//  COOKIES AND CREAM (CC) — the GQ Boss
// ===================================================================
LPK.CC = class CC extends LPK.Cat {
  constructor(game) { super("cc", game, "kitchen.catTowerTop"); this.setState("sit", 6); }
  get pettable() { return ["sit", "sleep", "petted", "meow", "springGuard"]; }
  get robert() { return this.game.robert; }
  faceOpts() { return { shades: !!LPK.save.data.ccShades }; }

  think(dt) {
    const G = this.game;
    if (LPK.olympicsCCThink(this)) return;
    if (this.thinkWindow()) return;
    if (G.flags.zoomies) return this.zoom();
    if (this.state === "springGuard") return this.guardSpring();
    if (this.state === "bellyUp") { if (this.timer <= 0) this.setState("sit", 3); return; }
    if (this.state === "bellyRub" || this.state === "pounce") { if (this.timer <= 0) this.setState("sit", 4); return; }
    if (this.state === "intrigued") {
      if (this.timer < 1.6 && !this.tilted) { this.tilted = true; this.flip = !this.flip; }
      const R = this.robert;
      if (R && R.state === "sleep" && R.room === G.room && this.sameRoomAsLaura()) this.witness("tinySnore");
      if (this.timer <= 0) this.setState("sit", 0.5);
      return;
    }
    if (this.followRobert()) return;
    if (this.checkSpringSecurity()) return;
    if (this.checkFood()) return;
    if (this.state === "inspect" || this.state === "meow" || this.state === "springPlay") { if (this.timer <= 0) this.setState("sit", 0.5); return; }
    if (this.state === "sleep" && this.timer > 0) return;
    if (this.state === "sit" && this.timer > 0) {
      if (this.settled && this.timer < this.settleSleepAt) { this.setState("sleep", this.timer); }
      return;
    }
    // a settled, happy CC sometimes offers the Royal Belly Rub
    if (this.settled && this.state === "sit" && this.happiness >= (G.flags.bellyBoost ? 30 : 45) && this.sameRoomAsLaura() && this.distTo(G.laura) < 130 && !this.cooldown("belly") && Math.random() < (G.flags.bellyBoost ? 0.8 : this.beh.bellyUpChance)) {
      this.setCooldown("belly", 40);
      this.setState("bellyUp", 7); this.say(this.pick(D().ccBellyUp), 2);
      return;
    }
    this.settled = false;
    const B = this.beh, night = G.clock.phase === "night", choice = weighted(night ? B.nightChoices : B.choices);
    const rooms = Object.keys(this.game.worlds).filter(r => LPK.rooms[r].catsAllowed !== false);
    const poi = (room) => { const p = LPK.rooms[room].pointsOfInterest; const [tx, ty] = p[Math.floor(Math.random() * p.length)]; return { room, tx, ty }; };
    if (choice === "patrol") {
      this.goTo(poi(this.room), Math.random() < 0.5 ? "run" : "walk", () => this.inspect());
    } else if (choice === "gqDash") {
      const other = rooms.filter(r => r !== this.room);
      this.goTo(poi(other.length ? other[Math.floor(Math.random() * other.length)] : this.room), "sprint", () => this.inspect());
    } else if (choice === "settle") {
      const spot = this.def.restingSpots[Math.floor(Math.random() * this.def.restingSpots.length)];
      this.goTo(spot, Math.random() < 0.4 ? "sprint" : "run", () => {
        this.settled = true; const secs = this.rand(B.settleSeconds);
        this.setState("sit", secs); this.settleSleepAt = secs * (Math.random() < 0.5 ? 0.6 : -1);
      });
    } else if (choice === "playSpring") {
      const toys = G.toys.filter(t => !t.held);
      const toy = toys.find(t => t.favorite) && Math.random() < 0.5 ? toys.find(t => t.favorite) : toys[Math.floor(Math.random() * toys.length)];
      if (!toy) { this.setState("sit", 2); return; }
      this.goTo({ room: toy.room, tx: Math.floor(toy.x / this.T), ty: Math.floor(toy.y / this.T) }, "run", () => {
        this.flip = toy.x < this.x; this.setState("springPlay", 4); toy.bounce = 4; LPK.audio.sfx.boing();
      });
    } else if (choice === "windowWatch") {
      if (!this.windowWatch()) this.setState("sit", 2);
    } else if (choice === "checkRobert") {
      const R = this.robert;
      if (!R || !R.present || R.state !== "sleep") { this.setState("sit", 2); return; }
      this.goTo({ room: R.room, tx: Math.floor(R.x / this.T) - 1, ty: Math.floor(R.y / this.T) + 1 }, "walk", () => {
        this.tilted = false; this.flip = false; this.setState("intrigued", 3.2); this.say(this.pick(D().ccIntrigued), 3, "thought");
      });
    } else if (choice === "bossWalk") {
      this.say("*the Boss Walk*", 2);
      this.goTo(poi(this.room), "boss", () => this.inspect());
    } else {
      this.setState("meow", 2.2);
      this.say(D().ccAngelic[0], 2.2);
      LPK.audio.sfx.angelic();
      this.witness("angelicMeow");
    }
  }
  inspect() {
    this.setState("inspect", this.rand(this.beh.inspectSeconds)); if (Math.random() < 0.4) this.say(this.pick(D().ccInspect), 1.4);
    if (this.z > 40) this.witness("ccHigh");
  }

  // ---- Follow the Legend: CC follows Robert whenever he's around ----
  followRobert() {
    const R = this.robert, G = this.game;
    if (!R || !R.present || R.state === "sleep" || R.mode === "away" || R.mode === "dinner") { this.wasRobert = false; return false; }
    if (!this.wasRobert) {                       // Robert just woke up / came home: CC comes running
      this.wasRobert = true;
      this.followUntil = this.t + 70;
      this.say(D().ccRobert[0], 1.2);
      if (this.state === "sleep") this.setState("sit", 0);
    }
    if (!(this.followUntil > this.t)) {
      // between follow sessions he does his own thing, then rejoins Robert now and then
      if (this.cooldown("followPause") || this.state === "sleep" || Math.random() > 0.004) return false;
      this.followUntil = this.t + 40 + Math.random() * 40;
    }
    if (this.followUntil - this.t < 0.5) { this.setCooldown("followPause", 90); this.followUntil = 0; return false; }
    if (this.cooldown("followTick")) return this.state === "sit";
    this.setCooldown("followTick", 0.8);
    const d = R.room === this.room ? this.distTo(R) : 999;
    if (d > 26) {
      const T = this.T, back = R.dir === "side" ? (R.flip ? 1 : -1) : 0;
      const tx = Math.floor(R.x / T) + back, ty = Math.floor(R.y / T) + (R.dir === "side" ? 0 : 1);
      const walkable = G.worlds[R.room].walkable(tx, ty);
      this.goTo({ room: R.room, tx: walkable ? tx : Math.floor(R.x / T), ty: walkable ? ty : Math.floor(R.y / T) + 1 }, d > 90 ? "run" : "walk", () => this.setState("sit", 1));
      if (R.state === "move" && this.room === G.room && d < 90) {
        this.witness("likeFatherGQ", {}, false);
        if (!G.clock.isWeekend && G.clock.hour < 6) this.witness("cc445", {}, false);
      }
    } else if (this.state !== "sit") this.setState("sit", 3);
    return true;
  }

  // ---- Spring Security: he guards his favorite spring ----
  checkSpringSecurity() {
    const G = this.game, L = G.laura, fav = G.toys.find(t => t.favorite);
    if (!fav || fav.held || fav.room !== this.room || G.room !== this.room || this.cooldown("springGuard")) return false;
    if (Math.hypot(L.x - fav.x, L.y - fav.y) > 40 || this.distTo(fav) > 170) return false;
    this.setCooldown("springGuard", 20);
    this.goTo({ room: fav.room, tx: Math.floor(fav.x / this.T), ty: Math.floor(fav.y / this.T) }, "sprint", () => {
      this.x = fav.x; this.y = fav.y + 2;
      this.setState("springGuard", 9); this.say(this.pick(D().ccSpringGuard), 2);
    });
    return true;
  }
  guardSpring() {
    const L = this.game.laura;
    if (L.state === "run" && this.distTo(L) < 40 && !this.cooldown("huff")) { this.setCooldown("huff", 3); this.say(this.pick(D().ccSpringUpset), 1.5); this.flip = L.x < this.x; }
    if (this.timer <= 0) this.setState("sit", 2);
  }
  // Laura tossed the spring: chase and pounce!
  chaseSpring(toy) {
    if (["petted", "eat", "bellyRub"].includes(this.state) || this.room !== toy.room) return;
    this.stopMoving();
    const lx = toy.landX ?? toy.x, ly = toy.landY ?? toy.y;       // where a bouncing spring will end up
    this.goTo({ room: toy.room, tx: Math.floor(lx / this.T), ty: Math.floor(ly / this.T) }, "sprint", () => {
      this.flip = toy.x < this.x; this.setState("pounce", 0.7); toy.bounce = 6; LPK.audio.sfx.boing();
      this.game.petting.addRaw(this, 8);
      LPK.events.emit("springToss", { cat: this.id });
      this.game.springTosses = (this.game.springTosses || 0) + 1;
      if (this.game.springTosses % 3 === 0) LPK.events.emit("springGame", {});
    });
  }

  // ---- Midnight Zoomies ----
  zoom() {
    if (this.timer > 0 && this.state === "sit") return;
    const rooms = Object.keys(this.game.worlds).filter(r => LPK.rooms[r].catsAllowed !== false), room = Math.random() < 0.6 ? this.room : rooms[Math.floor(Math.random() * rooms.length)];
    const p = LPK.rooms[room].pointsOfInterest, [tx, ty] = p[Math.floor(Math.random() * p.length)];
    if (Math.random() < 0.25) this.say(this.pick(D().ccZoom), 1);
    this.goTo({ room, tx, ty }, "sprint", () => this.setState("sit", 1.1));
  }

  // Food: he's interested, but not desperate (food motivation 6/10)
  checkFood() {
    if (this.cooldown("food") || this.cooldown("shooed") || this.state === "sleep") return false;
    const g = this.game, boys = g.bowls.boysBowls, hers = g.bowls.herBowl;
    let target = null;
    if (boys && boys.food && !boys.eater) target = "boysBowls";
    else if (g.flags.boysGreedy && hers && hers.food) target = "herBowl";
    if (!target) return false;
    this.setCooldown("food", 4);
    if (!g.flags.boysGreedy && Math.random() > this.beh.foodResponseChance) { this.setCooldown("food", 15); return false; }
    this.goTo(target === "boysBowls" ? "kitchen.byBoysBowls" : "kitchen.atHerBowl", "boss", () => this.arriveAtBowl(target));
    return true;
  }
  arriveAtBowl(id) { arriveAtBowl(this, id); }
  onDoneEating() { this.setState("sit", 3); }
  onPetEnd() { this.settled = true; this.setState("sit", 8); }
  onBored() { this.say(this.pick(D().ccBored), 2); this.setState("sit", 0); this.settled = false; }
  onFoodRefused() { this.say("*sniff*", 1.5); }
  happyLine() { return this.pick(D().ccHappy); }
  poseFor() {
    const t = this.t;
    if (this.state === "inspect") return { pose: "stand", eyes: "open", sway: Math.floor(t * 4) % 2 };
    if (this.state === "meow") return { pose: "sit", eyes: "closed" };
    if (this.state === "bellyUp") return { pose: "bellyUp", frame: Math.floor(t * 3), eyes: "open" };
    if (this.state === "bellyRub") return { pose: "bellyUp", frame: Math.floor(t * 6), eyes: "happy" };
    if (this.state === "springGuard") return { pose: "sit", eyes: "annoyed" };
    if (this.state === "springPlay") return { pose: "stand", eyes: "open", jump: Math.abs(Math.round(Math.sin(t * 9) * 4)) };
    if (this.state === "pounce") return { pose: "stand", eyes: "happy", jump: Math.round(Math.sin(Math.min(1, (0.7 - this.timer) / 0.7) * Math.PI) * 8) };
    if (this.state === "intrigued") return { pose: "sit", eyes: "open" };
    return super.poseFor();
  }
};

// ===================================================================
//  POPSICLE (Orangey) — the One-Brain-Cell Food Bandit
// ===================================================================
LPK.Popsicle = class Popsicle extends LPK.Cat {
  constructor(game) { super("popsicle", game, "livingRoom.sectionalEnd"); this.setState("sleep", 15); }
  get pettable() { return ["sit", "sleep", "petted", "confused", "beg", "box", "yawn", "headSleep"]; }

  // Sleepy Orangey (mandatory, spec 6): tired by time of day, gradually
  get tired() {
    const h = this.game.clock.hour, td = this.def.tiredness, lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
    if (h < 5) return td.night;
    if (h < 12) return lerp(td.night * 0.3, td.morning, (h - 5) / 2);
    if (h < 17) return lerp(td.morning, td.afternoon, (h - 12) / 5);
    if (h < 21) return lerp(td.afternoon, td.evening, (h - 17) / 4);
    return lerp(td.evening, td.night, (h - 21) / 3);
  }
  faceOpts() { const t = this.tired; return { droopy: t > 0.5 && this.state !== "sleep", bags: t > 0.45 }; }
  speedFor(mode) { return super.speedFor(mode) * (1 - 0.45 * this.tired); }

  // Failed Athletic Hero: jumps onto furniture sometimes go... less than perfectly
  beforeHop(task) {
    const to = task.to;
    if (this.scripted || this.inFail || to.z <= this.z + 6 || Math.random() > this.def.clumsyChance) return false;
    this.inFail = true;
    const from = { x: this.x, y: this.y, z: this.z };
    this.tasks.unshift(
      { type: "wait", state: "prep", secs: 0.9 },
      { type: "hopRaw", to: { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2, z: to.z * 0.6 } },
      { type: "hopRaw", to: from, after: () => { this.say(this.pick(D().popFail), 2); this.witness("clumsyJump", {}, false); LPK.audio.sfx.startle(); } },
      { type: "wait", state: "sit", secs: 1.2 },
      { type: "hop", to, spot: task.spot },
      { type: "call", fn: () => { this.inFail = false; } },
    );
    this.nextTask();
    return true;
  }
  beforeHopReset() { this.inFail = false; }

  onPurrFull() {
    if (this.tired < 0.6) return false;
    this.game.petting.stop("asleep");
    this.setState("sleep", 60); this.say(this.pick(D().popSleepy), 2);
    LPK.events.emit("sleepyBoy", {});
    return true;
  }

  // Laura's Head Is My Bed
  checkPillow() {
    const G = this.game, L = G.laura;
    if (this.state === "headSleep") {
      if (L.state !== "rest") { this.z = 0; this.x = L.x + 10; this.y = L.y + 4; this.setState("sleep", 20); }
      return true;
    }
    if (L.state !== "rest" || this.tired < 0.6 || this.cooldown("pillow")) return false;
    this.setCooldown("pillow", 25);
    const T = this.T;
    this.goTo({ room: G.room, tx: Math.floor(L.x / T), ty: Math.floor(L.y / T) + 1 }, "walk", () => {
      this.tasks = [
        { type: "hopRaw", to: { x: L.x - 13, y: L.y + 9, z: 17 } },
        { type: "call", fn: () => { this.setState("headSleep", 1e9); LPK.events.emit("humanPillow", {}); L.sayRandom(D().lauraPillow, 3); } },
      ];
    });
    return true;
  }

  think(dt) {
    if (this.scripted) return;                   // Kitty Olympics: the course is in charge
    if (this.thinkWindow()) return;
    if (this.checkSpook()) return;
    if (this.checkPillow()) return;
    if (this.game.flags.zoomies) return this.chaseCC();
    if (this.checkFoodRadar()) return;
    const B = this.beh, L = this.game.laura, tired = this.tired;
    if (this.state === "yawn") { if (this.timer <= 0) this.setState("sit", 1.5); return; }
    if ((this.state === "sit" || this.state === "confused") && tired > 0.2 && Math.random() < dt * (0.03 + 0.08 * tired)) {
      this.setState("yawn", 1.4); this.say(this.pick(D().popYawn), 1.4); return;
    }
    switch (this.state) {
      case "beg":
        if (!this.game.holding || this.room !== this.game.room) { this.setState("sit", 2); return; }
        if (this.distTo(L) > 34 && this.cooldown("begMove") === false) {
          this.setCooldown("begMove", 1.5);
          const T = this.T;
          this.goTo({ room: this.room, tx: Math.floor(L.x / T), ty: Math.floor(L.y / T) }, "run", () => this.setState("beg", 30));
          return;
        }
        if (!this.bubble) this.say(this.pick(D().popHungry), 1.4);
        return;
      case "trash":
        this.game.trashOpen = true;
        if (Math.random() < 0.02) this.say(this.pick(D().popTrash), 1.2);
        this.witness("trashSpotted");
        if (this.timer <= 0) { this.game.trashOpen = false; this.setState("sit", 2); }
        return;
      case "sinkEat":                                          // on the counter, eating out of the sink
        if (!this.bubble && Math.random() < 0.05) this.say(this.pick(D().popSink), 1.4);
        this.witness("popSink");
        if (this.timer <= 0) { this.goTo(this.def.restingSpots[0], "walk", () => this.setState("sit", 3)); }
        return;
      case "box":
        if (Math.random() < 0.03) this.say(this.pick(D().popChomp), 1.2);
        // chomp chomp... flicking little pieces of cardboard everywhere
        if ((this.flickT = (this.flickT || 0) - (dt || 1 / 60)) <= 0) { this.flickT = 0.2 + Math.random() * 0.4; this.game.flickCardboard(this); }
        this.witness("boxChompSpotted");
        if (this.timer <= 0) { this.say(this.pick(D().popWander), 2); this.setState("sit", 1); }
        return;
      case "confused":
        if (this.timer < 2.2 && !this.turned1) { this.turned1 = true; this.flip = !this.flip; }
        if (this.timer < 1.0 && !this.turned2) { this.turned2 = true; this.flip = !this.flip; }
        this.witness("confusedStare");
        if (this.timer <= 0) { this.say(this.pick(D().popWander), 2); this.setState("sit", 0.5); }
        return;
    }
    if (this.timer > 0) return;
    const ch = Object.assign({}, B.choices);
    ch.nap *= 1 + 3 * tired; ch.seekLaura *= 1 + 2 * tired;
    ch.trash *= 1 - 0.7 * tired; ch.wander *= 1 - 0.7 * tired; ch.boxChomp *= 1 - 0.6 * tired;
    const choice = weighted(ch);
    const rooms = Object.keys(this.game.worlds).filter(r => LPK.rooms[r].catsAllowed !== false);
    if (choice === "wander") {
      const room = rooms[Math.floor(Math.random() * rooms.length)], p = LPK.rooms[room].pointsOfInterest;
      const [tx, ty] = p[Math.floor(Math.random() * p.length)];
      this.goTo({ room, tx, ty }, "run", () => this.setState("sit", 2 + Math.random() * 3));
    } else if (choice === "trash") this.goRaidTrash(this.rand(B.trashSeconds));
    else if (choice === "windowWatch") { if (!this.windowWatch()) this.setState("sit", 2); }
    else if (choice === "boxChomp") {
      this.goTo("kitchen.inBox", "run", () => { this.flip = false; this.setState("box", this.rand(B.boxSeconds)); });
    } else if (choice === "confusedStare") {
      this.turned1 = this.turned2 = false;
      this.setState("confused", 3.5); this.say(this.pick(D().popConfused), 3.5, "thought");
    } else if (choice === "nap") {
      const spot = this.def.restingSpots[Math.floor(Math.random() * this.def.restingSpots.length)];
      this.goTo(spot, "walk", () => this.setState("sleep", this.rand(B.napSeconds)));
    } else {
      // seek Laura — he's very affectionate with her (but cats stay out of the garage)
      const T = this.T;
      if (LPK.rooms[this.game.room].catsAllowed === false) { this.setState("sit", 4); return; }
      this.goTo({ room: this.game.room, tx: Math.floor(L.x / T) + (Math.random() < 0.5 ? -1 : 1), ty: Math.floor(L.y / T) }, "run", () => { this.say(this.pick(D().popHappy), 1.5); this.setState("sit", 10); });
    }
  }

  // Trying (and failing) to keep up with CC's zoomies
  chaseCC() {
    if (this.state === "sit" && this.timer > 0) return;
    const cc = this.game.cat("cc"), T = this.T;
    this.goTo({ room: cc.room, tx: Math.floor(cc.x / T), ty: Math.floor(cc.y / T) }, "run", () => {
      this.setState("sit", 0.8); if (Math.random() < 0.3) this.say(this.pick(D().popConfused), 1, "thought");
    });
  }

  goRaidTrash(secs) {
    this.goTo("kitchen.atTrash", "run", () => { this.flip = false; this.setState("trash", secs); this.say(this.pick(D().popTrash), 1.5); });
  }

  // Very skittish: Laura running nearby sends him flying
  checkSpook() {
    const L = this.game.laura;
    if (!this.sameRoomAsLaura() || L.state !== "run" || this.cooldown("spook") || this.state === "eat" || this.forcedTrash) return false;
    if (this.distTo(L) > this.beh.spookRadius) return false;
    this.setCooldown("spook", 4);
    this.say(this.pick(D().popStartled), 1.2);
    LPK.audio.sfx.startle();
    this.startle(L.x);
    return true;
  }
  afterStartle() {
    const spot = this.def.restingSpots[Math.floor(Math.random() * this.def.restingSpots.length)];
    this.goTo(spot, "run", () => this.setState("sit", 4));
  }

  // Food Radar: notices food from much farther away and drops EVERYTHING
  checkFoodRadar() {
    if (this.cooldown("shooed") || this.cooldown("food") || this.forcedTrash) return false;
    const g = this.game, boys = g.bowls.boysBowls, hers = g.bowls.herBowl;
    let target = null;
    if (boys && boys.food && !boys.eater) target = "boysBowls";
    else if (hers && hers.food && (g.flags.boysGreedy || !hers.eater) && !(boys && boys.eater === this)) target = "herBowl";
    if (target) {
      this.setCooldown("food", 3);
      if (this.state === "sleep") this.say("!!", 1); else this.say(this.pick(D().popHungry), 1.2);
      this.game.trashOpen = false;
      this.goTo(target === "boysBowls" ? "kitchen.byBoysBowls" : "kitchen.atHerBowl", "run", () => arriveAtBowl(this, target));
      return true;
    }
    // Laura is holding food in the same room
    if (g.holding && this.room === g.room && this.distTo(g.laura) < this.beh.foodRadarRange && this.state !== "beg") {
      this.setCooldown("food", 2);
      this.say(this.pick(D().popHungry), 1.2);
      this.game.trashOpen = false;
      this.setState("beg", 30);
      return true;
    }
    return false;
  }
  onDoneEating() { this.say("*burp*", 1.2); this.setState("sit", 3); }
  onPetEnd() { this.setState("sit", 4); }
  onBored() { this.say(this.pick(D().popWander), 2); this.setState("sit", 0); }
  happyLine() { return this.pick(D().popHappy); }
  // Laura shoos him out of the trash
  redirectFromTrash() {
    this.forcedTrash = false;
    this.game.trashOpen = false;
    this.say("!!", 1);
    this.startle(this.game.laura.x);
    LPK.events.emit("trashRedirect", { cat: this.id });
  }

  poseFor() {
    const t = this.t, blep = (t % 7) < 1.2;
    switch (this.state) {
      case "trash": return { pose: "trash", frame: Math.floor(t * 4) };
      case "box":   return { pose: "sit", eyes: "closed", chew: Math.floor(t * 5) % 2 === 0, blep: Math.floor(t * 5) % 2 === 1 };
      case "sinkEat": return { pose: "eat", frame: Math.floor(t * 8), eyes: "closed" };
      case "confused": return { pose: "sit", eyes: "open" };
      case "beg":   return { pose: "sit", eyes: "open", sway: Math.floor(t * 6) % 2 };
      case "yawn":  return { pose: "sit", eyes: "closed", yawn: true };
      case "prep":  return { pose: "prep", frame: Math.floor(t * 8), eyes: "open" };
      case "headSleep": return { pose: "sleep", frame: Math.floor(t / 1.4) };
      case "sit":   return { pose: "sit", eyes: (t % 4) < 0.15 ? "closed" : "open", sway: Math.floor(t * 1.5) % 2, blep };
      default: return super.poseFor();
    }
  }
};

// Shared: a boy arrives at a bowl. At HER bowl, that's a theft.
function arriveAtBowl(cat, id) {
  const g = cat.game, b = g.bowls[id];
  if (!b || !b.food) { cat.setState("sit", 2); return; }
  if (id === "herBowl") {
    const m = g.cats.find(c => c.id === "marshmallow");
    if (b.eater && b.eater !== cat) b.eater.stopEating();
    if (m && (m.state === "eat" || (m.moving && m.tasks.length))) m.onFoodStolen(cat);
    LPK.events.emit("foodStolen", { cat: cat.id });
    cat.startEating("herBowl", 3.5);
    cat.flip = true;
    return;
  }
  if (b.eater && b.eater !== cat) { cat.setState("sit", 3); cat.setCooldown("food", 8); return; }
  cat.flip = false;
  cat.startEating(id, 10);
}
LPK.arriveAtBowl = arriveAtBowl;
