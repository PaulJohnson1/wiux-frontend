export const constrain = (v, min, max) => {
  return Math.min(max, Math.max(min, v));
}

export const bufferToHex = buffer => {
  return new Uint8Array(buffer).reduce((acc, byte) => {
    acc += (byte | 0x100).toString(16).slice(1, 3);
    return acc;
  }, "");
}

export const lerp = (start, end, time) => {
  return start * (1 - time) + end * time
}
