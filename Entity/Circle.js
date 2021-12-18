import { constrain } from "../util.js";

export default class Circle {
  constructor(game) {
    this.game = game;
  }

  parseBinary(reader, isCreation) {
    if (isCreation) {
      this.name = reader.string();
      this.style = reader.vu();
      this.color = reader.vu();
      this.alpha = 100;
    }

    this.x = reader.vi();
    this.y = reader.vi();
    this.size = reader.vu();
  }

  render() {
    this.game.drawCircle({
      x: this.game.getSSX(this.x),
      y: this.game.getSSY(this.y),
      r: this.size / this.game.fov / devicePixelRatio,
      color: `hsl(${this.color}, 100%, 50%)`,
    });
  }
}
