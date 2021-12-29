class Shuffler {
  static shuffle(packet) {
    const u8 = new Uint8Array(packet);

    Module.HEAPU8.set(new Uint8Array([...u8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), 600000);

    Module.shuffle(0, 16777212, u8.length);

    return Module.HEAPU8.slice(600000, 600000 + Module.HEAP32[16777212 >> 2]);
  }

  static unshuffle(packet) {
    const u8 = new Uint8Array(packet);

    Module.HEAPU8.set(new Uint8Array([...u8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), 600000);

    Module.unshuffle(600000, u8.length);

    return Module.HEAPU8.slice(600000, 600000 + u8.length);
  }
}

export default Shuffler;
