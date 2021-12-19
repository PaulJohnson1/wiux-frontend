import { Writer } from "../Coder.js";

export default class Upgrade {
  constructor(game, x, y, name, max) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.name = name;
    this.max = max;
    this.value = 0;
    this.baseWidth = 20;
    this.width = this.baseWidth;
    this.widthIncrement = 25;
    this.maxWidth = this.baseWidth + this.widthIncrement * max;
    this.height = 40;
    this.id = game.nextUpgradeId++;

    this.game.canvas.addEventListener("mousedown", ({ clientX, clientY }) => {
      clientX *= devicePixelRatio;
      clientY *= devicePixelRatio;

      if (
        clientX < this.x ||
        clientX > this.x + this.maxWidth ||
        clientY > this.y + this.height ||
        clientY < this.y
      ) return;

      const writer = new Writer();
      writer.vu(2);
      writer.vu(this.id);

      this.game.socket.send(writer.write());
    });

    if (this.id < 10) {
      const keyCode = "Digit" + this.id;
      this.game.canvas.addEventListener('keyup', (key) => {
        if (key.code === keyCode) {
          const writer = new Writer();
          writer.vu(2);
          writer.vu(this.id);

          this.game.socket.send(writer.write());
        }
      });
    }
  }

  render() {
    this.width = this.baseWidth + this.value * this.widthIncrement;
    
    // this.game.ctx.strokeStyle = `#777`;
    // // this.game.ctx.lineWidth = 3.5 * devicePixelRatio;
    // this.game.ctx.fillStyle = `hsla(${this.id * 30}, 100%, 50%, 20%)`;
    // // this.game.ctx.shadowColor = this.game.ctx.strokeStyle;
    // // this.game.ctx.shadowBlur = 10;
    // this.game.ctx.fillRoundRect(
    //   this.x / devicePixelRatio,
    //   this.y / devicePixelRatio,
    //   this.maxWidth / devicePixelRatio,
    //   this.height / devicePixelRatio,
    //   6 / devicePixelRatio
    // );

    // this.game.ctx.fillStyle = `hsl(${this.id * 30}, 100%, 50%)`;

    // this.game.ctx.fillRoundRect(
    //   this.x / devicePixelRatio,
    //   this.y / devicePixelRatio,
    //   this.width / devicePixelRatio,
    //   this.height / devicePixelRatio,
    //   6 / devicePixelRatio
    // );

    // this.game.ctx.stroke();
    // this.game.ctx.font = `${12 / devicePixelRatio}px Ubuntu`;
    // const offset1 = this.game.ctx.measureText(this.name).width / 2;
    // this.game.ctx.fillStyle = "#000";
    // this.game.ctx.fillText(
    //   this.name,
    //   (this.x + 10) / devicePixelRatio,
    //   (this.y + this.height / 2 + offset1) / devicePixelRatio
    // );

    // this.game.ctx.font = `${20 / devicePixelRatio}px Ubuntu`;

    // const offset2 = this.game.ctx.measureText(this.value).width / 2;
    // this.game.ctx.fillText(
    //   this.value,
    //   (this.maxWidth - 10) / devicePixelRatio,
    //   (this.y + this.height / 2 + offset2) / devicePixelRatio
    // );

    this.game.drawRoundRect({
      x: this.x / devicePixelRatio,
      y: this.y / devicePixelRatio,
      w: this.maxWidth / devicePixelRatio,
      h: this.height / devicePixelRatio,
      r: 6 / devicePixelRatio,
      color: `hsla(${this.id * 30}, 100%, 50%, 20%)`
    });

    this.game.drawRoundRect({
      x: this.x / devicePixelRatio,
      y: this.y / devicePixelRatio,
      w: this.width / devicePixelRatio,
      h: this.height / devicePixelRatio,
      r: 6 / devicePixelRatio,
      color: `hsl(${this.id * 30}, 100%, 50%)`,
      strokeColor: "#777",
      glowColor: "#777",
      strokeWidth: 3.5 / devicePixelRatio,
      glow: 10 / devicePixelRatio
    });

    this.game.drawText({
      x: (this.x + 10) / devicePixelRatio,
      y: (this.y + this.height / 2 + 3) / devicePixelRatio,
      text: this.name,
      font: `${12 / devicePixelRatio}px Ubuntu`,
      color: `#000`
    });

    this.game.drawText({
      x: (this.maxWidth - 10) / devicePixelRatio,
      y: (this.y + this.height / 2 + 5) / devicePixelRatio,
      text: this.value,
      font: `${20 / devicePixelRatio}px Ubuntu`,
      color: "#000"
    });
  }
}
