import { constrain, lerp } from "../util.js";

export default class Circle {
  constructor(game) {
    this.game = game;
    this.startX = 0;
    this.startY = 0;
    this.destinationX = 0;
    this.destinationY = 0;
  }

  parseBinary(reader, isCreation) {
    if (isCreation) {
      this.name = reader.string();
      this.style = reader.vu();
      this.color = reader.vu();
      this.alpha = 100;
    }

    this.startX = this.destinationX;
    this.startY = this.destinationY;

    this.destinationX = reader.vi();
    this.destinationY = reader.vi();

    this.size = reader.vu();
  }

  render(deltaTick) {
    this.x = lerp(this.startX, this.destinationX, deltaTick)
    this.y = lerp(this.startY, this.destinationY, deltaTick)

    this.game.drawCircle({
      x: this.game.getSSX(this.x),
      y: this.game.getSSY(this.y),
      r: this.size / this.game.fov / devicePixelRatio,
      color: `hsl(${this.color}, 100%, 50%)`,
    });
  }
}
