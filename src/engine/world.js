// A room as a game world: walls, doorways, solid furniture, collision
// checks and path-finding (so cats walk around furniture through real
// openings). The house is a set of these, connected by exits.
window.LPK = window.LPK || {};

// Look up a nap/hiding spot by "room.spot" key.
LPK.getSpot = (key) => {
  const [room, id] = key.split(".");
  const r = LPK.rooms[room];
  const def = (r.restingSpots && r.restingSpots[id]) || (r.robertSpots && r.robertSpots[id]) || (r.evanSpots && r.evanSpots[id]) || (r.owenSpots && r.owenSpots[id]) || (r.joeSpots && r.joeSpots[id]);
  return Object.assign({ key, room, id, z: 0 }, def);
};

LPK.World = class World {
  constructor(roomId) {
    const T = LPK.config.tile;
    this.id = roomId;
    this.def = LPK.rooms[roomId];
    const d = this.def;
    this.T = T;
    this.width = d.cols * T;
    this.height = d.rows * T;
    this.floor = { x: T, y: d.wallRows * T, w: (d.cols - 2) * T, h: (d.rows - d.wallRows - 1) * T };
    this.solids = d.furniture.filter(f => f.solid).map(f => ({ x: f.x * T, y: f.y * T, w: f.w * T, h: f.h * T, f }));
    // Open doorways (only to rooms that exist in this build)
    this.doors = d.exits.map(ex => ({ ex, rect: this.doorRect(ex), open: !!(ex.to && LPK.rooms[ex.to] && LPK.rooms[ex.to].available) }));
    // Navigation grid
    this.grid = [];
    for (let y = 0; y < d.rows; y++) {
      const row = [];
      for (let x = 0; x < d.cols; x++) {
        const inFloor = x >= 1 && x < d.cols - 1 && y >= d.wallRows && y < d.rows - 1;
        const blocked = d.furniture.some(f => f.solid && x >= f.x && x < f.x + f.w && y >= f.y && y < f.y + f.h);
        row.push(inFloor && !blocked);
      }
      this.grid.push(row);
    }
  }

  doorRect(ex) {
    const T = this.T, d = this.def, depth = 14;
    if (ex.side === "back")  return { x: ex.x * T, y: d.wallRows * T - depth, w: ex.w * T, h: depth + 2 };
    if (ex.side === "front") return { x: ex.x * T, y: (d.rows - 1) * T - 2, w: ex.w * T, h: depth + 2 };
    if (ex.side === "right") return { x: (d.cols - 1) * T - 2, y: ex.y * T, w: depth + 2, h: ex.h * T };
    return { x: T - depth, y: ex.y * T, w: depth + 2, h: ex.h * T };
  }
  exit(id) { return this.def.exits.find(e => e.id === id); }

  // Where you appear when you come in through this exit
  entryPoint(exitId) {
    const ex = this.exit(exitId), T = this.T, d = this.def;
    if (ex.side === "back")  return { x: (ex.x + ex.w / 2) * T, y: d.wallRows * T + 10 };
    if (ex.side === "front") return { x: (ex.x + ex.w / 2) * T, y: (d.rows - 1) * T - 5 };
    if (ex.side === "right") return { x: (d.cols - 1) * T - 10, y: (ex.y + ex.h / 2) * T };
    return { x: T + 10, y: (ex.y + ex.h / 2) * T };
  }
  // Floor tile next to an exit (for cat path-finding)
  exitTile(exitId) {
    const ex = this.exit(exitId), d = this.def;
    if (ex.side === "back")  return [ex.x, d.wallRows];
    if (ex.side === "front") return [ex.x, d.rows - 2];
    if (ex.side === "right") return [d.cols - 2, ex.y + 1];
    return [1, ex.y + 1];
  }
  exitTo(roomId) { return this.def.exits.find(e => e.to === roomId); }

  inRect(px, py, r) { return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; }
  pointOpen(px, py) {
    const F = this.floor;
    if (px >= F.x && px <= F.x + F.w && py >= F.y && py <= F.y + F.h) return true;
    return this.doors.some(d => d.open && this.inRect(px, py, d.rect));
  }

  // Is a box (x,y,w,h in pixels) free of walls and solid furniture?
  boxFree(x, y, w, h) {
    if (!this.pointOpen(x, y) || !this.pointOpen(x + w, y) || !this.pointOpen(x, y + h) || !this.pointOpen(x + w, y + h)) return false;
    for (const s of this.solids) {
      if (x < s.x + s.w && x + w > s.x && y < s.y + s.h && y + h > s.y) return false;
    }
    return true;
  }

  // Which open doorway is Laura standing in (past the edge of the floor)?
  doorwayAt(px, py) {
    const F = this.floor;
    const outside = py < F.y - 4 || py > F.y + F.h + 4 || px < F.x - 4 || px > F.x + F.w + 4;
    if (!outside) return null;
    const d = this.doors.find(d => d.open && this.inRect(px, py, d.rect));
    return d ? d.ex : null;
  }

  zoneAt(px, py) {
    const T = this.T;
    const z = (this.def.zones || []).find(z => px >= z.x * T && px < (z.x + z.w) * T && py >= z.y * T && py < (z.y + z.h) * T);
    return z ? z.name : this.def.name;
  }

  walkable(tx, ty) { return !!(this.grid[ty] && this.grid[ty][tx]); }

  // A* on the tile grid. Returns a list of pixel waypoints (tile centers).
  path(fromPx, fromPy, toTx, toTy) {
    const T = this.T;
    let sx = Math.floor(fromPx / T), sy = Math.floor(fromPy / T);
    if (!this.walkable(sx, sy)) {
      let best = null, bd = 1e9;
      for (let y = 0; y < this.grid.length; y++) for (let x = 0; x < this.grid[0].length; x++) {
        if (!this.walkable(x, y)) continue;
        const d = (x - sx) ** 2 + (y - sy) ** 2;
        if (d < bd) { bd = d; best = [x, y]; }
      }
      if (!best) return [];
      [sx, sy] = best;
    }
    const key = (x, y) => y * 1000 + x;
    const open = [[sx, sy]], came = new Map(), g = new Map([[key(sx, sy), 0]]);
    const h = (x, y) => Math.abs(x - toTx) + Math.abs(y - toTy);
    const f = new Map([[key(sx, sy), h(sx, sy)]]);
    let guard = 0;
    while (open.length && guard++ < 4000) {
      open.sort((a, b) => f.get(key(...a)) - f.get(key(...b)));
      const [cx, cy] = open.shift();
      if (cx === toTx && cy === toTy) {
        const out = [];
        let k = key(cx, cy), cur = [cx, cy];
        while (cur) { out.unshift({ x: cur[0] * T + T / 2, y: cur[1] * T + T / 2 + 4 }); cur = came.get(k); k = cur && key(...cur); }
        return out;
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (!this.walkable(nx, ny)) continue;
        const ng = g.get(key(cx, cy)) + 1;
        if (ng < (g.get(key(nx, ny)) ?? 1e9)) {
          came.set(key(nx, ny), [cx, cy]); g.set(key(nx, ny), ng); f.set(key(nx, ny), ng + h(nx, ny));
          if (!open.some(o => o[0] === nx && o[1] === ny)) open.push([nx, ny]);
        }
      }
    }
    return [];
  }
};
