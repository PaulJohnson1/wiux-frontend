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

    if (this.style === 0) {
      // food or generator
      this.blurColor = this.color;
      this.alpha = 50;
      this.glow = 15;
    } else {
      // player or flail
      this.blurColor = this.color;
      this.glow = constrain(this.size / 13, 6, 13)
    }

    this.x = reader.vi();
    this.y = reader.vi();
    this.size = reader.vu();
  }

  render(color) {
    this.game.ctx.fillStyle = `hsla(${this.color}, 100%, 50%, ${this.alpha})`;
    this.game.ctx.shadowColor = this.blurColor;
    this.game.ctx.shadowBlur = this.glow;

    const x = this.game.getSSX(this.x);
    const y = this.game.getSSY(this.y);

    this.game.ctx.beginPath();
    this.game.ctx.arc(
      x,
      y,
      this.size / this.game.fov / devicePixelRatio,
      0,
      Math.PI * 2
    );

    this.game.ctx.closePath();
    this.game.ctx.fill();

    this.game.ctx.fillStyle = "#fff"

    const xOffset = this.game.ctx.measureText(this.name).width / 2;
    const yOffset = (this.size + 20) / this.game.fov;

    this.game.ctx.fillText(this.name, x - xOffset, y - yOffset);
  }
}
