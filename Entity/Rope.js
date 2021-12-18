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
    for (let i = 1; i < this.length; i++) {
      const a = this.segments[i - 1];
      const b = this.segments[i];

      this.game.drawLine({
        fromX: this.game.getSSX(a.x),
        fromY: this.game.getSSY(a.y),
        toX: this.game.getSSX(b.x),
        toY: this.game.getSSY(b.y),
        color: "#888"
      })
    }
  }
}
