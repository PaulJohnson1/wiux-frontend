// this code is sloppy, go look at the neat code on the backend instead

import Game from "./Game.js";

const game = new Game(
  document.getElementById("canvas"),
  [
    document.getElementById("input"),
    document.getElementById("spawn"),
    document.getElementById("background"),
    document.getElementById("discord"),
    document.getElementById("legal"),
  ]
);

window.game = game; // ill just remove this if scripts becomes an issue
