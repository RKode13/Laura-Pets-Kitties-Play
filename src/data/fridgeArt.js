// Evan's REAL drawings (photos in src/art/fridge/). Every day the fridge gets
// a fresh random handful of these, plus any new drawings Evan makes in the game.
// To add one: drop a .jpg in src/art/fridge/ and add a line here.
window.LPK = window.LPK || {};

LPK.fridgeArt = {
  perDay: 6,                    // how many real drawings are up on the fridge at a time
  pictures: [
    { id: "halfhalf",     title: "Two Faces, Half and Half" },
    { id: "jester1",      title: "Jester Girl on Wheels" },
    { id: "ladybugs",     title: "Ladybug Garden" },
    { id: "featherbird",  title: "Purple-Feather Bird" },
    { id: "threepals",    title: "Three Pals" },
    { id: "angryorange",  title: "Angry Orange (and Friends)" },
    { id: "airplanes",    title: "Airplanes: First Flight" },
    { id: "rainbowface",  title: "Rainbow Monster" },
    { id: "undersea",     title: "Under the Sea" },
    { id: "greenmonster", title: "Green Monster" },
    { id: "bluespider",   title: "Blue Spider" },
    { id: "purpleguy",    title: "Purple Guy" },
    { id: "spongeguy",    title: "Sponge Guy" },
    { id: "jester2",      title: "Jester Doll" },
    { id: "jester3",      title: "Jester with Glasses" },
    { id: "bear",         title: "Bear in a Plaid Shirt (Art Show pick!)" },
  ],
};
// preload the photos
LPK.fridgeArt.pictures.forEach(p => { p.img = new Image(); p.img.src = `src/art/fridge/${p.id}.jpg`; });
