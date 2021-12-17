import { Writer } from "../Coder.js";

export default class Upgrade {
  constructor(game, x, y, name, max) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.name = name;
    this.max = max;
    this.value = 0;
    this.width = 150;
    this.height = 40;
    this.id = game.nextUpgradeId++;

    this.game.canvas.addEventListener("mousedown", ({ clientX, clientY }) => {
      clientX *= devicePixelRatio;
      clientY *= devicePixelRatio;

      if (
        clientX < this.x ||
        clientX > this.x + this.width ||
        clientY > this.y + this.height ||
        clientY < this.y
      ) return;

      const writer = new Writer();
      writer.vu(2);
      writer.vu(this.id);

      this.game.socket.send(writer.write());
    });
  }

  render() {
    this.game.ctx.globalAlpha = 0.6;
    this.game.ctx.strokeStyle = `#777`;
    this.game.ctx.lineWidth = 3.5 * devicePixelRatio;
    this.game.ctx.fillStyle = `hsl(${this.id * 30}, 100%, 50%)`;
    this.game.ctx.shadowColor = this.game.ctx.strokeStyle;
    this.game.ctx.shadowBlur = 10;
    this.game.ctx.fillRoundRect(
      this.x / devicePixelRatio,
      this.y / devicePixelRatio,
      this.width / devicePixelRatio,
      this.height / devicePixelRatio,
      6 / devicePixelRatio
    );
    this.game.ctx.stroke();
    this.game.ctx.font = `${12 / devicePixelRatio}px Ubuntu`;
    this.game.ctx.fillStyle = "#000";
    this.game.ctx.fillText(
      this.name,
      (this.x + 10) / devicePixelRatio,
      (this.y + 45 / 2) / devicePixelRatio
    );

    this.game.ctx.font = `${20 / devicePixelRatio}px Ubuntu`;

    this.game.ctx.fillText(
      this.value,
      (this.x + 100) / devicePixelRatio,
      (this.y + 45 / 2) / devicePixelRatio
    );
  }
}
