import { Reader, Writer } from "./Coder.js";
import Circle from "./Entity/Circle.js";
import MinimapEntity from "./Entity/MinimapEntity.js";
import Rope from "./Entity/Rope.js";
import Upgrade from "./Gui/Upgrade.js";
import nothing from "./sha256.js"

// thank you tom :D
CanvasRenderingContext2D.prototype.fillRoundRect = function (
  x,
  y,
  width,
  height,
  r
) {
  const ctx = this;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
};

export default class Game {
  constructor(canvas, elements) {
    this.canvas = canvas;
    this.elements = elements;

    this.ctx = canvas.getContext("2d");
    this.socket = new WebSocket("wss://wiux-backend.pauljohnson11.repl.co");
    this.socket.binaryType = "arraybuffer";
    this.socket.bitsRecieved = 0;
    this.socket.packetsRecieved = 0;
    this.nextUpgradeId = 0;

    this.ticksPerSecond = 20;

    this.fov = 1;
    this.fps = 60;

    this.framesSinceLastTick = 0;

    this.mouse = {};

    this.camera = {
      x: 0,
      y: 0
    }

    this.upgrades = [
      new Upgrade(this, 25, 50 * 0 + 25, "Flail Knockback", 10),
      new Upgrade(this, 25, 50 * 1 + 25, "Flail Resistance", 10),
      new Upgrade(this, 25, 50 * 2 + 25, "Flail Friction", 10),
      new Upgrade(this, 25, 50 * 3 + 25, "Rope Tightness", 10),
      new Upgrade(this, 25, 50 * 4 + 25, "Rope Rest length", 10),
      new Upgrade(this, 25, 50 * 5 + 25, "Speed", 10),
    ];

    this.stats = 0;

    this.world = {
      id: null,
      size: 0,
      _entities: {},
      entities: new Set(),
      map: new Set(),
    };

    this.elements[1].onclick = () => {
      this.sendSpawn(this.elements[0].value);
    };

    this.canvas.addEventListener("mousemove", ({ clientX, clientY }) => {
      clientX -= window.innerWidth / 2;
      clientY -= window.innerHeight / 2;

      clientX *= devicePixelRatio;
      clientY *= devicePixelRatio;

      this.mouse.angle = Math.atan2(clientY, clientX);
      this.mouse.distance = Math.sqrt(clientX ** 2 + clientY ** 2);
    });

    this.canvas.addEventListener("mousedown", ({ clientX, clientY }) => {
      clientX *= devicePixelRatio;
      clientY *= devicePixelRatio;

      this.mouse.pressed = true;
    });

    this.canvas.addEventListener("mouseup", () => {
      this.mouse.pressed = false;
    });

    this.socket.addEventListener("message", ({ data }) => {
      this.socket.bitsRecieved += new Uint8Array(data).length * 8;
      this.socket.packetsRecieved++;

      // console.log("bits per second recieved", this.socket.bitsRecieved / this.socket.packetsRecieved * 60);

      const reader = new Reader(data);

      try {
        this.parseUpdate(reader);
      } catch (error) {
        alert(`${error.message}\n${error.stack}`);
      }
    });

    this.lastTickTime = Date.now() - 1;

    this.updateCamera();
  }

  get framesPerTick() {
    return this.fps / this.ticksPerSecond;
  }

  updateCamera() {
    const frameDeltaTime = Date.now() - this.lastTickTime;

    this.framesSinceLastTick++;
    requestAnimationFrame((() => this.updateCamera()));

    if (this.player) {
      this.camera.x += (this.player.x - this.camera.x) / (2 * frameDeltaTime);
      this.camera.y += (this.player.y - this.camera.y) / (2 * frameDeltaTime);

      // just in case nan happens to attempt to ruin our day
      this.camera.x ||= 0;
      this.camera.y ||= 0;
      
      this.render(this.framesSinceLastTick / this.framesPerTick);
    }
 
    this.lastTickTime = Date.now();
  }

  parseUpdate(reader) {
    const type = reader.vu();

    if (type === 1) {
      const size = reader.vu();

      this.world.size = size;
    } else if (type === 2) {
      const id = reader.vu();

      this.world.id = id;
    } else if (type === 3) {
      for (let i = 0; i < this.upgrades.length; i++) {
        this.upgrades[i].value = reader.vu();
      }
      this.stats = reader.vu();
    } else if (type === 4) {
      const toHash = reader.string();
      const hashed = sha256(toHash);

      const writer = new Writer();
      writer.vu(3);
      writer.string(hashed);

      this.socket.send(writer.write());
    } else if (type === 5) {
      this.world.map.clear();

      while (true) {
        const x = reader.vi();

        if (x === 1234) break;

        const circle = new MinimapEntity(this);
        circle.x = x;
        circle.y = reader.vi();
        circle.color = reader.vu();
        circle.size = reader.vu() / this.world.size * 100;

        this.world.map.add(circle);
      }
    } else if (type === 0) {
      while (true) {
        const id = reader.vu();
        if (id === 0) break;
        delete this.world._entities[id];
      }

      while (true) {
        const id = reader.vu();
        if (id === 0) break;
        const isCreation = reader.vu();

        if (isCreation) {
          let entity = null;
          const type = reader.vu();

          if (type === 1) entity = new Circle(this);
          else if (type === 2) entity = new Rope(this);

          entity.id = id;
          this.world._entities[entity.id] = entity;
        }

        this.world._entities[id].parseBinary(reader, isCreation);
      }

      this.world.entities = new Set();

      for (const id in this.world._entities) {
        this.world.entities.add(this.world._entities[id]);
      }

      this.tick();
    }
  }

  sendSpawn(name) {
    const writer = new Writer();
    writer.vu(1);
    writer.string(name);

    this.socket.send(writer.write());
  }

  getSSX(worldX, scale = true) {
    return !scale ?
      (this.camera.x - worldX) / this.fov + innerWidth / 2 :
      (this.camera.x - worldX) / this.fov / devicePixelRatio + innerWidth / 2;
  }

  getSSY(worldY, scale = true) {
    return !scale ?
      (this.camera.y - worldY) / this.fov + innerHeight / 2 :
      (this.camera.y - worldY) / this.fov / devicePixelRatio + innerHeight / 2;
  }

  drawCircle({ x, y, r, color, strokeColor, glowColor, strokeWidth, glow }) {
    this.ctx.fillStyle = color;
    this.ctx.strokeColor = strokeColor;
    this.ctx.shadowBlur = glow || 0;
    this.ctx.shadowColor = glowColor;
    this.ctx.lineWidth = strokeWidth || 1;
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.closePath();
    this.ctx.fill();
    if (strokeColor) this.ctx.stoke();
  }

  drawRect({ x, y, w, h, color, strokeColor, glowColor, strokeWidth, glow }) {
    this.ctx.fillStyle = color;
    this.ctx.strokeColor = strokeColor;
    this.ctx.shadowBlur = glow || 0;
    this.ctx.shadowColor = glowColor;
    this.ctx.lineWidth = strokeWidth || 1;
    this.ctx.beginPath();
    this.ctx.rect(x, y, w, h);
    this.ctx.closePath();
    this.ctx.fill();
    if (strokeColor) this.ctx.stoke();
  }

  drawLine({ fromX, fromY, toX, toY, color, glowColor, strokeWidth, glow }) {
    this.ctx.strokeStyle = color;
    this.ctx.shadowBlur = glow || 0;
    this.ctx.shadowColor = glowColor;
    this.ctx.lineWidth = strokeWidth || 1;
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    this.ctx.closePath();
    this.ctx.stroke();
  }

  drawRoundRect({ x, y, w, h, r, color, strokeColor, glowColor, strokeWidth, glow }) {
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = strokeColor;
    this.ctx.shadowBlur = glow || 0;
    this.ctx.shadowColor = glowColor;
    this.ctx.lineWidth = strokeWidth || 1;
    this.ctx.beginPath();
    this.ctx.fillRoundRect(x, y, w, h, r);
    this.ctx.closePath();
    if (strokeColor) this.ctx.stroke();
  }

  drawText({ x, y, text, font, color, strokeColor, glowColor, strokeWidth, glow }) {
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = strokeColor;
    this.ctx.shadowBlur = glow || 0;
    this.ctx.shadowColor = glowColor;
    this.ctx.lineWidth = strokeWidth || 1;
    this.ctx.beginPath();
    this.ctx.font = font || "";
    this.ctx.fillText(text, x, y);
    this.ctx.closePath();
    if (strokeColor) this.ctx.stroke();
  }

  render(deltaTick) {
    // clear the canvas
    this.drawRect({
      x: 0,
      y: 0,
      w: innerWidth,
      h: innerHeight,
      color: "#333"
    });

    // draw the map
    this.drawCircle({
      x: this.getSSX(0),
      y: this.getSSY(0),
      r: this.world.size / this.fov / devicePixelRatio,
      color: "#444"
    });

    // draw the grid
    const increment = 50 / this.fov / devicePixelRatio;

    const xOffset = this.getSSX(0) % increment;
    const yOffset = this.getSSY(0) % increment;

    for (let x = 0; x < innerWidth + increment; x += increment) {
      this.drawLine({
        fromX: x + xOffset,
        fromY: 0,
        toX: x + xOffset,
        toY: innerHeight,
        color: "#4f4f4f"
      });
    }

    for (let y = 0; y < innerHeight + increment; y += increment) {
      this.drawLine({
        fromX: 0,
        fromY: y + yOffset,
        toX: innerWidth,
        toY: y + yOffset,
        color: "#4f4f4f"
      });
    }

    this.world.entities.forEach(entity => entity.render(deltaTick));
    this.upgrades.forEach(upgrade => upgrade.render());

    this.drawCircle({
      x: 125 / devicePixelRatio,
      y: innerHeight - 125 / devicePixelRatio,
      r: 100 / devicePixelRatio,
      color: "#3337"
    })
    this.world.map.forEach(entity => entity.render());
  }

  sendUpdate() {
    const writer = new Writer();
    writer.vu(0);
    writer.vu(this.mouse.pressed);
    writer.vi(this.mouse.angle * 64);
    writer.vi(this.mouse.distance);

    this.socket.send(writer.write());
  }

  get player() {
    return this.world._entities[this.world.id];
  }

  tick() {
    new Promise(resolve =>
      requestAnimationFrame(t1 =>
        requestAnimationFrame(t2 => resolve(1000 / (t2 - t1)))
      )
    ).then(fps => this.fps = (this.fps + fps) / 2)

    this.framesSinceLastTick = 0;

    const elementsStyle = this.player == null ? "" : "none";

    this.elements.forEach((e) => (e.style.display = elementsStyle));

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    if (this.player) {
      this.sendUpdate();
    }
  }
}
