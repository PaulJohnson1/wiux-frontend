export default class MinimapEntity {
  constructor(game) {
    this.game = game;
  }

  render() {
    this.game.drawCircle({
      x: this.x / 127 * 100 / devicePixelRatio + 125 / devicePixelRatio,
      y: this.y / 127 * 100 / devicePixelRatio + innerHeight - 125 / devicePixelRatio,
      r: this.size / devicePixelRatio,
      color: `hsla(${this.color}, 100%, 50%, 60%)`,
    });
  }
}
