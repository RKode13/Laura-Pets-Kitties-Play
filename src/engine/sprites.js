// Character sprites (placeholder pixel art built from the reference photos
// and concept sheets). Each function returns a list of shapes for LPK.px.draw.
// When finished sprite sheets exist, these can be swapped for images.
window.LPK = window.LPK || {};

LPK.sprites = (() => {
  // ------------------------------------------------------------ LAURA
  // dir: "down" | "up" | "side" (side faces right; flip for left)
  function laura(pose, dir, frame = 0, opt = {}) {
    const C = LPK.characters.laura, outfit = C.outfits && C.outfits[(LPK.save && LPK.save.data.outfit) || "cozy"];
    const L = Object.assign({}, C.look, outfit ? { top: outfit.top, topDark: outfit.topDark, pants: outfit.pants, shoes: outfit.shoes } : {}), s = [];
    const r = (x, y, w, h, c, n) => s.push(["r", x, y, w, h, c, n]);
    const step = (pose === "walk" || pose === "run") ? frame % 4 : -1;
    const lift = step === 1 ? [1, 0] : step === 3 ? [0, 1] : [0, 0];

    if (pose === "lie") {                         // lying on the couch (head on the left)
      r(-16, -9, 9, 7, L.hairDark); r(-15, -10, 7, 3, L.hair);
      r(-11, -9, 6, 6, L.skin); r(-9, -7, 1, 1, L.eyes, 1); r(-7, -7, 1, 1, L.eyes, 1); r(-8, -5, 2, 1, L.lips, 1);
      r(-5, -9, 11, 6, L.top); r(6, -8, 10, 5, L.pants); r(16, -8, 2, 5, L.shoes);
      r(-3, -10, 6, 2, L.topDark);
      return s;
    }
    if (pose === "kneel") {                       // side view, kneeling, petting
      const pat = opt.pat || 0;                  // hand pat offset (0/1/2)
      r(-6, -2, 4, 2, L.shoes);                  // back foot
      r(-5, -6, 8, 4, L.pants);                  // folded legs
      r(-4, -16, 7, 10, L.top);                  // torso
      r(-6, -26, 6, 15, L.hairDark);             // hair down her back
      r(-2, -24, 6, 8, L.skin);                  // face
      r(-5, -27, 8, 4, L.hair);                  // top of hair
      r(-5, -24, 3, 12, L.hair);
      r(2, -26, 3, 2, L.hair);
      r(3, -21, 1, 2, L.eyes, 1); r(4, -18, 1, 1, L.lips, 1);
      r(-6, -20, 1, 4, L.hairLight, 1);
      r(1, -14 + pat, 7, 2, L.top);              // reaching arm
      r(8, -14 + pat, 2, 2, L.skin);             // hand
      return s;
    }

    if (dir === "side") {
      const swing = step === 1 ? 1 : step === 3 ? -1 : 0;
      r(-4, -27, 6, 16, L.hairDark);
      r(-3, -15, 6, 9, L.top);
      if (step === 1 || step === 3) {
        r(-3 + swing, -6, 2, 5, L.pants); r(1 - swing, -6, 2, 5, L.pants);
        r(-3 + swing, -1, 3, 1, L.shoes); r(1 - swing, -1, 3, 1, L.shoes);
      } else {
        r(-2, -6, 2, 5, L.pants); r(0, -6, 2, 5, L.pants);
        r(-2, -1, 3, 1, L.shoes); r(0, -1, 3, 1, L.shoes);
      }
      r(-1, -25, 6, 8, L.skin);
      r(-4, -28, 8, 4, L.hair);
      r(-5, -26, 4, 14, L.hair);
      r(2, -26, 3, 2, L.hair);
      if (pose === "reach") { r(1, -16, 7, 2, L.topDark); r(8, -16, 2, 2, L.skin); }
      else { r(-1 + swing, -15, 2, 8, L.topDark); r(-1 + swing, -7, 2, 2, L.skin); }
      r(3, -21, 1, 2, L.eyes, 1); r(4, -18, 1, 1, L.lips, 1); r(5, -22, 1, 1, L.skinShade, 1);
      r(-5, -22, 1, 5, L.hairLight, 1); r(-2, -27, 3, 1, L.hairLight, 1);
      return s;
    }

    // front ("down") and back ("up")
    const celebrate = pose === "celebrate";
    r(-6, -27, 12, 16, L.hairDark);                       // long hair behind
    r(-4, -15, 8, 9, L.top);                               // torso
    if (celebrate) { r(-7, -23, 2, 8, L.top); r(5, -23, 2, 8, L.top); r(-7, -25, 2, 2, L.skin); r(5, -25, 2, 2, L.skin); }
    else { r(-6, -15, 2, 8, L.top); r(4, -15, 2, 8, L.top); r(-6, -7, 2, 2, L.skin); r(4, -7, 2, 2, L.skin); }
    r(-3, -6 + 0, 3, 5 - lift[0], L.pants); r(0, -6, 3, 5 - lift[1], L.pants);
    r(-3, -1 - lift[0], 3, 1, L.shoes); r(0, -1 - lift[1], 3, 1, L.shoes);
    if (dir === "up") {
      r(-5, -28, 10, 18, L.hair);
      r(-6, -24, 12, 12, L.hair);
      r(-3, -27, 2, 12, L.hairLight, 1); r(2, -25, 1, 10, L.hairLight, 1);
      r(-5, -14, 1, 3, L.hairDark, 1); r(4, -13, 1, 3, L.hairDark, 1);
      return s;
    }
    r(-1, -17, 2, 2, L.skin);                             // neck
    r(-4, -25, 8, 8, L.skin);                             // face
    r(-5, -28, 10, 3, L.hair);
    r(-4, -26, 8, 2, L.hair); r(-4, -24, 2, 2, L.hair);   // side-swept bangs
    r(-6, -25, 2, 12, L.hair); r(4, -25, 2, 12, L.hair);  // locks over shoulders
    r(-2, -28, 3, 1, L.hairLight, 1); r(-6, -21, 1, 5, L.hairLight, 1); r(5, -19, 1, 5, L.hairLight, 1);
    if (opt.blink) { r(-2, -21, 1, 1, L.eyes, 1); r(1, -21, 1, 1, L.eyes, 1); }
    else { r(-2, -22, 1, 2, L.eyes, 1); r(1, -22, 1, 2, L.eyes, 1); }
    r(-1, -19, 2, 1, celebrate ? "#a03a40" : L.lips, 1);
    if (celebrate) r(-1, -18, 2, 1, "#a03a40", 1);
    r(-3, -20, 1, 1, "#eaa0a0", 1); r(2, -20, 1, 1, "#eaa0a0", 1);
    r(0, -14, 1, 1, L.buttons, 1); r(0, -12, 1, 1, L.buttons, 1);
    return s;
  }

  // ------------------------------------------------------------- CATS
  // pose: stand | walk | turbo | hop | sit | front | sleep
  // eyes: open | closed | happy | annoyed | stare
  function cat(look, pose, frame = 0, opt = {}) {
    const s = [];
    const r = (x, y, w, h, c, n) => s.push(["r", x, y, w, h, c, n]);
    const e = (x, y, rx, ry, c, n) => s.push(["e", x, y, rx, ry, c, n]);
    const D = "#2b2529";
    const eyes = opt.eyes || "open";
    const tailSway = opt.tailSway || 0;

    function tailUp(bx, by) {
      const pts = [[bx, by], [bx - 1, by - 2], [bx - 2, by - 4], [bx - 2 + tailSway, by - 6], [bx - 1 + tailSway, by - 8]];
      if (look.longTail) pts.push([bx + tailSway, by - 10]);
      pts.forEach(([x, y], i) => r(x, y, 2, 2, (look.tailStripe && i % 2) ? look.tailStripe : look.tail));
    }
    function headSide(hx, hy) {
      const ear = look.cap;
      r(hx - 3, hy - 4, 2, 2, ear); r(hx - 3, hy - 5, 1, 1, ear);
      r(hx + 2, hy - 4, 2, 2, ear); r(hx + 3, hy - 5, 1, 1, ear);
      e(hx, hy, 4, 3, look.body);
      r(hx - 3, hy - 3, 8, 2, look.cap, 1);
      if (look.capMid !== look.cap) r(hx - 2, hy - 1, 5, 1, look.capMid, 1);
      if (look.blaze) r(hx + 1, hy - 3, 1, 3, look.body, 1);
      if (look.muzzle) r(hx + 2, hy, 3, 2, look.muzzle, 1);
      r(hx - 2, hy - 4, 1, 1, look.earInner, 1); r(hx + 3, hy - 4, 1, 1, look.earInner, 1);
      if (eyes === "closed" || eyes === "happy") r(hx + 1, hy - 1, 2, 1, D, 1);
      else if (eyes === "annoyed" || opt.droopy) { r(hx + 2, hy - 1, 1, 1, look.eyes, 1); r(hx + 1, hy - 2, 3, 1, D, 1); }
      else r(hx + 2, hy - 1, 1, 1, look.eyes, 1);
      if (opt.bags) r(hx + 1, hy, 3, 1, "#8a6a9a", 1);                  // tired under-eye bags
      if (opt.shades && !(eyes === "closed")) { r(hx - 1, hy - 2, 5, 2, "#0e0e12", 1); r(hx + 3, hy - 2, 1, 1, "#7fc3f0", 1); }
      if (opt.yawn) { r(hx + 2, hy + 1, 3, 3, "#a03a50", 1); r(hx + 3, hy + 3, 1, 1, "#f07a8a", 1); }
      r(hx + 4, hy + 1, 1, 1, look.nose, 1);
      if (opt.chew) r(hx + 2, hy + 2, 3, 1, "#a04050", 1);
      if (opt.blep) r(hx + 3, hy + 2, 1, 2, "#f07a8a", 1);
    }
    function headFront(hx, hy) {
      const ear = look.cap;
      r(hx - 5, hy - 5, 3, 2, ear); r(hx - 5, hy - 6, 2, 1, ear); r(hx - 5, hy - 7, 1, 1, ear);
      r(hx + 3, hy - 5, 3, 2, ear); r(hx + 4, hy - 6, 2, 1, ear); r(hx + 5, hy - 7, 1, 1, ear);
      e(hx, hy, 5, 4, look.body);
      r(hx - 5, hy - 4, 11, 3, look.cap, 1);
      if (look.blaze) r(hx, hy - 4, 1, 4, look.body, 1);
      if (look.capMid !== look.cap) { r(hx - 4, hy - 1, 3, 1, look.capMid, 1); r(hx + 2, hy - 1, 3, 1, look.capMid, 1); }
      if (look.muzzle) { r(hx - 2, hy + 1, 5, 2, look.muzzle, 1); r(hx, hy - 1, 1, 2, look.muzzle, 1); }
      r(hx - 4, hy - 5, 1, 1, look.earInner, 1); r(hx + 4, hy - 5, 1, 1, look.earInner, 1);
      if (eyes === "stare" || eyes === "annoyed") {
        r(hx - 3, hy, 2, 1, look.eyes, 1); r(hx + 2, hy, 2, 1, look.eyes, 1);
        r(hx - 2, hy, 1, 1, D, 1); r(hx + 2, hy, 1, 1, D, 1);
        r(hx - 4, hy - 1, 3, 1, D, 1); r(hx + 2, hy - 1, 3, 1, D, 1);        // heavy flat lids
        r(hx - 1, hy + 3, 3, 1, "#5a4a4a", 1);                                // flat unimpressed mouth
      } else if (eyes === "closed" || eyes === "happy") {
        r(hx - 3, hy, 2, 1, D, 1); r(hx + 2, hy, 2, 1, D, 1);
      } else if (opt.dart) {
        // wide zoomie eyes, pupils flicking side to side
        r(hx - 4, hy - 2, 3, 3, look.eyes, 1); r(hx + 2, hy - 2, 3, 3, look.eyes, 1);
        const px = opt.dart > 0 ? 1 : 0;
        r(hx - 4 + px + (opt.dart > 0 ? 1 : 0), hy - 2, 1, 2, D, 1); r(hx + 2 + px + (opt.dart > 0 ? 1 : 0), hy - 2, 1, 2, D, 1);
      } else {
        r(hx - 3, hy - 1, 2, 2, look.eyes, 1); r(hx + 2, hy - 1, 2, 2, look.eyes, 1);
        r(hx - 2, hy - 1, 1, 2, D, 1); r(hx + 2, hy - 1, 1, 2, D, 1);
        if (opt.droopy) { r(hx - 4, hy - 1, 3, 1, D, 1); r(hx + 2, hy - 1, 3, 1, D, 1); }
      }
      if (opt.bags) { r(hx - 4, hy + 1, 3, 1, "#8a6a9a", 1); r(hx + 2, hy + 1, 3, 1, "#8a6a9a", 1); }
      if (opt.shades) { r(hx - 5, hy - 2, 11, 3, "#0e0e12", 1); r(hx - 3, hy - 2, 1, 1, "#7fc3f0", 1); r(hx + 3, hy - 2, 1, 1, "#7fc3f0", 1); }
      r(hx, hy + 1, 1, 1, look.nose, 1);
    }

    const L = look.legHeight || 4;
    if (pose === "sleep") {
      const breathe = frame % 2;
      e(0, -4 - breathe, 8, 4, look.body);
      (look.patches || []).forEach(p => r(p.x, p.y - 3 - breathe, p.w, p.h, p.c, 1));
      // tail wrapped around the front
      for (let i = 0; i < 6; i++) r(-7 + i * 2, -1, 2, 1, (look.tailStripe && i % 2) ? look.tailStripe : look.tail, 1);
      e(6, -5, 4, 3, look.body);
      r(3, -9, 2, 2, look.cap); r(8, -9, 2, 2, look.cap);
      r(3, -8, 7, 2, look.cap, 1);
      if (look.blaze) r(6, -8, 1, 2, look.body, 1);
      if (look.muzzle) r(7, -4, 3, 2, look.muzzle, 1);
      r(6, -5, 2, 1, D, 1);
      r(9, -4, 1, 1, look.nose, 1);
      return s;
    }
    if (pose === "front" || pose === "sitFront") {
      tailSway && r(5, -3, 4, 2, look.tail);
      r(5, -2, 5, 2, look.tail); if (look.tailStripe) r(7, -2, 1, 2, look.tailStripe, 1);
      e(0, -6, 6, 5, look.body);
      if (look.chest) r(-2, -9, 5, 6, look.chest, 1);
      r(-3, -2, 2, 2, look.paws || look.body); r(2, -2, 2, 2, look.paws || look.body);
      headFront(0, -14);
      return s;
    }
    if (pose === "sit") {
      tailUp(-6, -4);
      e(-2, -4, 5, 4, look.body);
      r(1, -11, 5, 8, look.body);
      if (look.chest) r(3, -9, 3, 5, look.chest, 1);
      r(2, -3, 2, 3, look.paws || look.body);
      if (opt.pawUp) { r(6, -10, 2, 4, look.paws || look.body); r(7, -11, 2, 2, look.paws || look.body); }   // paw raised: "more please?"
      else r(5, -3, 2, 3, look.paws || look.body);
      (look.patches || []).forEach(p => r(p.x + 2, p.y - 1, Math.min(p.w, 4), p.h, p.c, 1));
      headSide(4, -13);
      return s;
    }

    if (pose === "sprint") {                      // GQ Dash: fully stretched gallop
      const by = -(L + 2), ext = frame % 2 === 0;
      for (let i = 0; i < 6; i++) r(-16 + i * 2, by - 1, 2, 2, look.tail);
      if (ext) { r(-11, -L + 1, 4, 2, look.body); r(-12, -2, 3, 2, look.paws || look.body); r(8, -L + 1, 4, 2, look.body); r(10, -2, 3, 2, look.paws || look.body); }
      else { r(-4, -L, 2, L, look.bodyShade); r(1, -L, 2, L, look.body); if (look.paws) { r(-4, -1, 2, 1, look.paws, 1); r(1, -1, 2, 1, look.paws, 1); } }
      e(0, by, 10, 2, look.body);
      (look.patches || []).forEach(p => r(p.x, by + p.y + 1, p.w, p.h - 1, p.c, 1));
      if (look.chest) r(6, by - 1, 3, 3, look.chest, 1);
      headSide(11, by - 2);
      return s;
    }
    if (pose === "hunker") {                       // zoomie crouch: low, butt up and wiggling, looking up
      const wig = frame % 2;
      for (let i = 0; i < 6; i++) r(-15 + i * 2, -2 - (i < 2 ? (wig + i) : 0), 2, 2, (look.tailStripe && i % 2) ? look.tailStripe : look.tail);   // tail flicking low
      e(-4 + wig, -5, 5, 3, look.body);                                         // butt up
      e(2, -3, 7, 3, look.body);                                                // belly low to the floor
      r(-4, -2, 8, 1, look.bodyShade, 1);
      (look.patches || []).forEach(p => r(p.x, p.y - 1, p.w, p.h - 1, p.c, 1));
      r(5, -2, 2, 2, look.paws || look.body); r(8, -2, 2, 2, look.paws || look.body);   // front paws tucked
      headFront(8, -6);
      return s;
    }
    if (pose === "bellyUp") {                      // Royal Belly Rub invitation
      const wig = frame % 2;
      e(0, -5, 9, 4, look.body);
      r(-5, -6, 10, 3, look.chest || look.bodyShade, 1);                      // belly
      r(-7, -11 - wig, 2, 4, look.paws || look.body); r(-3, -10 + wig, 2, 3, look.paws || look.body);   // paws in the air
      r(3, -11 + wig, 2, 4, look.paws || look.body); r(6, -10 - wig, 2, 3, look.paws || look.body);
      for (let i = 0; i < 5; i++) r(-14 + i * 2, -3 + (i % 2), 2, 2, look.tail);
      headFront(9, -6);
      return s;
    }
    if (pose === "trash") {                        // standing up on hind legs, pawing
      const bob = frame % 2;
      r(-6, -5, 2, 4, look.tail); r(-7, -2, 2, 2, look.tailStripe || look.tail);
      r(-3, -3, 2, 3, look.body); r(1, -3, 2, 3, look.bodyShade);
      e(0, -10, 4, 7, look.body);
      (look.patches || []).forEach(p => r(-3, -15, 5, 6, p.c, 1));
      r(3, -18 - bob, 5, 2, look.paws || look.body); r(3, -15 + bob, 5, 2, look.paws || look.body);
      headSide(2, -21);
      return s;
    }

    // stand / walk / turbo / hop / eat / prep (side view, facing right)
    const by = -(L + 3) + (pose === "prep" ? 2 : 0);
    const cycles = [[0, 0, 0, 0], [1, -1, -1, 1], [0, 0, 0, 0], [-1, 1, 1, -1]];
    const off = (pose === "walk" || pose === "turbo") ? cycles[frame % 4] : [0, 0, 0, 0];
    const lift = pose === "turbo" ? (frame % 2) : 0;
    tailUp(-9 + (pose === "prep" ? (frame % 2) : 0), by - 1 - (pose === "prep" ? 2 : 0));
    [[-7, 0], [-4, 1], [3, 2], [6, 3]].forEach(([x, i]) => {
      const c = (i === 1 || i === 2) ? look.bodyShade : look.body;
      const h = L - ((i % 2) === lift ? 0 : (pose === "turbo" ? 1 : 0));
      r(x + off[i], -h, 2, h, c);
      if (look.paws) r(x + off[i], -1, 2, 1, look.paws, 1);
    });
    e(0, by, 8, 3, look.body);
    r(-5, by + 2, 10, 1, look.bodyShade, 1);
    (look.patches || []).forEach(p => r(p.x, by + p.y, p.w, p.h, p.c, 1));
    if (look.chest) r(5, by - 1, 3, 4, look.chest, 1);
    if (pose === "eat") headSide(9, by + 1 + (frame % 2));
    else headSide(8, by - 3);
    return s;
  }

  // ----------------------------------------------------------- ROBERT
  // Taller, longer proportions (approved sheet). pose: stand | walk | sit | sleep
  // dir: down | up | side.  opt: { casual, shades, briefcase, glasses }
  function robert(dir = "down", frame = 0, opt = {}) {
    const R = LPK.characters.robert.look, C = LPK.characters.robert.casual, s = [];
    const r = (x, y, w, h, c, n) => s.push(["r", x, y, w, h, c, n]);
    const pose = opt.pose || (frame >= 0 && opt.walking ? "walk" : "stand");
    const step = pose === "walk" ? frame % 4 : 0, sw = step === 1 ? 1 : step === 3 ? -1 : 0;
    const top = opt.casual ? C.hoodie : R.suit, topD = opt.casual ? C.hoodieDark : R.suitLight;
    const legs = opt.casual ? C.jeans : R.suit, shoes = opt.casual ? C.sneakers : R.shoes;
    const head = (hx, hy, side) => {
      r(hx - 4, hy - 9, 8, 10, R.skin);
      r(hx - 4, hy - 11, 8, 3, R.hair); r(hx - 4, hy - 9, 1, 3, R.hairDark, 1); if (!side) r(hx + 3, hy - 9, 1, 3, R.hairDark, 1);
      if (dir === "up" && !side) { r(hx - 4, hy - 11, 8, 9, R.hair); return; }
      r(hx - 4, hy - 3, 8, 3, R.beard); r(hx - 3, hy, 6, 1, R.beard);
      const ex = side ? [hx + 1] : [hx - 3, hx + 2];
      if (opt.sleeping) ex.forEach(x => r(x, hy - 6, 2, 1, "#4a3a3a", 1));
      else if (opt.shades) r(hx - 4, hy - 7, 8, 2, "#141418", 1);
      else ex.forEach(x => r(x, hy - 7, 1, 1, "#2a2a2a", 1));
      if (opt.glasses && !opt.shades && !opt.sleeping) { r(hx - 4, hy - 8, 8, 1, "#2a2a2a", 1); }
      r(side ? hx + 1 : hx - 1, hy - 2, 2, 1, "#a0605a", 1);
    };
    const chest = (cx, y) => {
      if (opt.casual) { r(cx - 2, y, 4, 2, C.hoodieDark, 1); r(cx - 3, y + 6, 6, 3, C.hoodieDark, 1); return; }
      r(cx - 2, y, 4, 6, R.shirt, 1); r(cx - 1, y, 2, 9, R.tie, 1); r(cx - 1, y + 2, 2, 1, R.tieStripe, 1); r(cx - 1, y + 5, 2, 1, R.tieStripe, 1);
    };
    if (pose === "lie") {
      // asleep in bed under a gray blanket, head on the pillow (head to the left)
      r(-20, -14, 10, 6, "#f2f0ec");                              // pillow
      r(-18, -19, 8, 9, R.skin); r(-18, -20, 8, 3, R.hair); r(-18, -13, 8, 3, R.beard);
      r(-16, -16, 2, 1, "#4a3a3a", 1); r(-13, -16, 2, 1, "#4a3a3a", 1);   // closed eyes
      r(-10, -16, 32, 10, "#6e6e78"); r(-10, -16, 32, 2, "#84848e");       // blanket over him
      r(-10, -12, 32, 1, "#5e5e68", 1); r(18, -14, 4, 8, "#5e5e68", 1);
      return s;
    }
    if (pose === "sit" || pose === "sleep") {
      // sitting, facing the room
      r(-6, -12, 5, 10, legs); r(1, -12, 5, 10, legs); r(-6, -3, 5, 3, shoes); r(1, -3, 5, 3, shoes);
      r(-7, -30, 14, 19, top); r(-9, -28, 2, 13, top); r(7, -28, 2, 13, top);
      r(-9, -16, 2, 2, R.skin); r(7, -16, 2, 2, R.skin);
      chest(0, -30);
      const tilt = pose === "sleep" ? 2 : 0;
      head(tilt, -32 + tilt, false);
      return s;
    }
    if (dir === "side") {
      r(-3 + sw * 2, -16, 4, 15, legs); r(-1 - sw * 2, -16, 4, 15, legs);
      r(-3 + sw * 2, -1, 6, 1, shoes); r(-1 - sw * 2, -1, 6, 1, shoes);
      r(-5, -33, 10, 18, top);
      r(-1 + sw, -32, 3, 15, topD); r(-1 + sw, -17, 3, 2, R.skin);
      if (opt.briefcase) { r(1 + sw, -15, 8, 6, "#6a3a1e"); r(3 + sw, -16, 4, 1, "#4a2a12"); }
      if (!opt.casual) { r(3, -33, 2, 6, R.shirt, 1); r(4, -32, 1, 7, R.tie, 1); }
      head(0, -35, true);
      return s;
    }
    // front / back
    r(-5 + sw, -16, 4, 15, legs); r(1 - sw, -16, 4, 15, legs);
    r(-6 + sw, -1, 5, 1, shoes); r(1 - sw, -1, 5, 1, shoes);
    r(-7, -33, 14, 18, top);
    r(-9, -32, 2, 15, top); r(7, -32, 2, 15, top);
    r(-9, -17, 2, 2, R.skin); r(7, -17, 2, 2, R.skin);
    if (opt.briefcase) { r(8, -16, 7, 6, "#6a3a1e"); r(10, -17, 3, 1, "#4a2a12"); }
    if (dir !== "up") chest(0, -33);
    r(-1, -35, 2, 2, R.skin);
    head(0, -35, false);
    return s;
  }

  // ------------------------------------------------------------ THE CLOWN
  // The back room's life-size clown decoration (from the photos): messy pink
  // hair, cracked white mask with a squinty smile, blue brows, red nose and
  // cheeks, toothy grin, ruffled tan collar with pink tulle, white-and-blue
  // striped jumpsuit with grime, yellow pom-poms, big pink shoes, metal stand.
  // opt: { turn: head turn -2..2, glow: red eyes, talk: mouth open }
  function clown(opt = {}) {
    const s = [];
    const r = (x, y, w, h, c, n) => s.push(["r", x, y, w, h, c, n]);
    const e = (x, y, rx, ry, c, n) => s.push(["e", x, y, rx, ry, c, n]);
    const W = "#efe9ec", B = "#9ccbe6", GR = "#cbbfc6", P = "#e8769a", PD = "#c9587e", SK = "#f3eee6";
    const SHOE = "#e2566c", TAN = "#d9b46c", SPOT = "#8a4a3c", TUL = "#f27aa2", YEL = "#f4d25e", HAND = "#f1ede7";
    // black metal stand
    r(-15, -1, 30, 1, "#1c1c20", 1); r(-15, -3, 2, 3, "#1c1c20", 1); r(13, -3, 2, 3, "#1c1c20", 1);
    // big pink shoes
    e(-7, -3, 5, 2, SHOE); e(7, -3, 5, 2, SHOE);
    r(-10, -5, 3, 1, "#f39aa8", 1); r(4, -5, 3, 1, "#f39aa8", 1);
    // striped legs with jagged cuffs
    r(-9, -22, 7, 17, W); r(2, -22, 7, 17, W);
    for (let i = 0; i < 3; i++) { r(-8 + i * 3, -22, 1, 15, B, 1); r(3 + i * 3, -22, 1, 15, B, 1); }
    for (let i = 0; i < 4; i++) { r(-10 + i * 2, -7, 1, 2, i % 2 ? B : W, 1); r(2 + i * 2, -7, 1, 2, i % 2 ? B : W, 1); }
    r(-7, -15, 2, 2, GR, 1); r(5, -12, 2, 2, GR, 1);
    // jumpsuit torso
    r(-9, -40, 18, 20, W);
    for (let i = 0; i < 6; i++) r(-8 + i * 3, -40, 1, 19, B, 1);
    for (let i = 0; i < 6; i++) r(-9 + i * 3, -20, 2, i % 2 ? 2 : 1, W, 1);   // jagged hem
    r(-6, -34, 3, 2, GR, 1); r(3, -27, 3, 2, GR, 1); r(-4, -24, 2, 1, GR, 1);  // grime
    // two yellow tulle pom-poms
    e(0, -35, 2, 2, YEL); e(0, -28, 2, 2, YEL);
    // arms: one hand forward, one raised palm-up
    r(-12, -39, 4, 10, W); r(-11, -39, 1, 10, B, 1); r(-12, -29, 3, 3, HAND);
    r(9, -39, 7, 4, W); r(11, -39, 1, 4, B, 1); r(14, -39, 1, 4, B, 1);
    r(16, -41, 3, 3, HAND); r(18, -42, 1, 1, HAND, 1);
    // ruffled tan collar with pink tulle
    e(0, -41, 11, 3, TAN);
    r(-10, -39, 20, 1, TUL, 1);
    r(-3, -41, 2, 1, SPOT, 1); r(2, -42, 1, 1, SPOT, 1); r(-6, -40, 1, 1, SPOT, 1); r(5, -40, 1, 1, SPOT, 1);
    // messy pink hair (behind the head)
    const t = opt.turn || 0;
    e(t, -50, 8, 6, PD);
    r(t - 8, -50, 2, 9, P); r(t + 6, -50, 2, 9, P); r(t - 9, -47, 1, 6, PD, 1); r(t + 8, -47, 1, 6, PD, 1);
    r(t - 6, -57, 2, 2, P); r(t - 2, -58, 2, 2, P); r(t + 3, -57, 2, 2, P); r(t - 4, -56, 8, 2, P);
    // shaggy, messy strands sticking out
    r(t - 10, -53, 3, 1, P, 1); r(t - 11, -50, 2, 1, PD, 1); r(t + 8, -54, 3, 1, P, 1); r(t + 9, -51, 2, 1, PD, 1);
    r(t - 8, -58, 2, 1, PD, 1); r(t + 6, -58, 2, 1, PD, 1); r(t - 3, -60, 1, 2, P, 1); r(t + 2, -60, 1, 2, P, 1);
    r(t - 9, -42, 1, 2, PD, 1); r(t + 8, -42, 1, 2, PD, 1);
    // the mask splits apart (opt.split 0..8 px) to reveal the scary face inside;
    // opt.jaw 0..3 drops its jaw like an animatronic, opt.pulse flickers the eyes
    const sp = opt.split || 0, jaw = opt.jaw || 0;
    if (sp > 0) {
      const FL = "#5c2420", FL2 = "#7a3028", DK = "#170505", TH = "#efe2a2", TH2 = "#c9b46a";
      e(t, -50, 6, 7, FL, 1); e(t, -52, 5, 4, FL2, 1);                             // rotten red flesh
      r(t - 5, -45, 10, 1 + jaw, FL, 1); e(t, -44 + jaw, 4, 2, FL, 1);              // chin drops with the jaw
      r(t - 5, -56, 10, 1, "#2e0c0a", 1); r(t - 4, -57, 2, 1, "#2e0c0a", 1); r(t + 2, -57, 2, 1, "#2e0c0a", 1); // angry brow
      e(t - 3, -53, 2, 1.5, DK, 1); e(t + 3, -53, 2, 1.5, DK, 1);                  // sunken sockets
      const eye = opt.pulse ? "#ffe04a" : "#ff2020";
      r(t - 3, -53, 1, 1, eye, 1); r(t + 3, -53, 1, 1, eye, 1);                    // glowing pupils
      r(t - 4, -54, 1, 1, "#ff5a2a", 1); r(t + 4, -54, 1, 1, "#ff5a2a", 1);
      r(t - 1, -50, 1, 1, DK, 1); r(t + 1, -50, 1, 1, DK, 1);                      // skull nose
      r(t - 4, -49, 1, 1, "#3a1010", 1); r(t + 4, -49, 1, 1, "#3a1010", 1);        // creases
      // the mouth: upper teeth fixed, lower jaw moves
      r(t - 4, -48, 9, 1, TH, 1);
      for (let k = 0; k < 5; k++) r(t - 4 + k * 2, -47, 1, 1, TH2, 1);
      r(t - 4, -47, 9, jaw + 1, DK, 1);                                           // gaping throat
      if (jaw >= 2) r(t - 1, -46 + jaw - 1, 3, 1, "#a8303a", 1);                   // tongue
      r(t - 3, -47, 1, 2, TH, 1); r(t + 3, -47, 1, 2, TH, 1);                      // upper fangs
      r(t - 4, -46 + jaw, 9, 1, TH, 1);                                            // lower teeth ride the jaw
      r(t - 2, -47 + jaw, 1, 1, TH, 1); r(t + 2, -47 + jaw, 1, 1, TH, 1);          // lower fangs
      r(t - 6, -51, 1, 3, "#3a1010", 1); r(t + 6, -51, 1, 3, "#3a1010", 1);        // hinge seams
    }
    // the two halves of the cracked white mask (swing out to the sides when open)
    const L = t - sp, Rr = t + sp;                                                  // left / right half offsets
    e(L - 2, -50, 3, 6, SK); e(Rr + 2, -50, 3, 6, SK);
    if (sp > 0) { r(L - 1, -55, 1, 10, "#c9c1b6", 1); r(Rr + 1, -55, 1, 10, "#c9c1b6", 1); }   // mask inner edge
    r(L - 4, -54, 3, 1, "#4a7ad8", 1); r(Rr + 1, -54, 3, 1, "#4a7ad8", 1);          // blue brows
    if (opt.glow && !sp) { r(L - 3, -52, 2, 1, "#ff3a3a", 1); r(Rr + 2, -52, 2, 1, "#ff3a3a", 1); }
    else { r(L - 3, -52, 2, 1, "#3a2a2a", 1); r(Rr + 2, -52, 2, 1, "#3a2a2a", 1); } // squinty smiling eyes
    r(L - 1, -50, 1, 2, "#c8404a", 1); r(Rr, -50, 1, 2, "#c8404a", 1);              // red nose (split in two)
    r(L - 5, -49, 2, 1, "#e0606a", 1); r(Rr + 3, -49, 2, 1, "#e0606a", 1);          // red cheeks
    const open = sp ? 0 : (opt.mouth || 0);                                          // friendly talking mouth flaps
    r(L - 4, -47, 4, 1, "#b83a4a", 1); r(Rr, -47, 4, 1, "#b83a4a", 1);              // big toothy grin
    if (open) r(L - 3, -46, 6, open, "#3a1018", 1);
    r(L - 3, -46, 3, 1, "#f8f6f0", 1); r(Rr, -46, 3, 1, "#f8f6f0", 1);
    r(L - 4, -45 + open, 4, 1, "#b83a4a", 1); r(Rr, -45 + open, 4, 1, "#b83a4a", 1);
    if (!open) { r(L - 1, -46, 1, 1, "#d8d0c8", 1); r(Rr + 1, -46, 1, 1, "#d8d0c8", 1); }
    r(L - 1, -55, 1, 2, "#8a8078", 1); r(Rr + 1, -53, 1, 1, "#8a8078", 1); r(L - 2, -48, 1, 1, "#8a8078", 1);  // cracks
    return s;
  }

  // ------------------------------------------------------------ EVAN
  // Kid-sized (shorter than Laura and Robert). opt: { outfit, pose: stand/walk/sit/lie, sleeping }
  function evan(dir = "down", frame = 0, opt = {}) {
    const E = LPK.characters.evan.look, O = LPK.characters.evan.outfits[opt.outfit] || LPK.characters.evan.outfits.sweater, s = [];
    const r = (x, y, w, h, c, n) => s.push(["r", x, y, w, h, c, n]);
    const pose = opt.pose || "stand";
    const step = pose === "walk" ? frame % 4 : 0, sw = step === 1 ? 1 : step === 3 ? -1 : 0;
    const dots = O.dots || [];
    const head = (hx, hy, side) => {
      // hy = bottom of the chin
      if (O.cap) { r(hx - 5, hy - 11, 10, 3, "#1c1c24"); r(hx - 5, hy - 8, 10, 1, "#0e0e12", 1); r(hx - 1, hy - 10, 2, 1, "#d8b04a", 1); }
      if (dir === "up" && !side) {
        r(hx - 4, hy - 8, 8, 8, E.skin); r(hx - 5, hy - 5, 1, 2, E.skin); r(hx + 4, hy - 5, 1, 2, E.skin);
        if (!O.cap) r(hx - 4, hy - 10, 8, 3, E.hair);
        r(hx - 4, hy - 8, 8, 7, E.hair); r(hx - 4, hy - 3, 8, 2, E.hairDark, 1);          // short faded back
        return;
      }
      r(hx - 4, hy - 8, 8, 8, E.skin);
      if (side) { r(hx - 2, hy - 5, 1, 2, E.skinDark, 1); }
      else { r(hx - 5, hy - 5, 1, 2, E.skin); r(hx + 4, hy - 5, 1, 2, E.skin); }
      if (!O.cap) {
        r(hx - 4, hy - 10, 8, 3, E.hair); r(hx, hy - 11, 3, 1, E.hair);                  // swept-up top
        r(hx - 1, hy - 10, 3, 1, E.hairLight, 1);
        if (side) { r(hx - 4, hy - 8, 3, 5, E.hair); r(hx - 4, hy - 4, 2, 2, E.hairDark, 1); r(hx + 1, hy - 8, 3, 1, E.hair, 1); }
        else { r(hx - 4, hy - 8, 5, 1, E.hair, 1); r(hx - 4, hy - 7, 2, 1, E.hair, 1);   // side-swept fringe
               r(hx - 4, hy - 8, 1, 3, E.hairDark, 1); r(hx + 3, hy - 8, 1, 2, E.hairDark, 1); }   // short sides
      }
      const shut = opt.sleeping;
      if (side) {
        r(hx + 2, hy - 5, 1, 1, shut ? "#7a5a4a" : E.eyes, 1);
        r(hx + 2, hy - 3, 1, 1, E.freckles, 1);
        r(hx + 1, hy - 2, 3, 1, E.mouth, 1); r(hx + 2, hy - 2, 1, 1, "#fffaf0", 1);
        if (O.mustache) r(hx + 1, hy - 3, 3, 1, "#7a4a26", 1);
        return;
      }
      if (shut) { r(hx - 3, hy - 5, 2, 1, "#7a5a4a", 1); r(hx + 1, hy - 5, 2, 1, "#7a5a4a", 1); }
      else { r(hx - 3, hy - 5, 1, 1, E.eyes, 1); r(hx + 2, hy - 5, 1, 1, E.eyes, 1); }
      r(hx - 3, hy - 3, 1, 1, E.freckles, 1); r(hx + 2, hy - 3, 1, 1, E.freckles, 1); r(hx - 1, hy - 4, 1, 1, E.freckles, 1);
      if (!shut) { r(hx - 2, hy - 2, 4, 1, E.mouth, 1); r(hx - 1, hy - 2, 2, 1, "#fffaf0", 1); }  // the big gap-tooth grin
      if (O.mustache) { r(hx - 3, hy - 3, 2, 1, "#7a4a26", 1); r(hx + 1, hy - 3, 2, 1, "#7a4a26", 1); r(hx - 1, hy - 3, 2, 1, "#7a4a26", 1); }
    };
    const chest = (y, back) => {
      dots.forEach((c, i) => { r(-3 + (i * 4) % 7, y + 2 + i * 3, 1, 1, c, 1); r(2 - (i * 3) % 5, y + 5 + i * 2, 1, 1, c, 1); });
      if (back) { if (O.backpack) { r(-4, y + 1, 8, 8, "#2a8ae8"); r(-3, y + 2, 6, 1, "#5ab0f8", 1); r(-4, y + 6, 8, 1, "#1a5ab0", 1); } if (O.suspenders) { r(-3, y, 1, 10, "#6a6a72", 1); r(2, y, 1, 10, "#6a6a72", 1); } return; }
      if (O.collar === "henley") { r(-1, y, 2, 3, O.topDark, 1); r(0, y + 2, 1, 1, "#c9a26a", 1); }
      if (O.collar === "zip") { r(-2, y - 1, 4, 2, O.topDark, 1); r(0, y, 1, 4, "#b89a4a", 1); }
      if (O.collar === "polo") { r(-2, y, 1, 2, O.topDark, 1); r(1, y, 1, 2, O.topDark, 1); }
      if (O.collar === "pj") r(-2, y, 4, 1, "#d8434a", 1);
      if (O.collar === "suit") { r(-1, y, 2, 6, "#f4f2ee", 1); r(0, y + 1, 1, 5, "#ece8d8", 1); r(2, y + 3, 2, 1, "#f4f2ee", 1); }
      if (O.backpack) { r(-4, y, 1, 9, "#2a8ae8", 1); r(3, y, 1, 9, "#2a8ae8", 1); }
      if (O.suspenders) { r(-3, y, 1, 10, "#6a6a72", 1); r(2, y, 1, 10, "#6a6a72", 1); }
    };
    const arm = (x, y, len) => {
      if (O.shortSleeves) { r(x, y, 2, 3, O.top); r(x, y + 3, 2, len - 1, E.skin); }
      else { r(x, y, 2, len, O.top); r(x, y + len, 2, 2, E.skin); }
    };
    // things he's holding: paper + crayon, iPad, squishy, toy plane, pasta, fruit
    const hold = (cx, cy) => {
      const k = opt.hold, f = frame % 2;
      if (k === "paper") { r(cx - 4, cy - 1, 8, 6, "#fbfaf2"); r(cx - 3, cy, 3, 1, "#e84a5a", 1); r(cx, cy + 2, 3, 1, "#4a8ae8", 1); r(cx - 2, cy + 3, 2, 1, "#4ac06a", 1); r(cx + 3 - f, cy - 2, 1, 3, "#f2b43a", 1); }
      if (k === "ipad")  { r(cx - 5, cy - 2, 10, 7, "#2a2a30"); r(cx - 4, cy - 1, 8, 5, f ? "#8ad8ff" : "#7fc8f0", 1); r(cx - 1 + f, cy + 1, 2, 2, "#fbfaf2", 1); r(cx - 3, cy + 2, 1, 1, "#ff7aa8", 1); }
      if (k === "squishy") { const q = f; s.push(["e", cx, cy + 1 + q, 3 + q, 3 - q, "#ffb0d8"]); r(cx - 2, cy, 1, 1, "#4a2a3a", 1); r(cx + 1, cy, 1, 1, "#4a2a3a", 1); r(cx - 1, cy + 2, 2, 1, "#e86a9a", 1); }
      if (k === "plane") { r(cx - 7, cy - 4, 14, 2, "#eef0f6"); r(cx - 1, cy - 7, 3, 8, "#4a8ae8"); r(cx - 7, cy - 6, 2, 2, "#e84a5a"); r(cx + 6, cy - 4, 1, 2, "#9ab0d0", 1); }
      if (k === "pasta") { r(cx - 4, cy + 1, 8, 3, "#f4f2ee"); r(cx - 3, cy - 1, 6, 2, "#f2c94c"); r(cx - 1, cy - 1, 2, 1, "#d8434a", 1); }
      if (k === "fruit") { r(cx - 4, cy + 1, 8, 3, "#f4f2ee"); s.push(["e", cx - 2, cy, 1.5, 1.5, "#e84a5a"]); s.push(["e", cx + 1, cy, 1.5, 1.5, "#f2b43a"]); s.push(["e", cx, cy - 1, 1.5, 1.5, "#6ac04a"]); }
    };
    const leg = (x, y, h) => {
      if (O.shorts) { r(x, y, 3, 4, O.pants); r(x, y + 4, 3, h - 4, E.skin); }
      else r(x, y, 3, h, O.pants);
    };
    if (pose === "lie") {
      // tucked into bed, head on the pillow (head to the left)
      r(-18, -12, 9, 5, "#f2f0ec");
      r(-17, -16, 7, 7, E.skin); r(-17, -17, 7, 3, E.hair); r(-17, -14, 1, 2, E.hairDark, 1);
      r(-15, -12, 2, 1, "#7a5a4a", 1); r(-12, -12, 2, 1, "#7a5a4a", 1);
      r(-13, -10, 1, 1, E.freckles, 1);
      r(-10, -14, 26, 9, "#e88aa8"); r(-10, -14, 26, 2, "#f6b4c8"); r(-10, -10, 26, 1, "#c86a8a", 1);
      return s;
    }
    if (pose === "sit") {
      leg(-4, -8, 6); leg(1, -8, 6);
      r(-4, -2, 3, 2, O.feet[0]); r(1, -2, 3, 2, O.feet[1]);
      r(-5, -18, 10, 10, O.top); arm(-7, -17, 7); arm(5, -17, 7);
      chest(-18, false);
      r(-1, -19, 2, 1, E.skin);
      head(0, -19, false);
      if (opt.hold) hold(0, -11);
      return s;
    }
    if (dir === "side") {
      leg(-2 + sw * 2, -10, 9); leg(-1 - sw * 2, -10, 9);
      r(-2 + sw * 2, -1, 4, 1, O.feet[0]); r(-1 - sw * 2, -1, 4, 1, O.feet[1]);
      if (O.backpack) { r(-6, -19, 3, 8, "#2a8ae8"); r(-6, -15, 3, 1, "#1a5ab0", 1); }
      r(-3, -20, 7, 11, O.top);
      dots.forEach((c, i) => r(-1 + i, -17 + i * 3, 1, 1, c, 1));
      if (O.suspenders) r(0, -20, 1, 10, "#6a6a72", 1);
      arm(-1 + sw, -19, 7);
      r(-1, -21, 2, 1, E.skin);
      head(0, -21, true);
      if (opt.hold) hold(opt.hold === "plane" ? 6 : 3, opt.hold === "plane" ? -18 : -12);
      return s;
    }
    // front / back
    leg(-4 + sw, -10, 9); leg(1 - sw, -10, 9);
    r(-4 + sw, -1, 3, 1, O.feet[0]); r(1 - sw, -1, 3, 1, O.feet[1]);
    r(-5, -20, 10, 11, O.top);
    arm(-7, -19, 7); arm(5, -19, 7);
    chest(-20, dir === "up");
    r(-1, -21, 2, 1, E.skin);
    head(0, -21, false);
    if (opt.hold && dir !== "up") hold(0, opt.hold === "plane" ? -22 : -13);
    return s;
  }

  return { laura, cat, robert, clown, evan };
})();
