// =====================================================================
//  GAME SETTINGS — general tuning knobs.
// =====================================================================
window.LPK = window.LPK || {};

LPK.config = {
  build: 4,                    // which build of the game this is
  tile: 16,                    // pixels per floor tile in the pixel-art world
  // Game clock: how many in-game minutes pass per real second.
  // 1 => a full in-game day takes 24 real minutes (spec suggests 20-30).
  clockMinutesPerSecond: 1,
  startDay: 6,                 // 0 = Sunday ... 6 = Saturday
  startTime: "3:00 PM",
  minVisibleTiles: { w: 16, h: 13 },  // camera zoom: at least this much of the room is visible
  heartsPerPurrPoints: 10,     // one heart (and +5 Kitty Happiness Points) per 10 purr points
  pointsPerHeart: 5,
  turboComboForAchievement: 20,
  restTimeSpeed: 15,           // how much faster time passes while Laura rests on the couch
  defaultSettings: {
    sfxVolume: 0.8, musicVolume: 0.4, familyFriendly: false,
    animationSpeed: 1, touchControls: "auto", goalsOpen: false,
  },
};
