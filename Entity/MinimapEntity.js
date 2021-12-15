export default class MinimapEntity {
  constructor(game) {
    this.game = game;
  }

  render() {
    this.game.ctx.fillStyle = `hsl(${this.color}, 100%, 50%)`;
  
    this.game.ctx.beginPath();

    this.game.ctx.arc(
      this.x,
      this.y,
      this.size / devicePixelRatio,
      0,
      Math.PI * 2
    );

    this.game.ctx.closePath();
    this.game.ctx.fill();
  }
}
