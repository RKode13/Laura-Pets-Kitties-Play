// Petting + Marshmallow's Turbo Back Pats rhythm mini-game (spec 4 & 17A),
// plus the mission / achievement / points progression system.
window.LPK = window.LPK || {};

LPK.Petting = class Petting {
  constructor(game) { this.game = game; this.session = null; this.rejections = 0; this.pettedSet = new Set(); }
  get active() { return !!this.session; }

  start(cat) {
    const L = this.game.laura, D = LPK.dialogue;
    if (!cat.available) {
      L.sayRandom(cat.id === "cc" ? D.lauraRejectedCC : cat.id === "popsicle" ? D.lauraRejectedPop : D.lauraRejected, 2);
      LPK.events.emit("petRejected", { cat: cat.id });
      if (++this.rejections >= 3) LPK.events.emit("rejectedThree", {});
      return;
    }
    L.flip = cat.x < L.x; L.dir = "side";
    L.state = cat.z > 10 ? "reach" : "kneel";
    cat.lyingWhilePetted = cat.state === "sleep";
    cat.stopMoving && cat.tasks && (cat.tasks = []);
    cat.state = "petted";
    this.session = { cat, gainSinceBreak: 0, sessionGain: 0, lastProgress: 0, combo: 0, best: 0, lastSide: null, lastPat: -9, time: 0, ignored: 0, heartBank: 0, comboFired: false };
    L.sayRandom(cat.id === "cc" ? D.lauraPetCC : cat.id === "popsicle" ? D.lauraPetPop : D.lauraPetStart, 1.8);
    cat.onPetStart();
    LPK.events.emit("petStart", { cat: cat.id });
    LPK.save.data.stats.pets++;
  }

  stop(reason) {
    const s = this.session; if (!s) return;
    const L = this.game.laura, cat = s.cat;
    L.state = "idle"; L.patFrame = 0;
    if (cat.state === "petted" || cat.state === "break") cat.onPetEnd(reason);
    LPK.audio.purr(0);
    this.session = null;
  }

  get turbo() { return this.session && this.session.cat.def.petting.style === "turboPats"; }

  pat(side) {
    const s = this.session; if (!s) return;
    const cat = s.cat, L = this.game.laura;
    LPK.audio.sfx.pat(side);
    L.patFrame = L.patFrame ? 0 : 2;
    if (cat.state === "break") {
      // She asked for a break. Keep patting and she'll lose patience.
      s.ignored++;
      cat.say("...", 0.8);
      if (s.ignored >= cat.beh.ignoredBreakPatsToLeave) {
        this.stop("ignoredBreak");
        L.sayRandom(LPK.dialogue.lauraRejected, 2.4);
        LPK.events.emit("petRejected", { cat: cat.id });
        if (++this.rejections >= 3) LPK.events.emit("rejectedThree", {});
        cat.trust = Math.max(0, cat.trust - 0.05);
        cat.startStare(L, () => cat.travelTo(cat.otherSpot(), true));
        setTimeout(() => L.sayRandom(LPK.dialogue.lauraAfterStare, 2.6), 4200);
      }
      return;
    }
    if (!this.turbo) { this.addHappiness(1.1); cat.patWiggle = !cat.patWiggle; return; }   // scritches for the boys
    cat.lyingWhilePetted = false;                 // she gets up for her favorite pats
    cat.patWiggle = !cat.patWiggle;
    const dt = s.time - s.lastPat;
    const repeated = side === s.lastSide;                       // same hand twice = off rhythm
    const alternated = s.lastSide !== null && !repeated && dt < 0.55;
    if (alternated) s.combo++;
    else if (repeated) s.combo = Math.max(0, s.combo - 2);
    else s.combo = Math.max(0, Math.min(s.combo, 1));
    s.lastSide = side; s.lastPat = s.time;
    s.best = Math.max(s.best, s.combo);
    const gain = repeated ? 0.4 : 1.4 + Math.min(s.combo, 20) * 0.11;
    this.addHappiness(gain);
    if (s.combo >= LPK.config.turboComboForAchievement && !s.comboFired) {
      s.comboFired = true;
      LPK.events.emit("turboCombo", { cat: cat.id, combo: s.combo });
    }
  }

  // Happiness from outside a petting session (treats etc.)
  addRaw(cat, amount) {
    const before = cat.happiness;
    cat.happiness = Math.max(before, Math.min(100, cat.happiness + amount));
    const hearts = Math.floor((cat.happiness - before) / LPK.config.heartsPerPurrPoints + 0.5);
    for (let i = 0; i < hearts; i++) this.game.addHeart(cat);
    if (before < 100 && cat.happiness >= 100) LPK.events.emit("purrFull", { cat: cat.id });
  }

  addHappiness(amount) {
    const s = this.session, cat = s.cat;
    const mult = (0.7 + cat.trust * 0.6) * (cat.def.attributes.cuddliness / 10);
    const gain = amount * mult;
    const before = cat.happiness;
    // Marshmallow's meter can overcharge past 100% (up to 200%): the extra
    // turns into zoomies once the petting stops (or the meter maxes out).
    cat.happiness = Math.max(before, Math.min(cat.maxHappiness || 100, cat.happiness + gain));
    s.gainSinceBreak += gain; s.sessionGain += gain;
    s.heartBank += cat.happiness - before;
    cat.trust = Math.min(1, cat.trust + gain / 500);
    const per = LPK.config.heartsPerPurrPoints;
    while (s.heartBank >= per) { s.heartBank -= per; this.game.addHeart(cat); }
    if (s.sessionGain - s.lastProgress >= 5) {
      s.lastProgress = s.sessionGain;
      LPK.events.emit("petProgress", { cat: cat.id, gained: s.sessionGain });
      if (s.sessionGain >= 10 && !this.pettedSet.has(cat.id)) {
        this.pettedSet.add(cat.id);
        if (this.pettedSet.size >= 3) LPK.events.emit("pettedAll", {});
      }
      if (this.game.cats.every(c => c.trust >= 0.6)) LPK.events.emit("whisperer", {});
    }
    if (before < 100 && cat.happiness >= 100) {
      cat.trust = Math.min(1, cat.trust + 0.15);
      cat.say(cat.happyLine(), 2.5);
      LPK.events.emit("purrFull", { cat: cat.id });
      if (cat.onPurrFull && cat.onPurrFull()) return;
    }
    if (!this.session) return;
    if (cat.maxHappiness && cat.happiness >= cat.maxHappiness) { this.stop("zoomies"); return; }   // totally overcharged: ZOOM
    if (this.turbo && s.gainSinceBreak >= cat.beh.breakEvery && cat.happiness < 100) {
      cat.state = "break"; cat.breakT = cat.beh.breakSeconds; s.gainSinceBreak = 0; s.ignored = 0;
      cat.say(cat.pick(LPK.dialogue.marshmallowBreak), cat.beh.breakSeconds);
      this.game.laura.say(LPK.dialogue.lauraBreakHint[0], cat.beh.breakSeconds);
      LPK.audio.sfx.breakSignal();
    } else if (!this.turbo && cat.beh.pettingPatience && s.sessionGain >= cat.beh.pettingPatience && cat.happiness < 100) {
      // the boys only sit still for so long
      this.stop("bored");
      cat.onBored();
    }
  }

  update(dt, input) {
    const s = this.session; if (!s) return;
    const cat = s.cat;
    s.time += dt;
    if (cat.state !== "petted" && cat.state !== "break") { this.stop("catLeft"); return; }
    if (cat.state === "break") {
      cat.breakT -= dt;
      LPK.audio.purr(0.05);
      if (cat.breakT <= 0) {
        cat.state = "petted";
        cat.trust = Math.min(1, cat.trust + 0.05);
        cat.say("*purr*", 1.2);
        LPK.events.emit("breakRespected", { cat: cat.id });
      }
      if (input.pressed("patL")) this.pat(0);
      if (input.pressed("patR")) this.pat(1);
      if (input.pressed("stop")) this.stop("player");
      return;
    }
    // Gentle petting: hold Pet. Turbo Back Pats: alternate left / right.
    if (input.down("act")) { this.addHappiness(4.5 * dt); this.game.laura.patFrame = Math.floor(s.time * 4) % 2 ? 1 : 0; }
    if (!this.session) return;
    if (input.pressed("patL")) this.pat(0);
    if (input.pressed("patR")) this.pat(1);
    if (!this.session) return;
    if (s.time - s.lastPat > 0.9) s.combo = Math.max(0, s.combo - dt * 6);
    const purr = Math.min(1, 0.25 + s.combo / 14 + (input.down("act") ? 0.3 : 0));
    LPK.audio.purr(purr);
    if (input.pressed("stop")) this.stop("player");
  }
};

// ------------------------------------------------------- PROGRESSION
LPK.Progression = class Progression {
  constructor(game) {
    this.game = game;
    this.toasts = [];
    LPK.events.on("*", (name, p) => { this.checkMission(name, p); this.checkAchievements(name, p); });
  }
  get save() { return LPK.save.data; }

  currentMission() {
    return LPK.missions.find(m => m.available && !(this.save.missions[m.id] && this.save.missions[m.id].done)) || null;
  }
  stepIndex(m) { return (this.save.missions[m.id] && this.save.missions[m.id].step) || 0; }

  stepMatches(step, name, p) {
    if (!step || step.event !== name || (step.cat && step.cat !== p.cat)) return false;
    if (step.match && !Object.entries(step.match).every(([k, v]) => p[k] === v)) return false;
    if (step.min && !Object.entries(step.min).every(([k, v]) => (p[k] || 0) >= v)) return false;
    return true;
  }
  stepDone(m, step) { const r = this.save.missions[m.id]; return !!(r && r.doneSteps && r.doneSteps.includes(step.id)); }

  checkMission(name, p) {
    const m = this.currentMission(); if (!m) return;
    if (m.anyOrder) {
      // checklist level: any step, any order
      const step = m.steps.find(st => !this.stepDone(m, st) && this.stepMatches(st, name, p));
      if (!step) return;
      const rec = this.save.missions[m.id] || { doneSteps: [] };
      rec.doneSteps = [...(rec.doneSteps || []), step.id];
      this.save.missions[m.id] = rec;
      LPK.audio.sfx.found();
      if (rec.doneSteps.length >= m.steps.length) return this.completeMission(m);
      LPK.save.write();
      return;
    }
    const i = this.stepIndex(m), step = m.steps[i];
    if (!this.stepMatches(step, name, p)) return;
    if (step.count) {
      const rec = this.save.missions[m.id] || { step: i };
      rec.count = (rec.count || 0) + 1;
      this.save.missions[m.id] = rec;
      if (rec.count < step.count) { LPK.save.write(); return; }
    }
    const next = i + 1;
    this.save.missions[m.id] = { step: next, done: next >= m.steps.length, count: 0 };
    if (next >= m.steps.length) {
      this.completeMission(m);
    } else {
      LPK.save.write();
      const nextStep = m.steps[next];
      if (nextStep.onStart) this.game.runScript(nextStep.onStart);
    }
  }

  completeMission(m) {
    const rec = this.save.missions[m.id] || {};
    rec.done = true; this.save.missions[m.id] = rec;
    this.addPoints(m.reward.points);
    LPK.save.write();
    LPK.events.emit("missionComplete", { mission: m.id });
    this.game.celebrate(m);
  }

  // Run a level's setup + the current step's scripted moment (new level or Continue)
  setupCurrent() {
    const m = this.currentMission(); if (!m) return;
    if (m.setup) this.game.runScript(m.setup);
    if (m.anyOrder) return;
    const step = m.steps[this.stepIndex(m)];
    if (step && step.onStart) this.game.runScript(step.onStart);
  }

  checkAchievements(name, p) {
    for (const a of LPK.achievements) {
      if (a.event !== name || this.save.achievements[a.id]) continue;
      if (a.match && !Object.entries(a.match).every(([k, v]) => p[k] === v)) continue;
      this.save.achievements[a.id] = Date.now();
      LPK.save.write();
      const fam = LPK.save.data.settings.familyFriendly && a.familyName;
      this.toasts.push({ title: "Achievement unlocked!", text: fam ? a.familyName : a.name, t: 4 });
      LPK.audio.sfx.achievement();
    }
  }

  addPoints(n) { this.save.points += n; }
};
