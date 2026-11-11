// Shared cat engine. Every cat can walk / run / sprint between rooms
// (path-finding through doorways), hop onto furniture, eat, be petted,
// and be startled. Each cat's personality (cats.js) decides WHAT to do.
window.LPK = window.LPK || {};

// Shortest list of doorways from one room to another (breadth-first search)
LPK.roomRoute = (worlds, from, to) => {
  const prev = { [from]: null }, queue = [from];
  while (queue.length) {
    const r = queue.shift();
    if (r === to) break;
    for (const ex of worlds[r].def.exits) {
      if (!ex.to || !worlds[ex.to] || ex.to in prev) continue;
      prev[ex.to] = { from: r, exit: ex }; queue.push(ex.to);
    }
  }
  if (!(to in prev)) return null;
  const route = [];
  for (let r = to; prev[r]; r = prev[r].from) route.unshift(prev[r]);
  return route;
};

LPK.CATNIP_BONUS = 16;     // +2 Speed (8 px/s per Speed point) on any zoomies while catnip lasts

LPK.Cat = class Cat {
  constructor(id, game, spotKey) {
    this.id = id; this.game = game;
    this.def = LPK.characters[id];
    this.look = this.def.look;
    this.beh = this.def.behavior;
    const saved = (LPK.save.data.cats[id] || {});
    // Meters (spec section 18). happiness = the Purr Meter.
    this.happiness = saved.happiness ?? (id === "marshmallow" ? 20 : 30);
    this.trust = saved.trust ?? 0.3;
    this.energy = 50; this.hunger = 40; this.comfort = 80; this.annoyance = 0;
    this.state = "sit"; this.timer = 2; this.t = Math.random() * 10;
    this.flip = false; this.z = 0;
    this.tasks = []; this.path = []; this.moveMode = "walk";
    this.bubble = null; this.dust = [];
    this.cool = {};                 // named cooldown timers
    this.found = false; this.concealed = false; this.hidden = false;
    this.witnessed = {};
    this.placeAt(spotKey);
  }

  get world() { return this.game.worlds[this.room]; }
  get T() { return LPK.config.tile; }
  rand([a, b]) { return a + Math.random() * (b - a); }
  pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  say(text, secs = 2.2, kind = "speech") { this.bubble = { text, t: secs, kind }; }
  cooldown(name) { return (this.cool[name] || 0) > 0; }
  setCooldown(name, secs) { this.cool[name] = secs; }

  placeAt(key) {
    const s = LPK.getSpot(key);
    this.spot = s; this.room = s.room;
    this.x = s.x * this.T; this.y = s.y * this.T; this.z = s.z;
    this.tasks = []; this.path = [];
  }

  get sortY() { return this.y + (this.z > 0 ? 6 : 0); }
  get lying() { return this.state === "sleep" || (this.state === "petted" && this.lyingWhilePetted); }
  get moving() { return ["move", "hop", "transit"].includes(this.state) || this.waiting; }
  // States in which Laura can pet this cat (personalities extend this)
  get pettable() { return ["sleep", "sit", "petted", "break"]; }
  get available() { return !this.concealed && this.pettable.includes(this.state); }
  headPos() { return { x: this.x, y: this.y - this.z - (this.lying ? 12 : 20) }; }
  distTo(o) { return Math.hypot(o.x - this.x, o.y - this.y); }
  sameRoomAsLaura() { return this.room === this.game.room; }

  // ------------------------------------------------------------ movement
  // target: a spot key ("kitchen.inBox"), or { room, tx, ty } (a tile)
  goTo(target, mode = "walk", onArrive) {
    const spot = typeof target === "string" ? LPK.getSpot(target) : null;
    const room = spot ? spot.room : target.room;
    const tile = spot ? spot.approach : [target.tx, target.ty];
    this.tasks = []; this.path = [];
    if (this.z > 0) this.tasks.push({ type: "hopDown" });
    if (room !== this.room) {
      // route through the house, room by room (e.g. living room -> kitchen -> back room)
      const route = LPK.roomRoute(this.game.worlds, this.room, room);
      if (!route) return false;
      for (const hop of route) {
        const w = this.game.worlds[hop.from], [ex_tx, ex_ty] = w.exitTile(hop.exit.id);
        this.tasks.push({ type: "path", room: hop.from, tx: ex_tx, ty: ex_ty });
        this.tasks.push({ type: "transit", to: hop.exit.to, toExit: hop.exit.toExit });
      }
    }
    this.tasks.push({ type: "path", room, tx: tile[0], ty: tile[1] });
    if (spot) this.tasks.push({ type: "hop", to: { x: spot.x * this.T, y: spot.y * this.T, z: spot.z }, spot });
    this.tasks.push({ type: "call", fn: () => { if (spot) this.spot = spot; onArrive && onArrive(); } });
    this.moveMode = mode;
    this.nextTask();
    return true;
  }
  stopMoving() { this.tasks = []; this.path = []; const was = this.moving; this.waiting = false; if (was) { this.state = "sit"; this.timer = 1; } }

  nextTask() {
    const task = this.tasks.shift();
    if (this.state === "hunker" && !task) return;
    if (!task) { this.waiting = false; if (["move", "hop", "transit"].includes(this.state)) { this.state = "sit"; this.timer = 2; } return; }
    if (task.type === "hopDown") {
      const a = this.spot.approach;
      this.startHop({ x: a[0] * this.T + 8, y: a[1] * this.T + 12, z: 0 });
    } else if (task.type === "hop") {
      if (Math.abs(task.to.x - this.x) + Math.abs(task.to.y - this.y) + Math.abs(task.to.z - this.z) < 2) { this.nextTask(); return; }
      if (this.beforeHop && this.beforeHop(task)) return;
      this.startHop(task.to);
    } else if (task.type === "hopRaw") {
      this.startHop(task.to); this.hop.after = task.after;
    } else if (task.type === "wait") {
      this.state = task.state; this.timer = task.secs; this.waiting = true;
      if (task.say) this.say(task.say, task.secs);
    } else if (task.type === "path") {
      this.path = this.world.path(this.x, this.y, task.tx, task.ty);
      this.state = "move";
      if (!this.path.length) this.nextTask();
    } else if (task.type === "transit") {
      this.state = "transit"; this.timer = 0.5; this.transitTo = task;
    } else if (task.type === "call") {
      task.fn();
      if (this.moving) this.nextTask();
    }
  }

  startHop(to) {
    this.state = "hop";
    this.hop = { from: { x: this.x, y: this.y, z: this.z }, to, p: 0 };
    if (Math.abs(to.x - this.x) > 1) this.flip = to.x < this.x;
    this.onHopStart && this.onHopStart(to);
  }

  speedFor(mode) {
    const b = this.beh;
    return { walk: b.walkSpeed, run: b.runSpeed || b.walkSpeed * 2, sprint: b.sprintSpeed || b.runSpeed || b.walkSpeed * 3,
      turbo: b.turboSpeed || b.walkSpeed, sneak: b.walkSpeed * 0.6, zoom: this.zoomSpeed || b.walkSpeed * 4, boss: b.bossWalkSpeed || b.walkSpeed }[mode] || b.walkSpeed;
  }

  updateMovement(dt) {
    if (this.state === "transit") {
      if ((this.timer -= dt) <= 0) {
        const tt = this.transitTo;
        this.room = tt.to;
        const p = this.world.entryPoint(tt.toExit);
        this.x = p.x; this.y = p.y; this.z = 0;
        this.nextTask();
      }
      return;
    }
    if (this.state === "hop") {
      const h = this.hop;
      h.p = Math.min(1, h.p + dt / (this.beh.hopSeconds || 0.6));
      const p = h.p, arc = Math.sin(p * Math.PI) * 6;
      this.x = h.from.x + (h.to.x - h.from.x) * p;
      this.y = h.from.y + (h.to.y - h.from.y) * p;
      this.z = h.from.z + (h.to.z - h.from.z) * p + arc;
      if (p >= 1) { this.z = h.to.z; h.after && h.after(); this.nextTask(); }
      return;
    }
    // walking along a path
    const target = this.path[0];
    if (!target) { this.nextTask(); return; }
    const speed = this.speedFor(this.moveMode);
    const dx = target.x - this.x, dy = target.y - this.y, d = Math.hypot(dx, dy);
    if (d < 1) { this.path.shift(); return; }
    this.x += dx / d * Math.min(d, speed * dt); this.y += dy / d * Math.min(d, speed * dt);
    if (Math.abs(dx) > 0.5) this.flip = dx < 0;
    if ((this.moveMode === "turbo" || this.moveMode === "sprint" || this.moveMode === "zoom") && Math.random() < dt * 14)
      this.dust.push({ x: this.x + (this.flip ? 9 : -9), y: this.y - 1, t: 0 });
  }

  // ------------------------------------------------------------ update
  update(dt) {
    const anim = LPK.save.data.settings.animationSpeed || 1;
    this.t += dt * anim;
    this.timer -= dt;
    for (const k in this.cool) this.cool[k] -= dt;
    this.annoyance = Math.max(0, this.annoyance - dt * 0.02);
    if (this.bubble && (this.bubble.t -= dt) <= 0) this.bubble = null;
    this.dust = this.dust.filter(d => (d.t += dt) < 0.5);
    if (this.state === "sleep") this.energy = Math.min(100, this.energy + dt * 0.5);
    else this.energy = Math.max(0, this.energy - dt * 0.05);
    if (this.state !== "petted" && this.state !== "break") this.happiness = Math.max(15, this.happiness - dt * 0.12);
    this.hunger = Math.min(100, this.hunger + dt * 0.04);

    if (this.catnipT > 0 && (this.catnipT -= dt) <= 0) this.catnipT = 0;
    if (this.zoomies && !["move", "hunker", "transit", "hop"].includes(this.state)) { this.zoomies = null; this.zoomSpeed = null; }   // interrupted
    if (this.waiting) { if (this.timer <= 0) { this.waiting = false; this.nextTask(); } }
    else if (this.moving) this.updateMovement(dt);
    else if (this.fighting) { /* the wrestling match is in charge (catfight.js) */ }
    else if (this.state === "hunker") this.thinkHunker();
    else if (this.begging && this.state !== "petted" && this.state !== "eat") this.thinkBeg(dt);
    else if (this.state === "eat") this.updateEating(dt);
    else if (this.state === "startled") { if (this.timer <= 0) this.afterStartle(); }
    else if (this.state !== "petted" && this.state !== "break") this.think(dt);
  }

  think() {}

  // ------------------------------------------------------------ zoomies
  // A burst of zoomies: each dash zigzags across the room at top speed, then
  // the cat hunkers down, butt wiggling, staring up at Laura with darting
  // eyes... then off again. opt: { dashes, speed, onDash, onDone }
  // Catnip adds +2 Speed (on the 1-10 scale) to any zoomies while it lasts.
  beginZoomies(opt) {
    this.stopMoving(); this.stopEating && this.stopEating();
    this.zoomies = Object.assign({ left: opt.dashes }, opt);
    this.zoomSpeed = opt.speed + (this.catnipT > 0 ? LPK.CATNIP_BONUS : 0);
    this.say(this.pick(LPK.dialogue.zoomieNoises), 1.4);
    LPK.audio.sfx.startle();
    this.nextDash();
  }
  nextDash() {
    const w = this.world, T = this.T;
    const here = [Math.floor(this.x / T), Math.floor(this.y / T)];
    let route = [];
    for (let tries = 0; tries < 30 && route.length < 4; tries++) {
      const tx = Math.floor(Math.random() * w.grid[0].length), ty = Math.floor(Math.random() * w.grid.length);
      if (!w.walkable(tx, ty) || Math.abs(tx - here[0]) + Math.abs(ty - here[1]) < 4) continue;
      route = w.path(this.x, this.y, tx, ty);
    }
    if (!route.length) { this.endDash(true); return; }
    // zigzag: weave side to side between the waypoints
    const zz = [];
    for (let i = 0; i < route.length; i++) {
      const a = i ? route[i - 1] : { x: this.x, y: this.y }, b = route[i];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, side = i % 2 ? 1 : -1;
      const m = { x: (a.x + b.x) / 2 - dy / d * 7 * side, y: (a.y + b.y) / 2 + dx / d * 7 * side };
      if (w.pointOpen(m.x, m.y)) zz.push(m);
      zz.push(b);
    }
    this.zoomSpeed = this.zoomies.speed + (this.catnipT > 0 ? LPK.CATNIP_BONUS : 0);
    this.tasks = [{ type: "call", fn: () => { this.setState("hunker", 1.1 + Math.random() * 0.7); if (Math.random() < 0.35) this.say(this.pick(LPK.dialogue.zoomieNoises), 0.9); } }];
    this.path = zz; this.moveMode = "zoom"; this.state = "move";
  }
  thinkHunker() {
    // crouched low, butt wiggling, eyes darting back and forth up at Laura
    if (this.sameRoomAsLaura()) this.flip = this.game.laura.x < this.x;
    if (this.timer <= 0) this.endDash();
  }
  endDash(force) {
    const z = this.zoomies;
    if (!z) { this.setState("sit", 2); return; }
    z.left--;
    z.onDash && z.onDash();
    if (z.left > 0 && !force) { this.nextDash(); return; }
    this.zoomies = null; this.zoomSpeed = null;
    if (z.onDone) z.onDone(); else this.setState("sit", 3);
  }
  // Catnip! Temporary zoomies with +2 Speed for the next little while.
  eatCatnip() {
    this.catnipT = 25;
    const base = this.def.attributes.speed || 5, spd = base + 2;
    LPK.events.emit("catnipZoomies", { cat: this.id });
    // zoomie speed = 30 + 8 per Speed point; the catnip bonus adds the +2 on top
    this.beginZoomies({ dashes: 3 + Math.floor(Math.random() * 2), speed: 30 + base * 8,
      onDone: () => { this.say(this.pick(LPK.dialogue.afterCatnip), 2); this.setState("sit", 5); } });
    this.say(`*CATNIP!* Speed ${base} → ${spd}!`, 1.8);
  }

  // ------------------------------------------------------------ begging
  // Robert's rotisserie chicken: sit by him, gobble any piece he tosses,
  // meow for more, raise a paw now and then.
  thinkBeg(dt) {
    const B = this.begging, R = this.game.robert;
    if (this.state !== "begSit") return;
    this.flip = R.x < this.x;
    if ((this.pawT = (this.pawT || 0) - dt) < -2.5 && Math.random() < dt * 0.6) { this.pawT = 0.9; this.say(this.pick(LPK.dialogue.begMeow), 1.2); LPK.audio.sfx.meowGrumpy(); }
    else if (Math.random() < dt * 0.35 && !this.bubble) this.say(this.pick(LPK.dialogue.begMeow), 1.1);
  }

  // ------------------------------------------------------------ Bird TV
  // Owen's room: hop onto the little desk, up onto the dresser, into the window
  windowWatch() {
    const [desk, dresser, win] = ["owensRoom.owenDesk", "owensRoom.owenDresserTop", "owensRoom.owenWindow"].map(LPK.getSpot);
    const pos = (sp) => ({ x: sp.x * this.T, y: sp.y * this.T, z: sp.z });
    return this.goTo(desk.key, "run", () => {
      this.tasks = [
        { type: "hop", to: pos(dresser), spot: dresser },
        { type: "call", fn: () => { this.spot = dresser; } },
        { type: "hop", to: pos(win), spot: win },
        { type: "call", fn: () => { this.spot = win; this.flip = true; this.setState("window", 15 + Math.random() * 12); this.say(this.pick(LPK.dialogue.windowWatch), 1.8); } },
      ];
    });
  }
  // returns true while the cat is busy staring out the window
  thinkWindow() {
    if (this.state !== "window") return false;
    this.witness("windowWatch");
    if (Math.random() < 0.006) this.say(this.pick(LPK.dialogue.windowWatch), 1.6);
    if (Math.random() < 0.01) this.flip = !this.flip;
    if (this.timer <= 0) this.setState("sit", 0.5);
    return true;
  }

  // ------------------------------------------------------------ eating
  // Bowl or hand-fed. bowlId = null when Laura hand-feeds.
  startEating(bowlId, secs) {
    this.state = "eat"; this.timer = secs; this.eatingBowl = bowlId;
    this.eatingFood = bowlId && this.game.bowls[bowlId] ? this.game.bowls[bowlId].food : null;
    this.hunger = Math.max(0, this.hunger - 40);
    if (bowlId) this.game.bowls[bowlId].eater = this;
  }
  updateEating() {
    if (this.timer > 0) return;
    const b = this.eatingBowl && this.game.bowls[this.eatingBowl];
    if (b) { b.food = null; b.eater = null; }
    const bowl = this.eatingBowl; this.eatingBowl = null;
    this.state = "sit"; this.timer = 2;
    const ate = this.eatingFood; this.eatingFood = null;
    if (ate === "catnip") { this.eatCatnip(); return; }
    if (ate === "chicken") { this.setState("begSit", 1); return; }
    this.onDoneEating && this.onDoneEating(bowl);
  }
  stopEating() {
    const b = this.eatingBowl && this.game.bowls[this.eatingBowl];
    if (b && b.eater === this) b.eater = null;
    this.eatingBowl = null;
  }

  // Hand-feeding by Laura. Returns true if the cat liked it.
  offerFood(food) {
    const pref = (this.def.foodPrefs || {})[food] || 0;
    LPK.events.emit("catFed", { cat: this.id, food, liked: pref > 0 });
    if (pref <= 0) { this.onFoodRefused && this.onFoodRefused(food); return false; }
    this.stopMoving();
    this.state = "eat"; this.timer = 1.6; this.eatingBowl = null; this.eatingFood = food;
    this.game.petting.addRaw(this, 12 + 25 * pref);
    return true;
  }

  // Startled jump, then run off somewhere
  startle(fromX) {
    this.stopMoving(); this.stopEating();
    this.state = "startled"; this.timer = 0.7; this.flip = fromX > this.x;
    this.startleT = 0;
  }
  afterStartle() { this.state = "sit"; this.timer = 1; }

  // Witnessing: Laura sees something (same room, close enough to be on screen)
  witness(event, payload = {}, once = true) {
    if (!this.sameRoomAsLaura() || this.distTo(this.game.laura) > 170) return false;
    const key = event + ":" + this.stateSerial;
    if (once && this.witnessed[key]) return false;
    this.witnessed[key] = true;
    LPK.events.emit(event, Object.assign({ cat: this.id }, payload));
    return true;
  }
  setState(s, timer) { this.state = s; this.timer = timer; this.stateSerial = (this.stateSerial || 0) + 1; }

  // ------------------------------------------------------------ petting hooks
  onPetStart() {}
  onPetEnd() { if (this.lyingWhilePetted) { this.state = "sleep"; this.timer = 20; } else { this.state = "sit"; this.timer = 3 + Math.random() * 3; } }
  onBored() {}
  happyLine() { return "*purr*"; }

  // ------------------------------------------------------------ drawing
  poseFor() {
    const t = this.t;
    switch (this.state) {
      case "sleep": return { pose: "sleep", frame: Math.floor(t / 1.4) };
      case "petted": return this.lyingWhilePetted ? { pose: "sleep", frame: Math.floor(t / 1.4) } : { pose: "sit", eyes: "happy", sway: Math.floor(t * 3) % 2 };
      case "break": return { pose: "sit", eyes: "annoyed", sway: Math.floor(t * 6) % 2 ? 1 : -1 };
      case "eat": return { pose: "eat", frame: Math.floor(t * 5), eyes: "closed" };
      case "startled": return { pose: "stand", eyes: "open", jump: Math.round(Math.sin(Math.min(1, (0.7 - this.timer) / 0.7) * Math.PI) * 10) };
      case "hop": return { pose: "stand" };
      case "window": return { pose: "sit", eyes: "open", sway: Math.floor(t * 3) % 2 };
      case "hunker": return { pose: "hunker", frame: Math.floor(t * 8), dart: Math.floor(t * 9) % 2 ? 1 : -1 };
      case "begSit": return { pose: "sit", eyes: "open", sway: Math.floor(t * 4) % 2, pawUp: this.pawT > 0 };
      case "move": {
        const m = this.moveMode;
        if (m === "zoom") return { pose: "sprint", frame: Math.floor(t * 18) };
        if (m === "sneak") return { pose: "prep", frame: Math.floor(t * 4), eyes: "open" };
        if (m === "sprint") return { pose: "sprint", frame: Math.floor(t * 14) };
        if (m === "turbo") return { pose: "turbo", frame: Math.floor(t * (this.beh.turboLegFps || 20)), eyes: "annoyed", jitter: Math.floor(t * 20) % 2 };
        if (m === "run") return { pose: "walk", frame: Math.floor(t * 11) };
        if (m === "boss") return { pose: "walk", frame: Math.floor(t * 3) };
        return { pose: "walk", frame: Math.floor(t * 6), sway: Math.floor(t * 2) % 2 };
      }
      default: return { pose: "sit", eyes: (t % 4) < 0.15 ? "closed" : "open", sway: Math.floor(t * 1.5) % 2 };
    }
  }

  draw(g) {
    if (this.concealed || this.state === "transit" || this.fightHidden) return;
    const fp = this.fightPose;
    const p = fp === "champ" ? { pose: "champ", eyes: "happy", frame: Math.floor(this.t * 2) } : fp === "bellyUp" ? { pose: "bellyUp", frame: Math.floor(this.t * 8), eyes: "closed" }
      : fp ? { pose: fp, eyes: "open" } : this.poseFor();
    for (const d of this.dust) LPK.px.rect(g, d.x - d.t * 6, d.y - d.t * 8, 2 + d.t * 4, 2, `rgba(220,215,205,${1 - d.t * 2})`);
    const dx = this.x, dy = this.y - this.z - (p.jitter || 0) - (p.jump || 0);
    const face = this.faceOpts ? this.faceOpts() : {};
    const shapes = LPK.sprites.cat(this.look, p.pose, p.frame || 0, Object.assign({ eyes: p.eyes, tailSway: p.sway || 0, chew: p.chew, blep: p.blep, yawn: p.yawn, dart: p.dart, pawUp: p.pawUp }, face));
    if (this.z === 0) LPK.px.rect(g, dx - 7, this.y - 1, 14, 2, "rgba(0,0,0,0.2)");
    const clip = this.peekClip || (this.spot && this.spot.clip && this.z === this.spot.z && this.state !== "hop" && Math.abs(this.x - this.spot.x * this.T) < 1);
    if (clip) {
      const T = this.T, c = this.peekClip ? this.peekClip.map(v => v / T) : this.spot.clip;
      g.save(); g.beginPath(); g.rect(c[0] * T, c[1] * T, c[2] * T, c[3] * T); g.clip();
      LPK.px.draw(g, shapes, dx, dy, this.flip);
      g.restore();
    } else LPK.px.draw(g, shapes, dx, dy, this.flip);
    if (this.state === "move" && this.moveMode === "turbo" && Math.floor(this.t * 3) % 2) LPK.px.rect(g, dx + (this.flip ? -6 : 6), dy - 16, 1, 2, "#7fc3f0");
    if (this.state === "move" && this.moveMode === "sprint") for (let i = 0; i < 3; i++) LPK.px.rect(g, dx + (this.flip ? 14 : -26) + i * 2, dy - 10 + i * 3, 8, 1, "rgba(255,255,255,0.7)");
    if (this.catnipT > 0) for (let i = 0; i < 3; i++) {             // catnip buzz: little green sparkles
      const a = this.t * 3 + i * 2.1, pp = (this.t * 1.5 + i / 3) % 1;
      LPK.px.rect(g, dx + Math.cos(a) * 9, dy - 14 - pp * 10, 1, 1, `rgba(126,217,87,${1 - pp})`);
    }
    this.drawExtra && this.drawExtra(g, dx, dy);
  }

  toSave() { return { happiness: this.happiness, trust: this.trust }; }
};
