// Core systems: event bus, game clock, save/load, audio, and input.
window.LPK = window.LPK || {};

// ------------------------------------------------------------- EVENTS
LPK.events = (() => {
  const handlers = {};
  return {
    on(name, fn) { (handlers[name] = handlers[name] || []).push(fn); },
    emit(name, payload = {}) { (handlers[name] || []).forEach(fn => fn(payload)); (handlers["*"] || []).forEach(fn => fn(name, payload)); },
  };
})();

// --------------------------------------------------------------- CLOCK
// One central clock. Cat behavior and lighting read from it.
LPK.Clock = class Clock {
  constructor(day, minutes) { this.day = day; this.minutes = minutes; }
  static parse(str) {
    const m = /(\d+):(\d+)\s*(AM|PM)/i.exec(str);
    let h = +m[1] % 12; if (m[3].toUpperCase() === "PM") h += 12;
    return h * 60 + +m[2];
  }
  update(dt) {
    this.minutes += dt * LPK.config.clockMinutesPerSecond;
    if (this.minutes >= 1440) { this.minutes -= 1440; this.day = (this.day + 1) % 7; }
  }
  get hour() { return this.minutes / 60; }
  get isWeekend() { return this.day === 0 || this.day === 6; }
  get phase() {
    const h = this.hour;
    return h < 5 ? "night" : h < 12 ? "morning" : h < 17 ? "afternoon" : h < 21 ? "evening" : "night";
  }
  label() {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const h24 = Math.floor(this.hour), m = Math.floor(this.minutes % 60);
    const h12 = ((h24 + 11) % 12) + 1;
    return `${days[this.day]} ${h12}:${String(m).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
  }
  darkness() {
    const h = this.hour, lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));
    if (h < 5) return 0.55;
    if (h < 7) return lerp(0.55, 0, (h - 5) / 2);
    if (h < 17.5) return 0;
    if (h < 20.5) return lerp(0, 0.5, (h - 17.5) / 3);
    return 0.55;
  }
};

// ---------------------------------------------------------------- SAVE
LPK.save = (() => {
  const KEY = "laura-pets-kitties-v1";
  const fresh = () => ({
    version: 1, hasGame: false, points: 0, achievements: {}, missions: {},
    settings: Object.assign({}, LPK.config.defaultSettings),
    clock: null, cats: {}, stats: { pets: 0, stares: 0 },
  });
  let data = fresh();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && raw.version === 1) { data = Object.assign(fresh(), raw); data.settings = Object.assign({}, LPK.config.defaultSettings, raw.settings); }
  } catch (e) { /* private mode etc. */ }
  return {
    get data() { return data; },
    write() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} },
    newGame() { const settings = data.settings; data = fresh(); data.settings = settings; data.hasGame = true; this.write(); },
  };
})();

// --------------------------------------------------------------- VIEW
// The game's screen size. On a touch screen held upright (portrait), the game
// is drawn rotated 90° so it still plays sideways — Safari on iPhone can't
// lock the screen to landscape, and rotation lock may be on.
LPK.view = {
  rotated: false, w: window.innerWidth, h: window.innerHeight,
  update() {
    const iw = window.innerWidth, ih = window.innerHeight;
    const touch = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    this.rotated = !!touch && ih > iw;
    this.w = this.rotated ? ih : iw; this.h = this.rotated ? iw : ih;
  },
  // screen point -> game point
  toGame(cx, cy) { return this.rotated ? { x: cy, y: window.innerWidth - cx } : { x: cx, y: cy }; },
};

// --------------------------------------------------------------- AUDIO
// All sounds are synthesized (no audio files needed yet).
LPK.audio = (() => {
  let ac = null, purrGain = null, sfxBus = null, musicBus = null, musicTimer = null, step = 0;
  const S = () => LPK.save.data.settings;

  function init() {
    if (ac) { if (ac.state === "suspended") ac.resume(); return; }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      sfxBus = ac.createGain(); sfxBus.connect(ac.destination);
      musicBus = ac.createGain(); musicBus.connect(ac.destination);
      // purr: rumbling low noise, volume driven by petting
      const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (0.55 + 0.45 * Math.sin(i / ac.sampleRate * 2 * Math.PI * 24));
      const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 170;
      purrGain = ac.createGain(); purrGain.gain.value = 0;
      src.connect(lp).connect(purrGain).connect(sfxBus); src.start();
      applyVolumes();
      startMusic();
    } catch (e) { ac = null; }
  }
  function applyVolumes() {
    if (!ac) return;
    sfxBus.gain.value = S().sfxVolume;
    musicBus.gain.value = S().musicVolume * 0.5;
  }
  function tone(freq, dur = 0.15, vol = 0.12, type = "sine", slide = 1.4, delay = 0) {
    if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(sfxBus); o.start(t); o.stop(t + dur + 0.02);
  }
  const sfx = {
    heart: () => tone(880 + Math.random() * 300, 0.14, 0.08),
    pat: (side) => tone(side ? 260 : 220, 0.05, 0.06, "triangle", 0.8),
    meowGrumpy: () => { tone(520, 0.18, 0.07, "triangle", 0.7); tone(380, 0.2, 0.06, "triangle", 0.8, 0.12); },
    found: () => { tone(660, 0.12, 0.08); tone(990, 0.2, 0.08, "sine", 1.2, 0.1); },
    achievement: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 0.09, "triangle", 1.0, i * 0.09)),
    celebrate: () => [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.3, 0.1, "triangle", 1.0, i * 0.12)),
    click: () => tone(600, 0.05, 0.05, "square", 1.0),
    stare: () => { tone(196, 0.6, 0.06, "sawtooth", 0.98); tone(185, 0.7, 0.05, "sawtooth", 0.98, 0.05); },
    step: () => tone(120, 0.03, 0.02, "triangle", 0.8),
    breakSignal: () => tone(300, 0.12, 0.05, "triangle", 0.9),
    angelic: () => { tone(1320, 0.35, 0.06, "sine", 1.15); tone(1760, 0.4, 0.04, "sine", 0.95, 0.15); },
    startle: () => { tone(900, 0.08, 0.06, "square", 1.6); tone(500, 0.12, 0.05, "triangle", 0.6, 0.06); },
    crunch: () => { for (let i = 0; i < 3; i++) tone(180 + Math.random() * 80, 0.03, 0.05, "square", 0.6, i * 0.07); },
    door: () => tone(330, 0.12, 0.04, "triangle", 0.8),
    calliope: () => [523, 659, 784, 659, 523, 659, 784, 1046, 880, 784].forEach((f, i) => tone(f, 0.16, 0.06, "square", 1.0, i * 0.15)),
    tinySnore: () => { tone(140, 0.35, 0.012, "sine", 1.1); tone(170, 0.25, 0.008, "sine", 0.9, 0.4); },
    boing: () => tone(300, 0.18, 0.05, "triangle", 2.2),
    rub: () => tone(520, 0.08, 0.05, "sine", 1.3),
    kick: () => { tone(260, 0.06, 0.06, "square", 0.7); tone(200, 0.06, 0.05, "square", 0.7, 0.07); },
    sing: () => [392, 330, 392, 440, 392].forEach((f, i) => tone(f, 0.17, 0.05, "triangle", 1.0, i * 0.19)),
    steam: () => { for (let i = 0; i < 6; i++) tone(2400 + Math.random() * 1600, 0.09, 0.012, "sawtooth", 0.9, i * 0.06); },
    tension: () => { tone(65, 4, 0.06, "sawtooth", 0.97); tone(98, 4, 0.03, "sine", 1.0); for (let i = 0; i < 5; i++) tone(55, 0.14, 0.12, "sine", 0.7, i * 0.8); },
    bleep: () => tone(1000, 0.5, 0.06, "sine", 1.0),
    kiss: () => { tone(1300 + Math.random() * 300, 0.06, 0.04, "sine", 0.6); tone(700, 0.05, 0.03, "triangle", 1.4, 0.05); },
    sting: () => { tone(220, 0.6, 0.06, "sawtooth", 0.98); tone(233, 0.6, 0.05, "sawtooth", 0.98); tone(880, 0.25, 0.03, "square", 0.5, 0.05); },
    tear: () => tone(300 + Math.random() * 200, 0.04, 0.025, "sawtooth", 0.6),
    slap: () => { tone(1800, 0.05, 0.1, "square", 0.3); tone(400, 0.08, 0.08, "sawtooth", 0.5, 0.01); },
    hiss: () => { for (let i = 0; i < 4; i++) tone(1400 + Math.random() * 900, 0.05, 0.025, "sawtooth", 0.7, i * 0.04); },
    slam: () => { tone(90, 0.35, 0.14, "square", 0.5); tone(140, 0.2, 0.08, "sawtooth", 0.4, 0.02); },
    bell: () => { tone(1568, 0.5, 0.07, "triangle", 1.0); tone(2350, 0.4, 0.03, "sine", 1.0); },
    cheer: () => { for (let i = 0; i < 14; i++) tone(300 + Math.random() * 500, 0.25, 0.02, "sawtooth", 1.1 + Math.random() * 0.3, i * 0.05); [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, 0.06, "square", 1.0, 0.3 + i * 0.12)); },
  };
  // A warbly organ voice: two slightly detuned oscillators + vibrato, like an
  // old carnival calliope that's been sitting in a basement too long.
  function organ(freq, dur, vol, delay, opt = {}) {
    if (!ac) return;
    const t = ac.currentTime + delay, g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lfo = ac.createOscillator(), lg = ac.createGain();
    lfo.frequency.value = opt.vibRate || 6; lg.gain.value = freq * (opt.vib || 0.012);
    lfo.connect(lg);
    [0, opt.detune || 9].forEach(cents => {
      const o = ac.createOscillator(); o.type = opt.type || "square";
      o.frequency.setValueAtTime(freq, t); o.detune.value = cents;
      if (opt.bend) o.frequency.exponentialRampToValueAtTime(freq * opt.bend, t + dur);
      lg.connect(o.frequency); o.connect(g); o.start(t); o.stop(t + dur + 0.05);
    });
    lfo.start(t); lfo.stop(t + dur + 0.05);
    g.connect(sfxBus);
  }
  // The clown's show: a jaunty-but-off carnival waltz while the mask is
  // closed, then a slow, sinking minor version with a low drone and an evil
  // laugh once the face opens. C = the show timeline (seconds).
  function clownShow(C) {
    if (!ac) return;
    // duck the background music for the show
    musicBus.gain.setTargetAtTime(0, ac.currentTime, 0.1);
    setTimeout(() => applyVolumes(), C.total * 1000);
    const hz = (n) => 261.63 * Math.pow(2, n / 12);           // semitones from middle C
    // oom-pah-pah waltz: melody (semitones) one note per beat
    const melA = [7, 11, 14, 12, 11, 7, 6, 7, 9, 7, 4, 3, 2, 3, 4, 7, 12, 11, 9, 6, 7, 2, 1, 2];
    const bassA = [-12, -17, -12, -10, -12, -17, -15, -10];
    const beat = 0.2;
    let i = 0;
    for (let tm = C.talk1 - 0.4; tm < C.split - 0.1; tm += beat, i++) {
      organ(hz(melA[i % melA.length]), beat * 0.9, 0.045, tm, { vib: 0.01 + (i % 7 === 6 ? 0.03 : 0) });
      const bar = Math.floor(i / 3);
      if (i % 3 === 0) organ(hz(bassA[bar % bassA.length]) / 2, beat * 0.9, 0.05, tm, { type: "triangle", detune: 4 });
      else organ(hz(bassA[bar % bassA.length] + 7), beat * 0.6, 0.02, tm, { detune: 14 });
    }
    // the music "winds down" as the mask cracks open
    organ(hz(7), C.evil - C.split, 0.05, C.split, { bend: 0.5, vib: 0.03, vibRate: 9 });
    tone(110, 0.9, 0.08, "sawtooth", 0.5, C.split + 0.2);
    // evil section: same tune in a minor key, slower, sinking pitch, low drone
    const melB = [7, 10, 13, 12, 10, 7, 6, 7, 8, 7, 3, 2, 1, 2, 3, 6];
    const slow = 0.32; i = 0;
    for (let tm = C.evil; tm < C.close - 0.1; tm += slow, i++) {
      organ(hz(melB[i % melB.length] - 2), slow * 0.95, 0.04, tm, { vib: 0.025, vibRate: 4.5, detune: 22, bend: 0.985 });
      if (i % 3 === 0) organ(hz(-24 + (Math.floor(i / 3) % 2 ? 1 : 0)), slow * 2.9, 0.05, tm, { type: "sawtooth", detune: 6, vib: 0.004 });
    }
    organ(55, C.close - C.evil, 0.035, C.evil, { type: "sawtooth", detune: 30, vib: 0.02, vibRate: 0.7 });   // drone
    // the evil laugh: descending "HA" bursts near the end of the line
    const laughAt = C.close - 2.1;
    for (let k = 0; k < 7; k++) {
      const f = 300 - k * 22;
      tone(f, 0.16, 0.07, "sawtooth", 0.8, laughAt + k * 0.24);
      tone(f * 2.5, 0.12, 0.025, "square", 0.85, laughAt + k * 0.24);
    }
    // the mask snaps shut
    tone(90, 0.12, 0.09, "square", 0.6, C.shut - 0.1);
  }
  function purr(level) {
    if (!purrGain) return;
    purrGain.gain.setTargetAtTime(Math.max(0, Math.min(1, level)) * 0.5, ac.currentTime, 0.1);
  }
  // Gentle music-box loop
  function startMusic() {
    if (musicTimer) return;
    const chords = [[262, 330, 392, 494], [220, 262, 330, 392], [175, 220, 262, 330], [196, 247, 294, 392]];
    musicTimer = setInterval(() => {
      if (!ac || S().musicVolume <= 0) return;
      const ch = chords[Math.floor(step / 8) % 4], n = ch[[0, 2, 1, 3, 2, 1, 3, 2][step % 8]] * 2;
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
      o.type = "triangle"; o.frequency.value = n;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      o.connect(g).connect(musicBus); o.start(t); o.stop(t + 1);
      step++;
    }, 460);
  }
  return { init, applyVolumes, sfx, purr, clownShow, get ready() { return !!ac; } };
})();

// --------------------------------------------------------------- INPUT
LPK.input = (() => {
  const keyMap = {
    up: ["ArrowUp", "KeyW"], down: ["ArrowDown", "KeyS"], left: ["ArrowLeft", "KeyA"], right: ["ArrowRight", "KeyD"],
    run: ["ShiftLeft", "ShiftRight"], act: ["Space", "KeyE", "Enter"],
    patL: ["ArrowLeft", "KeyA", "KeyZ"], patR: ["ArrowRight", "KeyD", "KeyX"],
    pause: ["Escape", "KeyP"], stop: ["Escape", "KeyQ"], goals: ["KeyG"],
  };
  const held = new Set(), pressed = new Set();
  const pointers = new Map();          // pointerId -> {x,y,ox,oy,role}
  let clicks = [];
  let touchButtons = [];               // set by the UI every frame: {id, x, y, r}
  const touchHeld = new Set(), touchPressed = new Set();
  let stick = null;                    // {ox, oy, x, y}
  let lastType = "keyboard";

  window.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
    if (!held.has(e.code)) pressed.add(e.code);
    held.add(e.code); lastType = "keyboard";
    LPK.audio.init();
  });
  window.addEventListener("keyup", (e) => held.delete(e.code));
  window.addEventListener("blur", () => { held.clear(); touchHeld.clear(); pointers.clear(); stick = null; });

  // Phones held upright (e.g. iPhone Safari, which can't lock to landscape):
  // the game is drawn turned sideways, so touches are turned to match.
  const toGame = (e) => LPK.view.toGame(e.clientX, e.clientY);

  function hitButton(x, y) { return touchButtons.find(b => (x - b.x) ** 2 + (y - b.y) ** 2 <= (b.r * 1.15) ** 2); }

  function bind(canvas) {
    canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      LPK.audio.init();
      lastType = e.pointerType === "touch" ? "touch" : "mouse";
      const { x, y } = toGame(e);
      clicks.push({ x, y });
      const b = hitButton(x, y);
      if (b) { pointers.set(e.pointerId, { role: "button", id: b.id }); touchHeld.add(b.id); touchPressed.add(b.id); return; }
      if (LPK.input.stickEnabled && x < LPK.view.w * 0.5) {
        stick = { ox: x, oy: y, x, y, id: e.pointerId };
        pointers.set(e.pointerId, { role: "stick" });
      }
    });
    canvas.addEventListener("pointermove", (e) => {
      const p = pointers.get(e.pointerId);
      if (p && p.role === "stick" && stick) { const q = toGame(e); stick.x = q.x; stick.y = q.y; }
    });
    const up = (e) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      if (p.role === "button") touchHeld.delete(p.id);
      if (p.role === "stick") stick = null;
      pointers.delete(e.pointerId);
    };
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
  }

  const anyKey = (action) => keyMap[action].some(k => held.has(k));
  return {
    bind,
    stickEnabled: false,
    get lastType() { return lastType; },
    get stick() { return stick; },
    set touchButtons(list) { touchButtons = list; },
    down(action) { return anyKey(action) || touchHeld.has(action); },
    pressed(action) { return keyMap[action].some(k => pressed.has(k)) || touchPressed.has(action); },
    axis() {
      let x = (anyKey("right") ? 1 : 0) - (anyKey("left") ? 1 : 0);
      let y = (anyKey("down") ? 1 : 0) - (anyKey("up") ? 1 : 0);
      let analog = false;
      if (stick) {
        const dx = stick.x - stick.ox, dy = stick.y - stick.oy, d = Math.hypot(dx, dy);
        if (d > 8) { x = dx / Math.max(d, 40); y = dy / Math.max(d, 40); analog = d > 60; }
      }
      const len = Math.hypot(x, y);
      if (len > 1) { x /= len; y /= len; }
      return { x, y, strongStick: analog };
    },
    takeClicks() { const c = clicks; clicks = []; return c; },
    endFrame() { pressed.clear(); touchPressed.clear(); },
  };
})();
