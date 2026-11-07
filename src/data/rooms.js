// =====================================================================
//  ROOMS — layout of the house, measured in floor tiles (1 tile = 16 px).
//  Based on the reference photos. Real dimensions and exact furniture
//  positions are NOT confirmed, so everything here is editable:
//  move a piece by changing its x / y, resize it with w / h.
//
//  Grid: x = column (left -> right), y = row (top -> bottom).
//  The first `wallRows` rows are the back wall. Column 0 is the left wall,
//  the last column is the right wall, the last row is the front wall.
//
//  Nap / hiding spots: x/y in tiles (fractions ok), z = height off the
//  floor in pixels, approach = the floor tile a cat walks to first,
//  hidden = an obscure spot (searchable; counts for "The 22-Hour Nap").
// =====================================================================
window.LPK = window.LPK || {};

LPK.rooms = {
  // ------------------------------------------------------------ LIVING ROOM
  livingRoom: {
    name: "Living Room",
    available: true,
    cols: 22, rows: 15, wallRows: 3,
    floor: "laminate",
    walls: { back: "#b9b6b3", left: "#a596c2", right: "#b0adaa", front: "#9c9895" },
    zones: [{ name: "Front Entry", x: 1, y: 10, w: 5, h: 4 }],

    wallDecor: [
      { kind: "tv",          x: 1.3, w: 3.4 },
      { kind: "hallwayDoor", x: 5,   w: 2 },
      { kind: "kitchenDoor", x: 7,   w: 2 },
      { kind: "photoWall",   x: 11,  w: 10 },
      { kind: "thermostat",  x: 10,  w: 1 },
    ],
    furniture: [
      { id: "tvStand",    kind: "tvStand",         x: 1,  y: 3,  w: 4,  h: 1, solid: true },
      { id: "floorLamp",  kind: "floorLamp",       x: 9,  y: 3,  w: 1,  h: 1, solid: true, light: true },
      { id: "sideTable",  kind: "sideTable",       x: 10, y: 3,  w: 1,  h: 1, solid: true },
      { id: "sectional",  kind: "sectionalLong",   x: 11, y: 3,  w: 10, h: 2, solid: true },
      { id: "sectional2", kind: "sectionalReturn", x: 19, y: 5,  w: 2,  h: 5, solid: true },
      { id: "catTree",    kind: "catTree",         x: 1,  y: 6,  w: 2,  h: 2, solid: true },
      { id: "bench",      kind: "shoeBench",       x: 1,  y: 10, w: 1,  h: 3, solid: true },
      { id: "rug",        kind: "rug",             x: 5,  y: 6,  w: 12, h: 6, solid: false },
      { id: "doormat",    kind: "doormat",         x: 2,  y: 13, w: 2,  h: 1, solid: false },
      { id: "shoes1",     kind: "shoes",           x: 7,  y: 9,  w: 1,  h: 1, solid: false, variant: 0 },
      { id: "shoes2",     kind: "shoes",           x: 3,  y: 11, w: 1,  h: 1, solid: false, variant: 1 },
      { id: "shoes3",     kind: "shoes",           x: 14, y: 6,  w: 1,  h: 1, solid: false, variant: 2 },
    ],
    sideDecor: [
      { kind: "window", y: 4, h: 2 },
      { kind: "mirror", y: 9, h: 2 },
    ],
    exits: [
      { id: "frontDoor", label: "Front Door", side: "front", x: 2, w: 2, to: null, message: "Laura isn't going anywhere — the kitties need her!" },
      { id: "toKitchen", label: "Kitchen",    side: "back",  x: 7, w: 2, to: "kitchen", toExit: "toLiving" },
      { id: "toHallway", label: "Hallway",    side: "back",  x: 5, w: 2, to: "hallway", toExit: "toLiving" },
    ],
    restingSpots: {
      catTreeCubby:    { label: "the cat-tree cubby",   x: 2,    y: 7.9,  z: 23, approach: [3, 8],  hidden: true, clip: [1.6, 5.75, 0.85, 0.75] },
      catTreeTop:      { label: "the top of the cat tree", x: 2.5, y: 7.95, z: 65, approach: [3, 8],  high: true },
      sectionalCorner: { label: "the sectional corner", x: 19.6, y: 5.1,  z: 7,  approach: [18, 5] },
      sectionalSeat:   { label: "the sectional",        x: 14,   y: 5.0,  z: 7,  approach: [14, 5] },
      sectionalEnd:    { label: "the end of the sectional", x: 11.6, y: 5.0, z: 7, approach: [12, 5] },
      rugByLamp:       { label: "the rug by the lamp",  x: 9.5,  y: 6.6,  z: 0,  approach: [9, 6] },
      rugCenter:       { label: "the middle of the rug", x: 11,  y: 9.2,  z: 0,  approach: [11, 9] },
      underShoeBench:  { label: "under the shoe bench", x: 1.5,  y: 12.4, z: 0,  approach: [2, 12], hidden: true },
    },
    interactables: [
      { id: "restCouch", kind: "rest", label: "Rest on the couch", x: 15.5, y: 5.3, seat: { x: 15.5, y: 4.4 } },
    ],
    toys: [
      { id: "springBlue", kind: "spring", x: 8, y: 11, colors: ["#4a8ae8", "#7fc3f0"] },
    ],
    // Robert-only spots
    robertSpots: {
      frontDoorIn: { x: 3, y: 12.8, approach: [3, 12] },
      sofa:        { x: 16.5, y: 4.8, z: 6, approach: [16, 5], sit: true },
    },
    // Places CC likes to inspect on patrol
    pointsOfInterest: [[3, 13], [3, 4], [8, 3], [16, 11], [6, 12]],
    lauraStart: { x: 3, y: 12.6 },
  },

  // ------------------------------------------------------------ KITCHEN + DINING
  kitchen: {
    name: "Kitchen",
    available: true,
    cols: 22, rows: 15, wallRows: 3,
    floor: "tile",
    walls: { back: "#c9c4bc", left: "#bdb8b0", right: "#bdb8b0", front: "#a29d96" },
    zones: [{ name: "Dining Area", x: 14, y: 3, w: 7, h: 11 }],

    wallDecor: [
      { kind: "upperCabinets", x: 1,    w: 9 },
      { kind: "microwave",     x: 4,    w: 2 },
      { kind: "kitchenWindow", x: 10,   w: 2.5 },
      { kind: "slidingDoor",   x: 15.5, w: 3.5 },
      { kind: "wallPlates",    x: 19.4, w: 1.6 },
    ],
    furniture: [
      { id: "counter",   kind: "counterRun",    x: 1,  y: 3,  w: 12, h: 1, solid: true },
      { id: "fridge",    kind: "fridge",        x: 13, y: 3,  w: 2,  h: 2, solid: true },
      { id: "island",    kind: "island",        x: 4,  y: 7,  w: 4,  h: 2, solid: true },
      { id: "trash",     kind: "trashCan",      x: 9,  y: 7,  w: 1,  h: 1, solid: true },
      { id: "box",       kind: "cardboardBox",  x: 11, y: 8,  w: 1,  h: 1, solid: false },
      { id: "table",     kind: "diningTable",   x: 15, y: 7,  w: 4,  h: 3, solid: true },
      { id: "catTower",  kind: "catTower",      x: 19, y: 4,  w: 2,  h: 2, solid: true },
      { id: "kitMat",    kind: "kitchenMat",    x: 10, y: 4,  w: 2,  h: 1, solid: false },
      { id: "herBowl",   kind: "foodBowl",      x: 2,  y: 5,  w: 1,  h: 1, solid: false, owner: "marshmallow" },
      { id: "boysBowls", kind: "foodBowl",      x: 19, y: 11, w: 1,  h: 1, solid: false, owner: "boys" },
      { id: "lightBack", kind: "ceilingLight",  x: 7,  y: 7,  w: 1,  h: 1, solid: false, light: true },
    ],
    sideDecor: [],
    exits: [
      { id: "toLiving",   label: "Living Room", side: "front", x: 7, w: 2, to: "livingRoom", toExit: "toKitchen" },
      { id: "toBackRoom", label: "Back Room",   side: "right", y: 9, h: 3, to: "backRoom", toExit: "toKitchen" },
    ],
    // Things Laura can use (press Pet/Space next to them)
    interactables: [
      { id: "pantry",   kind: "pantry", label: "Treat cabinet", x: 1.5, y: 4 },
      { id: "herBowl",  kind: "bowl",   label: "Marshmallow's bowl", x: 2.5, y: 5.6, owner: "marshmallow" },
      { id: "boysBowls",kind: "bowl",   label: "the boys' bowls", x: 19.5, y: 11.6, owner: "boys" },
      { id: "trash",    kind: "trash",  label: "Trash can", x: 9.5, y: 8.3 },
    ],
    restingSpots: {
      kitchenMat:       { label: "the kitchen mat",      x: 10.8, y: 4.7,  z: 0,  approach: [11, 5] },
      underDiningTable: { label: "under the dining table", x: 16.5, y: 8.6, z: 0, approach: [16, 10], hidden: true },
      besideFridge:     { label: "beside the fridge",    x: 15.3, y: 4.6,  z: 0,  approach: [15, 5], hidden: true },
      catTowerTop:      { label: "the top of the cat tower", x: 20, y: 5.95, z: 71, approach: [18, 5], high: true },
      diningChair:      { label: "a dining chair",       x: 14.4, y: 8.4,  z: 9,  approach: [14, 9] },
      inBox:            { label: "the cardboard box",    x: 11.5, y: 8.9,  z: 0,  approach: [12, 9], box: true },
      atTrash:          { label: "the trash can",        x: 9.5,  y: 8.35, z: 0,  approach: [9, 8] },
      byBoysBowls:      { label: "the boys' bowls",      x: 18.6, y: 11.4, z: 0,  approach: [18, 11] },
      atHerBowl:        { label: "her bowl",             x: 3.2,  y: 5.6,  z: 0,  approach: [3, 5] },
    },
    toys: [
      { id: "springPink", kind: "spring", x: 13, y: 11, colors: ["#ff7aa8", "#ffd166"] },
    ],
    robertSpots: {
      counter: { x: 6.5, y: 4.6, approach: [6, 4] },
      guard:   { x: 4.4, y: 6.0, approach: [4, 6], guard: true },
    },
    pointsOfInterest: [[13, 5], [17, 5], [20, 10], [10, 9], [7, 13], [12, 6]],
    lauraStart: { x: 8, y: 12.6 },
  },

  // ------------------------------------------------------------ BACK ROOM
  backRoom: {
    name: "Back Room",
    available: true,
    cols: 20, rows: 14, wallRows: 3,
    floor: "laminate",
    walls: { back: "#c4c1bd", left: "#b4b1ad", right: "#b4b1ad", front: "#9f9b97" },
    zones: [],
    wallDecor: [
      { kind: "curtainDoor",  x: 0.6, w: 1.8 },
      { kind: "tvSmall",      x: 3.3, w: 2.4 },
      { kind: "brickChimney", x: 7,   w: 6 },
      { kind: "fireplaceArt", x: 8.4, w: 3.2 },
      { kind: "signFrame",    x: 5.9, w: 1.0 },
      { kind: "garageDoorway",x: 16,  w: 2 },
      { kind: "window",       x: 18.2,w: 1.4 },
    ],
    furniture: [
      { id: "tvCabinet",  kind: "tvCabinet",     x: 3,  y: 3, w: 3, h: 1, solid: true },
      { id: "fireplace",  kind: "brickFireplace",x: 7,  y: 3, w: 6, h: 1, solid: true },
      { id: "pinkChair",  kind: "pinkChair",     x: 14, y: 3, w: 2, h: 2, solid: true },
      { id: "lamp2",      kind: "floorLamp",     x: 13, y: 3, w: 1, h: 1, solid: true, light: true },
      { id: "fatCatMat",  kind: "fatCatMat",     x: 16, y: 3, w: 2, h: 1, solid: false },
      { id: "clownSwitch",kind: "clownSwitch",   x: 2,  y: 5, w: 1, h: 1, solid: true },
      { id: "tower2",     kind: "darkCatTower",  x: 18, y: 11, w: 1, h: 2, solid: true },
      { id: "clown",      kind: "clown",         x: 1,  y: 4, w: 1, h: 1, solid: true },
      { id: "rugBack",    kind: "rug",           x: 6,  y: 5, w: 8, h: 5, solid: false },
      { id: "snowman",    kind: "snowmanRug",    x: 3,  y: 8, w: 2, h: 2, solid: false },
      { id: "igloo",      kind: "catIgloo",      x: 15, y: 8, w: 2, h: 1, solid: false },
      { id: "tvTray",     kind: "tvTray",        x: 13, y: 6, w: 1, h: 1, solid: true },
      { id: "fireGlow",   kind: "ceilingLight",  x: 10, y: 4, w: 1, h: 1, solid: false, light: true },
    ],
    sideDecor: [],
    exits: [
      { id: "toKitchen",  label: "Kitchen",  side: "left",  y: 6, h: 3, to: "kitchen",  toExit: "toBackRoom" },
      { id: "toGarage",   label: "Garage",   side: "back",  x: 16, w: 2, to: "garage",   toExit: "toBackRoom" },
      { id: "toBasement", label: "Basement", side: "right", y: 8, h: 2, to: "basement", toExit: "toBackRoom", style: "stairsDown" },
      { id: "toEnsuite",  label: "Bathroom", side: "right", y: 4, h: 2, to: "ensuite",  toExit: "toBackRoom", style: "hallDoor" },
    ],
    interactables: [
      { id: "clownSwitch", kind: "clownSwitch", label: "Flip the clown's switch", x: 2.5, y: 6.4 },
    ],
    toys: [
      { id: "springRainbow", kind: "spring", x: 16.5, y: 11, colors: ["#e8436f", "#ffd166", "#4ac06a", "#4a8ae8"], favorite: true },
    ],
    restingSpots: {
      igloo:       { label: "inside the cat igloo",   x: 16,   y: 9.1,  z: 0,  approach: [14, 9], hidden: true, clip: [15.55, 8.35, 0.9, 0.75] },
      snowmanRug:  { label: "the snowman rug",        x: 4,    y: 9.1,  z: 0,  approach: [5, 9] },
      hearth:      { label: "the warm hearth",        x: 10,   y: 4.5,  z: 0,  approach: [10, 4] },
      towerTop:    { label: "the top of the cat tower", x: 18.5, y: 12.95, z: 70, approach: [17, 12], high: true },
      bigRug:      { label: "the big rug",            x: 9,    y: 7.6,  z: 0,  approach: [9, 7] },
    },
    robertSpots: {
      chair: { x: 15, y: 4.7, z: 6, approach: [15, 5], sit: true },
    },
    pointsOfInterest: [[2, 6], [10, 4], [16, 6], [9, 10], [4, 11], [12, 12]],
    lauraStart: { x: 3, y: 7.5 },
  },

  // Rooms from the house layout that arrive in later builds.
  // ------------------------------------------------------------ GARAGE
  // Through the white door in the back room. The big garage door is on the
  // right as you walk in. (No photos of the inside yet — placeholder layout.)
  garage: {
    name: "Garage",
    available: true, catsAllowed: false,
    cols: 18, rows: 13, wallRows: 3,
    floor: "concrete",
    walls: { back: "#b8b4ac", left: "#a8a49c", right: "#a8a49c", front: "#96928a" },
    zones: [],
    wallDecor: [
      { kind: "pegboard", x: 2, w: 5 },
      { kind: "garageLight", x: 9, w: 1 },
    ],
    furniture: [
      { id: "shelves",   kind: "metalShelves",  x: 1,  y: 3, w: 4, h: 1, solid: true },
      { id: "workbench", kind: "workbench",     x: 6,  y: 3, w: 4, h: 1, solid: true },
      { id: "boxes",     kind: "storageBoxes",  x: 11, y: 3, w: 3, h: 1, solid: true },
      { id: "recycle",   kind: "rollCart",      x: 1,  y: 8, w: 1, h: 1, solid: true, color: "#2f5ec4" },
      { id: "trashCart", kind: "rollCart",      x: 1,  y: 10, w: 1, h: 1, solid: true, color: "#3a3a40" },
      { id: "oil",       kind: "oilStain",      x: 8,  y: 7, w: 3, h: 2, solid: false },
      { id: "glight",    kind: "ceilingLight",  x: 9,  y: 6, w: 1, h: 1, solid: false, light: true },
    ],
    sideDecor: [],
    bigDoor: { side: "right", y: 4, h: 7 },          // the overhead garage door
    exits: [
      { id: "toBackRoom", label: "Back Room", side: "front", x: 3, w: 2, to: "backRoom", toExit: "toGarage", style: "interiorDoor" },
    ],
    interactables: [
      { id: "garageDoor", kind: "garageDoor", label: "the garage door", x: 15.8, y: 7.5 },
    ],
    restingSpots: {},
    pointsOfInterest: [],
    lauraStart: { x: 4, y: 10 },
  },

  // ------------------------------------------------------------ BASEMENT
  // Down the carpeted stairs next to the garage door. (No photos of the
  // basement itself yet — placeholder layout, easy to change.)
  basement: {
    name: "Basement",
    available: true,
    cols: 18, rows: 13, wallRows: 3,
    floor: "carpet",
    dim: 0.38,                                         // basements are dark, even in the day
    walls: { back: "#9a968f", left: "#8c8882", right: "#8c8882", front: "#7e7a74" },
    zones: [],
    wallDecor: [
      { kind: "basementWindow", x: 6, w: 2 },
      { kind: "basementWindow", x: 12, w: 2 },
    ],
    furniture: [
      { id: "hBoxes",    kind: "storageBoxes",  x: 10, y: 3, w: 4, h: 1, solid: true, halloween: true },
      { id: "shelf",     kind: "metalShelves",  x: 15, y: 3, w: 2, h: 1, solid: true },
      { id: "oldCouch",  kind: "oldCouch",      x: 6,  y: 9, w: 4, h: 2, solid: true },
      { id: "bulb",      kind: "hangingBulb",   x: 8,  y: 6, w: 1, h: 1, solid: false, light: true },
      { id: "bRug",      kind: "rug",           x: 5,  y: 5, w: 7, h: 3, solid: false },
    ],
    sideDecor: [],
    exits: [
      { id: "toBackRoom", label: "Back Room", side: "left", y: 4, h: 2, to: "backRoom", toExit: "toBasement", style: "stairsUp" },
    ],
    restingSpots: {
      oldCouch:   { label: "the old basement couch", x: 8, y: 10.2, z: 6, approach: [8, 11] },
      behindBoxes:{ label: "behind the Halloween boxes", x: 12, y: 4.4, z: 0, approach: [12, 5], hidden: true },
    },
    pointsOfInterest: [[3, 6], [12, 6], [15, 10], [8, 8]],
    lauraStart: { x: 2.5, y: 5 },
  },

  // ------------------------------------------------------------ HALLWAY
  // Off the back of the living room, left of the kitchen. Purple and orange
  // fairy lights everywhere. Doors clockwise from the bottom left:
  // Evan's room, Owen's room (Robert sleeps here), Laura & Robert's room, hall bathroom.
  hallway: {
    name: "Hallway",
    available: true,
    cols: 6, rows: 15, wallRows: 2,
    floor: "carpet", floorColor: "#7d7684",
    walls: { back: "#ead6ee", left: "#e2cfe8", right: "#e2cfe8", front: "#c4b2ca" },
    fairyLights: true, ambient: "rgba(205,70,225,0.16)",
    zones: [],
    wallDecor: [{ kind: "paneMirror", x: 2, w: 2 }],
    furniture: [{ id: "redToy", kind: "toyPile", x: 2, y: 2, w: 1, h: 1, solid: false }],
    sideDecor: [
      { kind: "catArt",   side: "left",  y: 6.5, h: 2 },
      { kind: "bigFrame", side: "right", y: 6.5, h: 2.5 },
    ],
    exits: [
      { id: "toLiving",   label: "Living Room",           side: "front", x: 2, w: 2, to: "livingRoom", toExit: "toHallway" },
      { id: "toEvan",     label: "Evan's Room",           side: "left",  y: 10, h: 2, to: "evansRoom", toExit: "toHallway", style: "hallDoor" },
      { id: "toOwen",     label: "Owen's Room",           side: "left",  y: 3,  h: 2, to: "owensRoom", toExit: "toHallway", style: "hallDoor" },
      { id: "toMaster",   label: "Laura & Robert's Room", side: "right", y: 3,  h: 2, to: "masterBedroom", toExit: "toHallway", style: "hallDoor" },
      { id: "toBathroom", label: "Bathroom",              side: "right", y: 10, h: 2, to: "hallBathroom", toExit: "toHallway", style: "hallDoor" },
    ],
    restingSpots: {
      hallEnd: { label: "the end of the hallway", x: 3, y: 2.9, z: 0, approach: [3, 2] },
    },
    pointsOfInterest: [[2, 4], [3, 9], [2, 12]],
    lauraStart: { x: 3, y: 12 },
  },

  // ------------------------------------------------------------ EVAN'S ROOM
  // Bottom-left door of the hallway. From the photos: low bed with a pink
  // comforter and blue LED under-glow, blue curtains under the EVAN sign,
  // white dresser with clothes spilling out, posters, plushies, clutter.
  evansRoom: {
    name: "Evan's Room",
    available: true,
    cols: 14, rows: 12, wallRows: 3,
    floor: "carpet", floorColor: "#5d5a6a",
    walls: { back: "#b9a2d0", left: "#ad96c4", right: "#ad96c4", front: "#9a86b0" },
    chairRail: true, dim: 0.22, ambient: "rgba(150,60,220,0.14)",
    zones: [],
    wallDecor: [
      { kind: "evanSign",     x: 6.6, w: 1.6 },
      { kind: "blueCurtains", x: 5.2, w: 4.4 },
      { kind: "moviePoster",  x: 9.9, w: 1 },
      { kind: "kittenPoster", x: 11.4,w: 1.4 },
      { kind: "framedArt",    x: 1.2, w: 1.6 },
    ],
    furniture: [
      { id: "bed",      kind: "kidBed",       x: 1,  y: 3, w: 5, h: 4, solid: true, light: "led" },
      { id: "dresser",  kind: "whiteDresser", x: 1,  y: 8, w: 2, h: 3, solid: true },
      { id: "clothes1", kind: "clutter",      x: 6,  y: 8, w: 2, h: 2, solid: false, variant: 0 },
      { id: "clothes2", kind: "clutter",      x: 4,  y: 9, w: 2, h: 2, solid: false, variant: 1 },
      { id: "socks",    kind: "clutter",      x: 7,  y: 5, w: 2, h: 2, solid: false, variant: 2 },
      { id: "plushO",   kind: "roundPlush",   x: 3,  y: 7, w: 1, h: 1, solid: false },
      { id: "plushP",   kind: "purplePlush",  x: 10, y: 9, w: 1, h: 1, solid: false },
      { id: "box",      kind: "storageBoxes", x: 11, y: 5, w: 1, h: 1, solid: true },
    ],
    sideDecor: [],
    exits: [
      { id: "toHallway", label: "Hallway", side: "right", y: 8, h: 2, to: "hallway", toExit: "toEvan", style: "hallDoor" },
    ],
    toys: [
      { id: "slinky", kind: "spring", x: 10.5, y: 4.4, colors: ["#e8436f", "#ffd166", "#4ac06a", "#4a8ae8", "#c77dff"] },
    ],
    restingSpots: {
      evanBed:   { label: "Evan's bed", x: 3.5, y: 6.2, z: 8, approach: [3, 7] },
      underBed:  { label: "under Evan's bed", x: 4.5, y: 6.6, z: 0, approach: [6, 6], hidden: true },
      clothesPile: { label: "the pile of clothes", x: 6.8, y: 9.2, z: 0, approach: [6, 10] },
    },
    pointsOfInterest: [[7, 4], [9, 9], [11, 7], [4, 10]],
    lauraStart: { x: 11, y: 9 },
  },

  // Coming next, once photos arrive
  // ------------------------------------------------------------ OWEN'S ROOM
  // Top-left door of the hallway — where Robert sleeps (the Tiny Snore).
  // From the photos: big dark-wood bookcase bed with storage drawers, OWEN
  // sign over the curtained window, open closet with the paper-heart door,
  // trophies and medals, dark dresser with lamp and red piggy bank.
  owensRoom: {
    name: "Owen's Room",
    available: true,
    cols: 14, rows: 12, wallRows: 3,
    floor: "carpet", floorColor: "#8e8c92",
    walls: { back: "#b4bccc", left: "#a8b0c0", right: "#a8b0c0", front: "#9aa2b2" },
    zones: [],
    wallDecor: [
      { kind: "bookcaseHeadboard", x: 1,   w: 5 },
      { kind: "owenSign",          x: 6.4, w: 1.6 },
      { kind: "lightCurtains",     x: 5.8, w: 3 },
      { kind: "moviePoster",       x: 9.3, w: 1 },
      { kind: "trophyWall",        x: 11,  w: 2.4 },
    ],
    furniture: [
      { id: "bed",      kind: "captainBed",   x: 1,  y: 3, w: 5, h: 4, solid: true },
      { id: "dresser",  kind: "darkDresser",  x: 9,  y: 3, w: 2, h: 1, solid: true },
      { id: "cubes",    kind: "cubeBoxes",    x: 12, y: 3, w: 1, h: 1, solid: true },
      { id: "smallDesk",  kind: "smallDesk",  x: 10, y: 5, w: 2, h: 1, solid: true },
      { id: "shirtChair", kind: "shirtChair", x: 12, y: 6, w: 1, h: 1, solid: true },
      { id: "closet",   kind: "openCloset",   x: 7,  y: 10, w: 4, h: 1, solid: true },
      { id: "plushies", kind: "clutter",      x: 5,  y: 9, w: 2, h: 2, solid: false, variant: 1 },
      { id: "clothes",  kind: "clutter",      x: 3,  y: 8, w: 2, h: 2, solid: false, variant: 2 },
    ],
    sideDecor: [],
    exits: [
      { id: "toHallway", label: "Hallway", side: "right", y: 7, h: 2, to: "hallway", toExit: "toOwen", style: "hallDoor" },
    ],
    restingSpots: {
      owenBed:    { label: "Owen's bed", x: 4.5, y: 6.3, z: 8, approach: [5, 7] },
      // the cats' route to the window: desk -> dresser -> window
      owenDesk:       { label: "the little desk",   x: 10.6, y: 5.98, z: 12, approach: [10, 6] },
      owenDresserTop: { label: "the top of the dresser", x: 9.6, y: 3.98, z: 20, approach: [9, 5], high: true },
      owenWindow:     { label: "the window",        x: 7.6, y: 3.02, z: 11, approach: [7, 4] },
      underOwenBed: { label: "in the bed's storage drawer", x: 2.5, y: 6.7, z: 0, approach: [2, 7], hidden: true },
    },
    robertSpots: {
      bed: { x: 3.2, y: 7.05, z: 34, approach: [3, 7], sit: true, lie: true },   // drawn on top of the bed
    },
    pointsOfInterest: [[7, 5], [11, 7], [4, 9], [8, 8]],
    lauraStart: { x: 11, y: 8 },
  },
  // ------------------------------------------------------------ LAURA & ROBERT'S ROOM
  // Top-right door of the hallway. Walk in: big white dresser with the TV
  // (angled at the bed) on the right; keep going and the small bathroom is
  // on the right (it connects through to the back room with the clown).
  // Laura's desk with two monitors sits under the window at the foot of the
  // huge bed. Marshmallow naps on the bed, sits in the window, walks on the
  // keyboard, steals coffee, and judges everyone from the top of the dresser.
  masterBedroom: {
    name: "Laura & Robert's Room",
    available: true,
    cols: 16, rows: 13, wallRows: 3,
    floor: "carpet", floorColor: "#6c6a6e",
    walls: { back: "#8f8f8d", left: "#858583", right: "#858583", front: "#777775" },
    zones: [],
    wallDecor: [
      { kind: "grayCurtainWindow", x: 1.1, w: 4.4 },
      { kind: "deskWall",          x: 5.6, w: 2.2 },
    ],
    furniture: [
      { id: "desk",       kind: "workDesk",      x: 2,  y: 3,  w: 4, h: 1, solid: true },
      { id: "chair",      kind: "officeChair",   x: 3,  y: 4,  w: 1, h: 1, solid: false },
      { id: "bigBed",     kind: "bigBed",        x: 9,  y: 4,  w: 6, h: 5, solid: true },
      { id: "nightstand", kind: "nightstand",    x: 14, y: 3,  w: 1, h: 1, solid: true },
      { id: "tvDresser",  kind: "tvDresser",     x: 5,  y: 10, w: 4, h: 1, solid: true },
      { id: "laundry",    kind: "laundryBasket", x: 5,  y: 6,  w: 1, h: 1, solid: true },
      { id: "clothes1",   kind: "clutter",       x: 6,  y: 7,  w: 2, h: 2, solid: false, variant: 0 },
      { id: "clothes2",   kind: "clutter",       x: 10, y: 10, w: 2, h: 2, solid: false, variant: 1 },
    ],
    sideDecor: [],
    exits: [
      { id: "toHallway", label: "Hallway",  side: "left",  y: 7, h: 2, to: "hallway", toExit: "toMaster", style: "hallDoor" },
      { id: "toEnsuite", label: "Bathroom", side: "front", x: 12, w: 2, to: "ensuite", toExit: "toBedroom", style: "interiorDoor" },
    ],
    interactables: [
      { id: "desk", kind: "desk", label: "Laura's desk", x: 3.5, y: 5 },
    ],
    restingSpots: {
      bigBed:      { label: "the big bed",           x: 11.5, y: 8.95, z: 40, approach: [11, 9] },
      windowsill:  { label: "the window",            x: 1.5,  y: 3.05, z: 14, approach: [1, 4] },
      dresserTop:  { label: "the top of the dresser", x: 7.6, y: 10.95, z: 24, approach: [7, 9], high: true },
      underBigBed: { label: "under the big bed",     x: 10.5, y: 8.5,  z: 0,  approach: [10, 9], hidden: true },
      deskTop:     { label: "Laura's desk",          x: 2.6,  y: 3.98, z: 12, approach: [2, 5] },
    },
    pointsOfInterest: [[3, 7], [7, 8], [12, 11], [2, 10]],
    lauraStart: { x: 2, y: 8 },
  },

  // ------------------------------------------------------------ EN-SUITE BATHROOM
  // Off Laura & Robert's room. Walk straight in: toilet on the right, then the
  // sink (light-wood vanity, black counter); at the far end the door into
  // the back room with the clown.
  ensuite: {
    name: "Bathroom",
    available: true,
    cols: 8, rows: 12, wallRows: 2,
    floor: "tile", tileStyle: "white",
    walls: { back: "#8a8c8e", left: "#808284", right: "#808284", front: "#737577" },
    zones: [],
    wallDecor: [{ kind: "doorwayPlain", x: 3, w: 2 }],
    furniture: [
      { id: "toilet",  kind: "toilet",  x: 1, y: 3, w: 1, h: 1, solid: true },
      { id: "vanity",  kind: "vanity",  x: 1, y: 5, w: 2, h: 3, solid: true, style: "wood" },
    ],
    sideDecor: [{ kind: "catFrame", side: "left", y: 3, h: 1 }],
    exits: [
      { id: "toBedroom",  label: "Laura & Robert's Room", side: "back",  x: 3, w: 2, to: "masterBedroom", toExit: "toEnsuite" },
      { id: "toBackRoom", label: "Back Room",             side: "right", y: 9, h: 2, to: "backRoom", toExit: "toEnsuite", style: "hallDoor" },
    ],
    restingSpots: {},
    pointsOfInterest: [[4, 5], [5, 9]],
    lauraStart: { x: 4, y: 4 },
  },

  // ------------------------------------------------------------ HALL BATHROOM
  // Bottom-right door of the hallway. Walk in: sink on the right, toilet in
  // the right corner, towel rack (kitty towels!) straight ahead, and the tub
  // with the jack-o'-lantern shower curtain on the left.
  hallBathroom: {
    name: "Hall Bathroom",
    available: true,
    cols: 10, rows: 9, wallRows: 3,
    floor: "tile", tileStyle: "dark",
    walls: { back: "#8a7e8e", left: "#807484", right: "#807484", front: "#6e6474" },
    ambient: "rgba(200,60,210,0.16)",
    zones: [],
    wallDecor: [{ kind: "pumpkinCurtain", x: 1, w: 5 }],
    furniture: [
      { id: "tub",     kind: "bathtub", x: 1, y: 3, w: 5, h: 2, solid: true },
      { id: "vanity",  kind: "vanity",  x: 3, y: 7, w: 3, h: 1, solid: true, style: "white" },
      { id: "toilet",  kind: "toilet",  x: 8, y: 7, w: 1, h: 1, solid: true },
    ],
    sideDecor: [
      { kind: "towelRack", side: "right", y: 3.4, h: 2 },
      { kind: "tpHolder",  side: "right", y: 5.6, h: 1 },
    ],
    exits: [
      { id: "toHallway", label: "Hallway", side: "left", y: 5, h: 2, to: "hallway", toExit: "toBathroom", style: "hallDoor" },
    ],
    restingSpots: {
      inTub: { label: "in the bathtub", x: 3.5, y: 4.95, z: 6, approach: [3, 5], hidden: true },
    },
    pointsOfInterest: [[6, 5], [2, 6]],
    lauraStart: { x: 3, y: 5.5 },
  },

  dining:   { name: "Dining Area", available: false, note: "Part of the kitchen map" },
};
