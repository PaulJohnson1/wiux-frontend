import RopeSegment from "./RopeSegment.js";

export default class Rope {
  constructor(game) {
    this.game = game;
    this.segments = [];
  }

  parseBinary(reader, isCreation) {
    if (isCreation) {
      this.length = reader.vu();
    }

    for (let i = 0; i < this.length; i++) {
      if (isCreation) this.segments[i] = new RopeSegment(this.game);

      this.segments[i].x = reader.vi();
      this.segments[i].y = reader.vi();
    }
  }

  render() {
    const segments = Array.from(this.segments);

    for (let i = 1; i < segments.length; i++) {
      const a = segments[i - 1];
      const b = segments[i];

      this.game.ctx.beginPath();
      this.game.ctx.moveTo(this.game.getSSX(a.x), this.game.getSSY(a.y));
      this.game.ctx.lineTo(this.game.getSSX(b.x), this.game.getSSY(b.y));

      this.game.ctx.closePath();
      this.game.ctx.stroke();
    }
  }
}
