export default class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  static fromPolar(r, theta) {
    return new Vector(
      r * Math.cos(theta),
      r * Math.sin(theta)
    );
  }

  add(vector) {
    return new Vector(this.x + vector.x, this.y + vector.y);
  }

  subtract(vector) {
    return new Vector(this.x - vector.x, this.y - vector.y);
  }

  scale(scalar) {
    return new Vector(this.x * scalar, this.y * scalar);
  }

  distance(vector) {
    const subtracted = this.subtract(vector);
    return Math.sqrt(Math.pow(subtracted.x, 2) + Math.pow(subtracted.y, 2)); // math.pow(a, b) is faster than a ** b but makes the code less readable
  }

  dot(vector) {
    return this.x * vector.x + this.y * vector.y;
  }

  movePointByAngle(distance, angle) {
    const vec = new Vector(
      distance * Math.cos(angle),
      distance * Math.sin(angle)
    );

    return this.add(vec);
  }

  get mag() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }

  get dir() {
    return Math.atan2(this.y, this.x);
  }

  get unitVector() {
    return new Vector(this.x / this.mag, this.y / this.mag);
  }
}
