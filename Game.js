import { Reader, Writer } from "./Coder.js";
import Circle from "./Entity/Circle.js";
import MinimapEntity from "./Entity/MinimapEntity.js";
import Rope from "./Entity/Rope.js";
import unshuffle from "./unshuffle.js";
import nothing from "./sha256.js";

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

    this.memory = new WebAssembly.Memory({
      initial: 1024,
      maximum: 1024,
    });

    this.HEAPU8 = new Uint8Array(this.memory.buffer);

    WebAssembly.instantiate(
      new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 12, 2, 96, 3, 127, 127, 127, 0, 96, 1,
        127, 1, 127, 2, 16, 1, 1, 97, 6, 109, 101, 109, 111, 114, 121, 2, 1,
        128, 8, 128, 8, 3, 3, 2, 0, 1, 7, 23, 2, 9, 103, 101, 116, 82, 97, 110,
        100, 111, 109, 0, 0, 7, 115, 104, 117, 102, 102, 108, 101, 0, 1, 10, 86,
        2, 49, 1, 1, 127, 32, 0, 33, 3, 2, 64, 3, 64, 32, 3, 32, 1, 75, 13, 1,
        32, 3, 32, 3, 44, 0, 0, 32, 2, 16, 1, 65, 255, 1, 113, 115, 58, 0, 0,
        32, 3, 65, 1, 106, 33, 3, 12, 0, 11, 11, 11, 34, 0, 32, 0, 32, 0, 40, 2,
        0, 65, 191, 150, 131, 4, 108, 65, 1, 106, 65, 205, 155, 238, 214, 6,
        111, 54, 2, 0, 32, 0, 40, 2, 0, 15, 11, 0, 23, 4, 110, 97, 109, 101, 2,
        14, 255, 255, 255, 255, 7, 0, 255, 255, 255, 255, 7, 0, 3, 65, 66, 67,
      ]),
      {
        a: { memory: this.memory },
      }
    ).then((wasm) => (this.wasm = wasm));

    this.fov = 1;

    this.mouse = {};

    this.upgrades = [
      {
        y: 50 * 0,
        name: "flail knockback",
        value: 0,
        hue: 0,
        id: 0,
      },
      {
        y: 50 * 1,
        name: "flail resistance",
        value: 0,
        hue: 10,
        id: 1,
      },
      {
        y: 50 * 2,
        name: "flail friction",
        value: 0,
        hue: 20,
        id: 2,
      },
      {
        y: 50 * 3,
        name: "rope tightness",
        value: 0,
        hue: 30,
        id: 3,
      },
      {
        y: 50 * 4,
        name: "rope rest length",
        value: 0,
        hue: 40,
        id: 4,
      },
      {
        y: 50 * 5,
        name: "speed",
        value: 0,
        hue: 50,
        id: 5,
      },
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

      this.mouse.angle = Math.atan2(clientY, clientX);
      this.mouse.distance = Math.sqrt(clientX ** 2 + clientY ** 2);
    });

    this.canvas.addEventListener("mousedown", ({ clientX, clientY }) => {
      this.mouse.pressed = true;

      for (const upgrade of this.upgrades) {
        if (
          clientX > 0 &&
          clientX < 150 &&
          clientY < upgrade.y + 40 &&
          clientY > upgrade.y
        ) {
          const writer = new Writer();
          writer.vu(2);
          writer.vu(upgrade.id);

          this.socket.send(writer.write());
        }
      }
    });

    this.canvas.addEventListener("mouseup", () => {
      this.mouse.pressed = false;
    });

    this.socket.addEventListener("message", ({ data }) => {
      this.socket.bitsRecieved += new Uint8Array(data).length * 8;
      this.socket.packetsRecieved++;

      // console.log("bits per second recieved", this.socket.bitsRecieved / this.socket.packetsRecieved * 60);

      const reader = new Reader(unshuffle(this, data));

      try {
        this.parseUpdate(reader);
      } catch (error) {
        alert(`${error.message}\n${error.stack}`);
      }
    });
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
      this.world.map.clear()    ;

      while (true) {
        const x = reader.vi();

        if (x === 1234) break;

        const circle = new MinimapEntity(this);
        circle.x = x / 127 * 100 + 125;
        circle.y = reader.vi() / 127 * 100 + innerHeight - 125;
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

  getSSX(worldX) {
    return (
      ((this.player.x - worldX) / this.fov +
        (window.innerWidth / 2) * devicePixelRatio) /
      devicePixelRatio
    );
  }

  getSSY(worldY) {
    return (
      ((this.player.y - worldY) / this.fov +
        (window.innerHeight / 2) * devicePixelRatio) /
      devicePixelRatio
    );
  }

  render() {
    // background color for outside of the map
    this.ctx.fillStyle = "#333";
    this.ctx.beginPath();
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    this.ctx.closePath();

    this.ctx.fillStyle = "#444";
    this.ctx.beginPath();
    this.ctx.arc(
      this.getSSX(0),
      this.getSSY(0),
      this.world.size / this.fov / devicePixelRatio,
      0,
      Math.PI * 2
    );
    this.ctx.closePath();
    this.ctx.fill();

    // rendering grid
    const increment = 50 / devicePixelRatio;

    const xOffset = this.getSSX(0) % increment;
    const yOffset = this.getSSY(0) % increment;

    this.ctx.strokeStyle = "#4f4f4f";

    for (let x = 0; x < window.innerWidth; x += increment) {
      this.ctx.beginPath();
      this.ctx.moveTo(x + xOffset, 0);
      this.ctx.lineTo(x + xOffset, window.innerHeight);
      this.ctx.closePath();
      this.ctx.stroke();
    }

    for (let y = 0; y < window.innerHeight + increment; y += increment) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y + yOffset);
      this.ctx.lineTo(window.innerWidth, y + yOffset);
      this.ctx.closePath();
      this.ctx.stroke();
    }

    this.world.entities.forEach((entity) => {
      if (entity instanceof Rope) entity.render();
    });

    this.world.entities.forEach((entity) => {
      if (entity instanceof Rope) return;

      entity.render();
    });

    this.ctx.globalAlpha = 0.6;

    for (const upgrade of this.upgrades) {
      this.ctx.fillStyle = `hsl(${upgrade.hue}, 100%, 50%)`;
      this.ctx.shadowBlur = 0;
      this.ctx.fillRoundRect(
        0,
        upgrade.y / devicePixelRatio,
        150 / devicePixelRatio,
        40 / devicePixelRatio,
        6
      );

      this.ctx.fontSize = "12px";
      this.ctx.fillStyle = "#000";
      this.ctx.fillText(
        upgrade.name,
        10 / devicePixelRatio,
        (upgrade.y + 45 / 2) / devicePixelRatio
      );

      this.ctx.fontSize = "20px";

      this.ctx.fillText(
        upgrade.value,
        100 / devicePixelRatio,
        (upgrade.y + 45 / 2) / devicePixelRatio
      );
    }

    // minimap
    this.ctx.fillStyle = "#555";
    this.ctx.beginPath();
    this.ctx.arc(125, window.innerHeight - 125, 100, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.closePath();

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
    if (this.player) {
      const you = new MinimapEntity(this);
      you.x = -this.player.x / this.world.size * 100 + 125;
      you.y = -this.player.y / this.world.size * 100 + innerHeight - 125;
      you.color = this.player.color;
      you.size = 2;
      this.world.map.add(you);
    }

    const elementsStyle = this.player == null ? "" : "none";

    this.elements.forEach((e) => (e.style.display = elementsStyle));

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    if (this.player) this.render();
    this.sendUpdate();
  }
}
