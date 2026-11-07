// =====================================================================
//  MISSIONS — the story levels, played in order. Each step finishes when
//  the named game event happens. Optional:
//    cat / match : the event must be about this cat / have these values
//    min         : the event value must be at least this much
//    onStart     : a scripted moment that runs when the step begins
//  setup         : runs when the level starts (and when you Continue)
// =====================================================================
window.LPK = window.LPK || {};

LPK.missions = [
  {
    id: "firstPurr", level: 1, name: "First Purr", available: true,
    location: "Living Room", difficulty: "Easy",
    intro: "Marshmallow is napping somewhere in the living room. Find her and earn her first purr!",
    steps: [
      { id: "find", text: "Find Marshmallow (she's napping somewhere)",   event: "catFound", cat: "marshmallow" },
      { id: "pet",  text: "Walk up calmly (no running!) and pet her",    event: "petStart", cat: "marshmallow" },
      { id: "purr", text: "Fill her Purr Meter — try Turbo Back Pats!", event: "purrFull", cat: "marshmallow" },
    ],
    reward: { points: 100, achievement: "firstPurr" },
  },
  {
    id: "kittyHunt", level: 2, name: "The Great Kitty Hunt", available: true,
    location: "Living Room + Kitchen", difficulty: "Easy",
    intro: "Marshmallow has vanished into one of her secret hiding spots. Look for clues and track her down!",
    setup: "hideMarshmallow",
    steps: [
      { id: "clue",   text: "Look for clues (white fur!)",                       event: "clueFound" },
      { id: "search", text: "Search hiding spots until you find her",            event: "catFound", match: { cat: "marshmallow", searched: true } },
      { id: "love",   text: "Give her a little affection",                       event: "petProgress", match: { cat: "marshmallow" }, min: { gained: 20 } },
    ],
    reward: { points: 150, achievement: "sleepyDetective" },
  },
  {
    id: "treats", level: 3, name: "The Treat Negotiations", available: true,
    location: "Kitchen", difficulty: "Medium",
    intro: "Dinner time! Every cat wants something different — and the boys want EVERYTHING.",
    setup: "marshmallowToKitchen",
    steps: [
      { id: "grab",   text: "Grab some food from the treat cabinet (kitchen)",   event: "foodPicked" },
      { id: "picky",  text: "Find out which treat Marshmallow actually wants",   event: "catFed", match: { cat: "marshmallow", liked: true, food: "crunchies" } },
      { id: "trash",  text: "Uh-oh! Get Popsicle out of the trash",              event: "trashRedirect", onStart: "popsicleToTrash" },
      { id: "bowl",   text: "Fill Marshmallow's bowl with her favorite",         event: "bowlFilled", match: { owner: "marshmallow", food: "crunchies" }, onStart: "emptyHerBowl" },
      { id: "guard",  text: "Keep the boys away while she eats (shoo them, or feed them!)", event: "ateInPeace", match: { cat: "marshmallow" }, onStart: "boysWantHerFood" },
    ],
    reward: { points: 200, achievement: "treatNegotiator" },
  },
  {
    id: "zoomies", level: 4, name: "Midnight Zoomies", available: true,
    location: "The whole house", difficulty: "Medium",
    intro: "It's almost midnight. Robert's snoring (tiny!). Marshmallow's asleep. And CC... has the ZOOMIES.",
    setup: "midnightZoomies",
    steps: [
      { id: "find",   text: "Find CC — he's zooming all over the house",            event: "catFound", cat: "cc" },
      { id: "tag",    text: "Keep up! Get close to CC while he zooms",              event: "zoomTag", count: 3 },
      { id: "spring", text: "Calm him down: toss his rainbow spring toy (back room)", event: "springToss", count: 3, onStart: "endZoomies" },
      { id: "stare",  text: "Witness Marshmallow's opinion of all this commotion",   event: "catStare", match: { cat: "marshmallow", source: "boys" }, onStart: "boysBotherMarshmallow" },
      { id: "calm",   text: "Calm the household: pet all three cats",               event: "calmAll", onStart: "startCalmAll" },
    ],
    reward: { points: 250, achievement: "zoomieSurvivor" },
  },
  {
    id: "olympics", level: 5, name: "The Kitty Olympics", available: true,
    location: "Living Room", difficulty: "Medium",
    intro: "Three athletes. Three VERY different abilities. Let the Kitty Olympics begin!",
    setup: "olympicsSetup",
    steps: [
      { id: "cc",   text: "CC's GQ Grand Prix: rings, then the climb", event: "olympicDone", match: { event: "cc" },   onStart: "olympicsCC" },
      { id: "pop",  text: "Orangey's Agility (sort of): cheer him on", event: "olympicDone", match: { event: "pop" },  onStart: "olympicsPop" },
      { id: "marsh",text: "Marshmallow's Nap-athlon: Turbo Back Pats combo", event: "olympicDone", match: { event: "marsh" }, onStart: "olympicsMarsh" },
    ],
    reward: { points: 300, achievement: "kittyOlympics" },
  },
  {
    id: "ultimateCuddle", level: 6, name: "Ultimate Kitty Cuddle", available: true,
    location: "The whole house", difficulty: "Hard",
    intro: "The final challenge: make all three cats happy in ONE day. Any order. Use Skip Ahead if you need the night.",
    setup: "ultimateSetup",
    anyOrder: true,          // steps can be done in any order
    steps: [
      { id: "find",   text: "Find Marshmallow",                                   event: "catFound", cat: "marshmallow" },
      { id: "pats",   text: "Turbo Back Pats until Marshmallow purrs",            event: "purrFull", cat: "marshmallow" },
      { id: "spring", text: "Play a spring game with CC (3 tosses)",              event: "springGame" },
      { id: "belly",  text: "Answer CC's Royal Belly Rub",                        event: "bellyRub" },
      { id: "feed",   text: "Feed Orangey (he's ALWAYS hungry)",                  event: "catFed", match: { cat: "popsicle", liked: true } },
      { id: "sleepy", text: "Tonight: pet sleepy Orangey until he drifts off",    event: "sleepyBoy" },
      { id: "happy",  text: "Everybody happy: all three Purr Meters at 80%+",     event: "allHappy" },
    ],
    reward: { points: 500, achievement: "purrfection" },
    finale: true,
  },
];

// Food in the treat cabinet (Food Detective). Cat preferences live in characters.js.
LPK.foods = {
  crunchies: { name: "Crunchies",  full: "Crunchies (Friskies Party Mix)", color: "#e8a24a" },
  kibble:    { name: "Dry kibble", full: "Regular dry kibble",             color: "#a0703a" },
  wetFood:   { name: "Wet food",   full: "A can of wet food",              color: "#c4706a" },
  catnip:    { name: "Catnip treat", full: "Catnip treats (zoomies! +2 Speed)", color: "#7ed957" },
};
