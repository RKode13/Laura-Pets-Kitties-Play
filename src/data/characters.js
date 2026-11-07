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
};

// Friendly display names for attributes (used by Character Profiles).
LPK.attributeLabels = {
  speed: "Speed", strength: "Strength", agility: "Agility", curiosity: "Curiosity",
  foodPickiness: "Food pickiness", foodMotivation: "Food motivation", skittishness: "Skittishness",
  cuddliness: "Cuddliness", sleepTendency: "Sleep tendency", athleticism: "Athleticism",
  bossFactor: "Boss factor", style: "Style", protectiveness: "Protectiveness",
  coolness: "Coolness", awesomeness: "Awesomeness", legendaryStatus: "Legendary status",
};
