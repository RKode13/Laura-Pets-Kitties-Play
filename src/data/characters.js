// =====================================================================
//  CHARACTERS — edit names, ratings, speeds and behavior here.
//  Ratings come from the Game Design Specification v1.0 (proposed values,
//  free to rebalance). Speeds are in "game pixels per second"
//  (one floor tile = 16 game pixels).
// =====================================================================
window.LPK = window.LPK || {};

LPK.characters = {
  laura: {
    name: "Laura",
    role: "The heart of the game (playable)",
    description: "Affectionate, persistent, caring, playful, and determined to make each kitty happy.",
    look: {
      hair: "#b8894f", hairDark: "#8a6236", hairLight: "#e2bd80",
      skin: "#f2c8a6", skinShade: "#dba684", eyes: "#3a2418", lips: "#c0605a",
      top: "#7d2e3a", topDark: "#5e212b", buttons: "#d9a0a0",
      pants: "#2f2833", shoes: "#7a5a4a",
    },
    walkSpeed: 46,
    runSpeed: 86,
    // Wardrobe: unlocked with Kitty Happiness Points (or story progress)
    outfits: {
      cozy:     { name: "Cozy Burgundy (default)", unlockPoints: 0,    top: "#7d2e3a", topDark: "#5e212b", pants: "#2f2833", shoes: "#7a5a4a" },
      brownTop: { name: "Brown Henley",            unlockPoints: 300,  top: "#7a5236", topDark: "#5c3c26", pants: "#2f2833", shoes: "#7a5a4a" },
      pajamas:  { name: "Kitty Pajamas",           unlockPoints: 700,  top: "#f2a7c3", topDark: "#d886a6", pants: "#f6d2e0", shoes: "#ffffff" },
      party:    { name: "Green Party Dress",       unlockPoints: 1200, top: "#2f7a6a", topDark: "#225a4e", pants: "#2f7a6a", shoes: "#3a2a2a" },
      champion: { name: "Purrfection Champion",    unlockMission: "ultimateCuddle", top: "#e8b04a", topDark: "#c48a2a", pants: "#3a2a4a", shoes: "#e8b04a" },
    },
  },

  marshmallow: {
    name: "Marshmallow",
    nicknames: [],
    title: "The Grumpy Sleep Queen",
    gender: "Female",
    age: 5,
    joinsInBuild: 1,
    description: "A professional sleeper (about 22 hours a day). A wonderful cuddle partner — on her terms. Easily annoyed by the boys. Extremely finicky eater who loves crunchies (Friskies Party Mix).",
    favorites: ["Napping (22 hrs/day)", "Turbo Back Pats (lower back, near the tail)", "Crunchies — Friskies Party Mix", "Peace and quiet", "Robert's protection at mealtime"],
    signatures: ["Turbo Tiny Paws", "The Judgmental Camera Stare", "Turbo Back Pats"],
    attributes: {
      speed: 2, strength: 2, agility: 1, curiosity: 2,
      foodPickiness: 10, foodMotivation: 8, skittishness: 2,
      cuddliness: 10, sleepTendency: 10,
    },
    attributeNotes: { foodMotivation: "for crunchies" },
    // Fur colors, taken from her photos: white body, dark gray tabby cap
    // and ears with a white blaze, small body marking, dark striped tail.
    look: {
      body: "#f6f3ee", bodyShade: "#d8d1c8", cap: "#4b4642", capMid: "#6f6862",
      blaze: true, earInner: "#f2a9b0", eyes: "#b9c44c", nose: "#e8949c",
      tail: "#4b4642", tailStripe: "#8f877e", legHeight: 3,          // stubby little legs
      patches: [{ x: -6, y: -3, w: 3, h: 2, c: "#7d766f" }],
    },
    behavior: {
      walkSpeed: 9,            // slow travel
      turboSpeed: 12,          // Turbo Tiny Paws: barely faster...
      turboLegFps: 22,         // ...while her legs go absolutely wild
      hopSeconds: 1.4,         // getting onto furniture takes effort
      sleepBout: [35, 80],     // seconds per nap before she reconsiders life
      keepSleepingChance: 0.72,
      wanderChance: 0.08,      // chance of moving to another spot when she wakes
      spookRadius: 44,         // running this close wakes her up grumpy
      annoyanceToStare: 2,     // grumpy wake-ups before The Stare
      breakEvery: 30,          // purr points before she wants a short break
      breakSeconds: 2.6,
      ignoredBreakPatsToLeave: 3,
      boysStareRadius: 30,     // a boy this close may trigger The Stare
      boysStareChance: 0.6,
      boysStareCooldown: 25,   // seconds between stares at the boys
      eatSeconds: 9,
    },
    petting: { style: "turboPats" },
    // How much she likes each food (0 = refuses it). She is VERY picky.
    foodPrefs: { crunchies: 1, kibble: 0, wetFood: 0, catnip: 1 },
    // Where she likes to nap. Examples only — her real favorite spot is not confirmed yet.
    restingSpots: ["livingRoom.catTreeCubby", "livingRoom.sectionalCorner", "livingRoom.sectionalSeat", "livingRoom.rugByLamp", "backRoom.igloo", "backRoom.snowmanRug",
                   "masterBedroom.bigBed", "masterBedroom.bigBed", "masterBedroom.windowsill", "masterBedroom.dresserTop", "masterBedroom.underBigBed"],   // she LOVES the big bed
    hidingSpots:  ["livingRoom.catTreeCubby", "livingRoom.underShoeBench", "kitchen.underDiningTable", "kitchen.besideFridge", "backRoom.igloo", "evansRoom.underBed", "owensRoom.underOwenBed", "masterBedroom.underBigBed", "hallBathroom.inTub"],
  },

  cc: {
    name: "Cookies and Cream",
    nicknames: ["CC", "GQ", "Blacky"],
    title: "The GQ Boss",
    gender: "Male", age: 1, joinsInBuild: 2,
    relationship: "Popsicle's brother",
    description: "Effortlessly cool, the undisputed boss of the house — sweet, kind, cuddly, and the fastest cat by far. Idolizes Robert.",
    favorites: ["Spring toys (his treasure!)", "High places", "Belly rubs", "Exploring", "Following Robert"],
    signatures: ["GQ Dash", "Spring Security", "High-Perch King", "Royal Belly Rub", "The Boss Walk", "Angelic Meow", "Follow the Legend"],
    attributes: {
      speed: 10, strength: 10, agility: 10, curiosity: 10,
      foodPickiness: 6, foodMotivation: 6, skittishness: 2,
      cuddliness: 8, athleticism: 10, bossFactor: 10, sleepTendency: 4,
    },
    look: {
      body: "#26232a", bodyShade: "#1a181d", cap: "#26232a", capMid: "#26232a",
      blaze: false, muzzle: "#f4f1ec", chest: "#f4f1ec", paws: "#f4f1ec",
      earInner: "#e89aa8", eyes: "#e8c838", nose: "#2a2226",
      tail: "#26232a", tailStripe: null, legHeight: 5, longTail: true, patches: [],
    },
    behavior: {
      walkSpeed: 38, bossWalkSpeed: 18, sprintSpeed: 150, hopSeconds: 0.35,
      // what he does when he decides something new (relative weights)
      choices: { patrol: 30, gqDash: 15, settle: 30, bossWalk: 8, angelicMeow: 4, playSpring: 13, windowWatch: 10 },
      nightChoices: { patrol: 10, gqDash: 12, settle: 55, checkRobert: 15, angelicMeow: 3, playSpring: 5 },
      bellyUpChance: 0.35,     // chance he offers a Royal Belly Rub when settled and happy
      inspectSeconds: [1.5, 3],
      settleSeconds: [18, 40],
      pettingPatience: 35,     // purr points before the boss has places to be
      foodResponseChance: 0.5,
    },
    petting: { style: "scritches" },
    foodPrefs: { crunchies: 0.7, kibble: 0.6, wetFood: 0.8, catnip: 1 },
    restingSpots: ["livingRoom.catTreeTop", "livingRoom.sectionalCorner", "kitchen.catTowerTop", "kitchen.diningChair", "livingRoom.rugCenter", "backRoom.towerTop", "backRoom.hearth"],
  },

  popsicle: {
    name: "Popsicle",
    nicknames: ["Orangey"],
    title: "The One-Brain-Cell Food Bandit",
    gender: "Male", age: 1, joinsInBuild: 2,
    relationship: "Cookies and Cream's brother",
    description: "A lovable, slightly derpy goofball with a bottomless stomach. Skittish, clumsy, very affectionate — and sleepier as the day goes on. Loves sleeping on Laura's head.",
    favorites: ["ALL food", "Investigating the trash", "Chewing cardboard boxes", "Sleeping on Laura's head"],
    signatures: ["Food Radar", "One Brain Cell", "Box Chomping", "Failed Athletic Hero", "Sleepy Orangey"],
    attributes: {
      speed: 7, strength: 5, agility: 6, curiosity: 6,
      foodPickiness: 1, foodMotivation: 10, skittishness: 9,
      cuddliness: 9, athleticism: 6, sleepTendency: 7,
    },
    look: {
      body: "#fbf6ee", bodyShade: "#e0d6c6", cap: "#d9772b", capMid: "#e8954a",
      blaze: true, earInner: "#f2a9b0", eyes: "#d9a43a", nose: "#f08a9a",
      tail: "#d9772b", tailStripe: "#f6d2a6", legHeight: 4,
      patches: [{ x: -7, y: -3, w: 10, h: 3, c: "#d9772b" }],
    },
    behavior: {
      walkSpeed: 28, runSpeed: 85, hopSeconds: 0.6,
      choices: { wander: 20, trash: 15, boxChomp: 15, confusedStare: 15, nap: 20, seekLaura: 15, windowWatch: 10 },
      napSeconds: [20, 40],
      boxSeconds: [10, 16],
      trashSeconds: [8, 12],
      spookRadius: 46,         // very skittish
      foodRadarRange: 400,     // notices food from much farther away than the others
      pettingPatience: 45,
    },
    petting: { style: "scritches" },
    foodPrefs: { crunchies: 1, kibble: 1, wetFood: 1, catnip: 1 },   // he will eat literally anything
    // Sleepy Orangey: how tired he is by time of day (0 = bright-eyed, 1 = exhausted)
    tiredness: { morning: 0, afternoon: 0.25, evening: 0.7, night: 1 },
    clumsyChance: 0.55,        // chance a jump onto furniture goes... less than perfectly
    restingSpots: ["livingRoom.sectionalEnd", "livingRoom.rugCenter", "kitchen.diningChair", "kitchen.kitchenMat", "backRoom.hearth", "backRoom.bigRug"],
  },

  robert: {
    name: "Robert",
    title: "The Legendary GQ Protector",
    role: "Legendary supporting character (not playable)",
    gender: "Male",
    description: "Cool, suave, impeccably dressed, calm and protective of Marshmallow. CC's role model. His snore is extraordinarily tiny and cute.",
    attributes: {
      strength: 10, speed: 10, agility: 10, style: 10, protectiveness: 10,
      coolness: 10, awesomeness: 10, legendaryStatus: 10,
    },
    joinsInBuild: 3,
    // Times of day for his routine. Edit freely.
    schedule: {
      weekday: { wake: "4:45 AM", leave: "5:30 AM", home: "7:30 PM", dinner: "7:45 PM", sleep: "11:00 PM" },
      weekend: { wake: "8:00 AM", dinner: "5:30 PM", sleep: "11:30 PM" },
    },
    behavior: { walkSpeed: 34, runSpeed: 70, hopSeconds: 0.4, activitySeconds: [35, 80], blockCooldown: 2.5 },
    casual: { hoodie: "#8d8d94", hoodieDark: "#74747c", jeans: "#3a4a6a", sneakers: "#e8e8e8" },
    look: {
      suit: "#2c2836", suitLight: "#3d3848", shirt: "#f2f0ec", tie: "#d9772b", tieStripe: "#3a2a4a",
      hair: "#9a958f", hairDark: "#6e6a66", beard: "#c9c4be", skin: "#e2b08e", shoes: "#6a3a1e",
    },
  },
  // ------------------------------------------------------------ EVAN
  // From his photos: brown hair, short on the sides and swept over on top,
  // brown eyes, freckles and a big gap-tooth grin. Outfits from the photos.
  evan: {
    name: "Evan",
    title: "The Big Grin",
    role: "Supporting character (not playable)",
    gender: "Male",
    relationship: "Laura's son",
    description: "Super curious, super creative and full of energy: always running around and getting into things. A great artist (his drawings end up on the fridge). Loves planes, squishies, pasta and fruit, and playing Laura Pets Kitties on his iPad.",
    attributes: { curiosity: 10, creativity: 10, artistry: 10, energy: 10, speed: 8, mischief: 9 },
    favorites: ["Planes", "Squishies", "Drawing", "Pasta", "Fruit", "Laura Pets Kitties on his iPad"],
    joinsInBuild: 4,
    // Times of day for his routine. Edit freely.
    // Bedtime window: tuck him in between bedWindow and bed for bonus points;
    // after "bed" he takes himself to bed (no bonus).
    schedule: { wake: "7:00 AM", bedWindow: "7:30 PM", bed: "8:15 PM" },
    bedtimePoints: 25, snackPoints: 5,
    behavior: { walkSpeed: 34, runSpeed: 66, hopSeconds: 0.35, activitySeconds: [6, 15] },
    look: {
      skin: "#f0c6a4", skinDark: "#d9a988", hair: "#6e4128", hairDark: "#4a2a18", hairLight: "#8f5a36",
      eyes: "#3a2418", freckles: "#c98a6a", mouth: "#9a3a3a",
    },
    // top / topDark / pants / feet, plus extras (dots, shorts, shortSleeves, collar, backpack...)
    outfits: {
      sweater:   { name: "Red sweater",       top: "#a3243a", topDark: "#841a2e", dots: ["#c0394f"], pants: "#1c1c22", feet: ["#f2b43a", "#4ac0c8"], collar: "henley" },
      zip:       { name: "Gray quarter-zip",  top: "#55575e", topDark: "#45474d", pants: "#355489", feet: ["#2a2a2e", "#2a2a2e"], collar: "zip" },
      school:    { name: "School day",        top: "#5b6276", topDark: "#4b5163", pants: "#2a3048", feet: ["#e8e8e8", "#e8e8e8"], shortSleeves: true, backpack: true },
      polo:      { name: "Palm-tree polo",    top: "#cfd1cb", topDark: "#b8bab4", dots: ["#8fd13a"], pants: "#23263a", feet: ["#e8e8e8", "#e8e8e8"], shorts: true, shortSleeves: true, collar: "polo" },
      pajamas:   { name: "Bug pajamas",       top: "#eceae4", topDark: "#d6d4ce", dots: ["#3a6ab8", "#d84a4a", "#4aa04a"], pants: "#eceae4", feet: ["#d8d8d8", "#d8d8d8"], shorts: true, shortSleeves: true, collar: "pj" },
      suit:      { name: "Navy suit",         top: "#24324f", topDark: "#1b2640", pants: "#24324f", feet: ["#1a1a1a", "#1a1a1a"], collar: "suit" },
      conductor: { name: "Train conductor",   top: "#a3243a", topDark: "#841a2e", dots: ["#c0394f"], pants: "#1c1c22", feet: ["#f2b43a", "#e8703a"], collar: "henley", suspenders: true, cap: true, mustache: true },
    },
  },
  // ------------------------------------------------------------ OWEN
  // From his photos: dark brown hair, short and swept up in front, brown eyes,
  // round rosy cheeks and a big grin. A bit taller and sturdier than Evan.
  owen: {
    name: "Owen",
    title: "The All-Star",
    role: "Supporting character (not playable)",
    relationship: "Laura's son · Evan's big brother",
    gender: "Male",
    description: "Evan's big brother. Plays flag football and baseball, and loves video games: Fortress Evening on his Pretendo Stitch, and Laura Pets Kitties. Has to keep up his streaks every night!",
    // (stats are a first guess; edit freely)
    attributes: { athleticism: 7, strength: 8, speed: 6, gaming: 10, competitiveness: 6, bigBrother: 9 },
    favorites: ["Flag football", "Baseball", "Fortress Evening on his Pretendo Stitch", "Laura Pets Kitties"],
    joinsInBuild: 4,
    // Remind him to do his streaks between streakStart and streakBy for bonus points.
    schedule: { wake: "7:00 AM", streakStart: "7:00 PM", streakBy: "8:30 PM", bed: "9:30 PM" },
    streakPoints: 15,
    behavior: { walkSpeed: 34, runSpeed: 62, hopSeconds: 0.4, activitySeconds: [8, 18] },
    look: {
      skin: "#efc4a2", skinDark: "#d8a888", hair: "#3c2a1e", hairDark: "#26180f", hairLight: "#5a4030",
      eyes: "#3a2418", cheeks: "#e8968a", mouth: "#9a3a3a",
      build: { bw: 6, hw: 5, leg: 10, torso: 12, headH: 9 },
      blanket: ["#3a4a8a", "#5a6ab0", "#2a3870"],
    },
    // Team colors only (no real team logos)
    outfits: {
      school:   { name: "Green tee + backpack", top: "#3e5a3a", topDark: "#30482c", pants: "#2a3048", feet: ["#e8e8e8", "#e8e8e8"], shortSleeves: true, backpack: true, backpackColor: "#1e1e24", backpackLight: "#3a3a44" },
      football: { name: "Flag football",      top: "#5b2a86", topDark: "#46206a", logo: "#f2c230", pants: "#55575e", feet: ["#d8343c", "#d8343c"], shorts: true, shortSleeves: true, collar: "vneck" },
      baseball: { name: "Baseball",           top: "#e8b830", topDark: "#c89a20", script: "#3a2a1e", pants: "#c8c8cc", feet: ["#2a2a2e", "#2a2a2e"], shortSleeves: true, cap: true, capColor: "#2e2620", capBadge: "#e8b830" },
      soccer:   { name: "Soccer #22 + medal", top: "#d8343c", topDark: "#b02830", sleeve: "#c8d4ec", number: "#2a3a8a", medal: true, pants: "#3a3a40", feet: ["#e8e8e8", "#e8e8e8"], shorts: true, shortSleeves: true, collar: "vneck" },
      suit:     { name: "Navy suit",          top: "#1e2a48", topDark: "#162038", pants: "#1e2a48", feet: ["#141418", "#141418"], collar: "suit", tie: "#141418" },
      king:     { name: "100 Days King",      top: "#f2f0ec", topDark: "#d8d6d0", pants: "#2a3048", feet: ["#e8e8e8", "#e8e8e8"], shortSleeves: true, collar: "ringer", ring: "#2a4ad8", crown: true },
      pajamas:  { name: "Pajamas",            top: "#3a4a6a", topDark: "#2e3c58", dots: ["#6a7ab0"], pants: "#3a4a6a", feet: ["#d8d8d8", "#d8d8d8"], shortSleeves: true },
    },
  },
  // ------------------------------------------------------------ JOE PINO
  // From his photo: gray hair combed back, salt-and-pepper mustache, a big
  // smile, navy blazer, white shirt, tan patterned tie, khaki pants.
  joe: {
    name: "Joe Pino",
    nicknames: ["Grandpa Joe"],
    title: "The Patriarch",
    role: "Visiting character (not playable)",
    relationship: "Laura's dad",
    gender: "Male",
    description: "The quiet, confident boss of the Italian family. Gracious and caring, extremely intelligent, with great work-world experience and a sense of humor you never see coming. Brings donuts and bagels, and makes the best cappuccino on the planet.",
    attributes: { intelligence: 10, graciousness: 10, cappuccino: 10, quietConfidence: 10, sneakyHumor: 10, inquisitive: 9 },
    favorites: ["Making cappuccino", "Tim Shortons donuts, donut holes and bagels", "Asking good questions"],
    joinsInBuild: 4,
    // Visits some weekend mornings (always the first weekend): arrives, stays, leaves
    schedule: { arrive: "9:00 AM", leave: "1:00 PM", visitChance: 0.5 },
    behavior: { walkSpeed: 30, runSpeed: 50, hopSeconds: 0.5, activitySeconds: [20, 40] },
    look: {
      skin: "#d9a882", skinShade: "#c08e6a", hair: "#c9c6c2", hairDark: "#9a9692", mustache: "#6e6a66",
      blazer: "#1f2a4a", blazerLight: "#2c3a62", shirt: "#f4f2ee", tie: "#a8927a", tieDots: "#6a7a9a",
      pants: "#cbb894", belt: "#1c1c20", shoes: "#4a3424",
    },
  },
};

// Friendly display names for attributes (used by Character Profiles).
LPK.attributeLabels = {
  speed: "Speed", strength: "Strength", agility: "Agility", curiosity: "Curiosity",
  foodPickiness: "Food pickiness", foodMotivation: "Food motivation", skittishness: "Skittishness",
  cuddliness: "Cuddliness", sleepTendency: "Sleep tendency", athleticism: "Athleticism",
  bossFactor: "Boss factor", style: "Style", protectiveness: "Protectiveness",
  coolness: "Coolness", awesomeness: "Awesomeness", legendaryStatus: "Legendary status",
  creativity: "Creativity", artistry: "Drawing", energy: "Energy", mischief: "Gets into things",
  gaming: "Gaming", competitiveness: "Competitive", bigBrother: "Big brother", athleticism: "Athleticism",
  intelligence: "Intelligence", graciousness: "Gracious", cappuccino: "Cappuccino", quietConfidence: "Quiet confidence", sneakyHumor: "Sneaky humor", inquisitive: "Inquisitive",
};
