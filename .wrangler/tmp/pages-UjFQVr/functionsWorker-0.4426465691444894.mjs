var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../node_modules/@noble/hashes/_u64.js
var U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
var _32n = /* @__PURE__ */ BigInt(32);
function fromBig(n, le = false) {
  if (le)
    return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
  return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
__name(fromBig, "fromBig");
var rotrSH = /* @__PURE__ */ __name((h, l, s) => h >>> s | l << 32 - s, "rotrSH");
var rotrSL = /* @__PURE__ */ __name((h, l, s) => h << 32 - s | l >>> s, "rotrSL");
var rotrBH = /* @__PURE__ */ __name((h, l, s) => h << 64 - s | l >>> s - 32, "rotrBH");
var rotrBL = /* @__PURE__ */ __name((h, l, s) => h >>> s - 32 | l << 64 - s, "rotrBL");
var rotr32H = /* @__PURE__ */ __name((_h, l) => l, "rotr32H");
var rotr32L = /* @__PURE__ */ __name((h, _l) => h, "rotr32L");
function add(Ah, Al, Bh, Bl) {
  const l = (Al >>> 0) + (Bl >>> 0);
  return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
}
__name(add, "add");
var add3L = /* @__PURE__ */ __name((Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0), "add3L");
var add3H = /* @__PURE__ */ __name((low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0, "add3H");

// ../node_modules/@noble/hashes/utils.js
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
__name(isBytes, "isBytes");
function anumber(n, title = "") {
  if (!Number.isSafeInteger(n) || n < 0) {
    const prefix = title && `"${title}" `;
    throw new Error(`${prefix}expected integer >= 0, got ${n}`);
  }
}
__name(anumber, "anumber");
function abytes(value, length, title = "") {
  const bytes = isBytes(value);
  const len = value?.length;
  const needsLen = length !== void 0;
  if (!bytes || needsLen && len !== length) {
    const prefix = title && `"${title}" `;
    const ofLen = needsLen ? ` of length ${length}` : "";
    const got = bytes ? `length=${len}` : `type=${typeof value}`;
    throw new Error(prefix + "expected Uint8Array" + ofLen + ", got " + got);
  }
  return value;
}
__name(abytes, "abytes");
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
__name(aexists, "aexists");
function aoutput(out, instance) {
  abytes(out, void 0, "digestInto() output");
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error('"digestInto() output" expected to be of length >=' + min);
  }
}
__name(aoutput, "aoutput");
function u8(arr) {
  return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}
__name(u8, "u8");
function u32(arr) {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
__name(u32, "u32");
function clean(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
__name(clean, "clean");
var isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
function byteSwap(word) {
  return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
__name(byteSwap, "byteSwap");
var swap8IfBE = isLE ? (n) => n : (n) => byteSwap(n);
function byteSwap32(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = byteSwap(arr[i]);
  }
  return arr;
}
__name(byteSwap32, "byteSwap32");
var swap32IfBE = isLE ? (u) => u : byteSwap32;
function utf8ToBytes(str) {
  if (typeof str !== "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(str));
}
__name(utf8ToBytes, "utf8ToBytes");
function kdfInputToBytes(data, errorTitle = "") {
  if (typeof data === "string")
    return utf8ToBytes(data);
  return abytes(data, void 0, errorTitle);
}
__name(kdfInputToBytes, "kdfInputToBytes");
function createHasher(hashCons, info = {}) {
  const hashC = /* @__PURE__ */ __name((msg, opts) => hashCons(opts).update(msg).digest(), "hashC");
  const tmp = hashCons(void 0);
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = (opts) => hashCons(opts);
  Object.assign(hashC, info);
  return Object.freeze(hashC);
}
__name(createHasher, "createHasher");

// ../node_modules/@noble/hashes/_blake.js
var BSIGMA = /* @__PURE__ */ Uint8Array.from([
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  14,
  10,
  4,
  8,
  9,
  15,
  13,
  6,
  1,
  12,
  0,
  2,
  11,
  7,
  5,
  3,
  11,
  8,
  12,
  0,
  5,
  2,
  15,
  13,
  10,
  14,
  3,
  6,
  7,
  1,
  9,
  4,
  7,
  9,
  3,
  1,
  13,
  12,
  11,
  14,
  2,
  6,
  5,
  10,
  4,
  0,
  15,
  8,
  9,
  0,
  5,
  7,
  2,
  4,
  10,
  15,
  14,
  1,
  11,
  12,
  6,
  8,
  3,
  13,
  2,
  12,
  6,
  10,
  0,
  11,
  8,
  3,
  4,
  13,
  7,
  5,
  15,
  14,
  1,
  9,
  12,
  5,
  1,
  15,
  14,
  13,
  4,
  10,
  0,
  7,
  6,
  3,
  9,
  2,
  8,
  11,
  13,
  11,
  7,
  14,
  12,
  1,
  3,
  9,
  5,
  0,
  15,
  4,
  8,
  6,
  2,
  10,
  6,
  15,
  14,
  9,
  11,
  3,
  0,
  8,
  12,
  2,
  13,
  7,
  1,
  4,
  10,
  5,
  10,
  2,
  8,
  4,
  7,
  6,
  1,
  5,
  15,
  11,
  9,
  14,
  3,
  12,
  13,
  0,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  14,
  10,
  4,
  8,
  9,
  15,
  13,
  6,
  1,
  12,
  0,
  2,
  11,
  7,
  5,
  3,
  // Blake1, unused in others
  11,
  8,
  12,
  0,
  5,
  2,
  15,
  13,
  10,
  14,
  3,
  6,
  7,
  1,
  9,
  4,
  7,
  9,
  3,
  1,
  13,
  12,
  11,
  14,
  2,
  6,
  5,
  10,
  4,
  0,
  15,
  8,
  9,
  0,
  5,
  7,
  2,
  4,
  10,
  15,
  14,
  1,
  11,
  12,
  6,
  8,
  3,
  13,
  2,
  12,
  6,
  10,
  0,
  11,
  8,
  3,
  4,
  13,
  7,
  5,
  15,
  14,
  1,
  9
]);

// ../node_modules/@noble/hashes/blake2.js
var B2B_IV = /* @__PURE__ */ Uint32Array.from([
  4089235720,
  1779033703,
  2227873595,
  3144134277,
  4271175723,
  1013904242,
  1595750129,
  2773480762,
  2917565137,
  1359893119,
  725511199,
  2600822924,
  4215389547,
  528734635,
  327033209,
  1541459225
]);
var BBUF = /* @__PURE__ */ new Uint32Array(32);
function G1b(a, b, c, d, msg, x) {
  const Xl = msg[x], Xh = msg[x + 1];
  let Al = BBUF[2 * a], Ah = BBUF[2 * a + 1];
  let Bl = BBUF[2 * b], Bh = BBUF[2 * b + 1];
  let Cl = BBUF[2 * c], Ch = BBUF[2 * c + 1];
  let Dl = BBUF[2 * d], Dh = BBUF[2 * d + 1];
  let ll = add3L(Al, Bl, Xl);
  Ah = add3H(ll, Ah, Bh, Xh);
  Al = ll | 0;
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotr32H(Dh, Dl), Dl: rotr32L(Dh, Dl) });
  ({ h: Ch, l: Cl } = add(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrSH(Bh, Bl, 24), Bl: rotrSL(Bh, Bl, 24) });
  BBUF[2 * a] = Al, BBUF[2 * a + 1] = Ah;
  BBUF[2 * b] = Bl, BBUF[2 * b + 1] = Bh;
  BBUF[2 * c] = Cl, BBUF[2 * c + 1] = Ch;
  BBUF[2 * d] = Dl, BBUF[2 * d + 1] = Dh;
}
__name(G1b, "G1b");
function G2b(a, b, c, d, msg, x) {
  const Xl = msg[x], Xh = msg[x + 1];
  let Al = BBUF[2 * a], Ah = BBUF[2 * a + 1];
  let Bl = BBUF[2 * b], Bh = BBUF[2 * b + 1];
  let Cl = BBUF[2 * c], Ch = BBUF[2 * c + 1];
  let Dl = BBUF[2 * d], Dh = BBUF[2 * d + 1];
  let ll = add3L(Al, Bl, Xl);
  Ah = add3H(ll, Ah, Bh, Xh);
  Al = ll | 0;
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotrSH(Dh, Dl, 16), Dl: rotrSL(Dh, Dl, 16) });
  ({ h: Ch, l: Cl } = add(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrBH(Bh, Bl, 63), Bl: rotrBL(Bh, Bl, 63) });
  BBUF[2 * a] = Al, BBUF[2 * a + 1] = Ah;
  BBUF[2 * b] = Bl, BBUF[2 * b + 1] = Bh;
  BBUF[2 * c] = Cl, BBUF[2 * c + 1] = Ch;
  BBUF[2 * d] = Dl, BBUF[2 * d + 1] = Dh;
}
__name(G2b, "G2b");
function checkBlake2Opts(outputLen, opts = {}, keyLen, saltLen, persLen) {
  anumber(keyLen);
  if (outputLen < 0 || outputLen > keyLen)
    throw new Error("outputLen bigger than keyLen");
  const { key, salt, personalization } = opts;
  if (key !== void 0 && (key.length < 1 || key.length > keyLen))
    throw new Error('"key" expected to be undefined or of length=1..' + keyLen);
  if (salt !== void 0)
    abytes(salt, saltLen, "salt");
  if (personalization !== void 0)
    abytes(personalization, persLen, "personalization");
}
__name(checkBlake2Opts, "checkBlake2Opts");
var _BLAKE2 = class {
  static {
    __name(this, "_BLAKE2");
  }
  buffer;
  buffer32;
  finished = false;
  destroyed = false;
  length = 0;
  pos = 0;
  blockLen;
  outputLen;
  constructor(blockLen, outputLen) {
    anumber(blockLen);
    anumber(outputLen);
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.buffer = new Uint8Array(blockLen);
    this.buffer32 = u32(this.buffer);
  }
  update(data) {
    aexists(this);
    abytes(data);
    const { blockLen, buffer, buffer32 } = this;
    const len = data.length;
    const offset = data.byteOffset;
    const buf = data.buffer;
    for (let pos = 0; pos < len; ) {
      if (this.pos === blockLen) {
        swap32IfBE(buffer32);
        this.compress(buffer32, 0, false);
        swap32IfBE(buffer32);
        this.pos = 0;
      }
      const take = Math.min(blockLen - this.pos, len - pos);
      const dataOffset = offset + pos;
      if (take === blockLen && !(dataOffset % 4) && pos + take < len) {
        const data32 = new Uint32Array(buf, dataOffset, Math.floor((len - pos) / 4));
        swap32IfBE(data32);
        for (let pos32 = 0; pos + blockLen < len; pos32 += buffer32.length, pos += blockLen) {
          this.length += blockLen;
          this.compress(data32, pos32, false);
        }
        swap32IfBE(data32);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      this.length += take;
      pos += take;
    }
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    const { pos, buffer32 } = this;
    this.finished = true;
    clean(this.buffer.subarray(pos));
    swap32IfBE(buffer32);
    this.compress(buffer32, 0, true);
    swap32IfBE(buffer32);
    const out32 = u32(out);
    this.get().forEach((v, i) => out32[i] = swap8IfBE(v));
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    const { buffer, length, finished, destroyed, outputLen, pos } = this;
    to ||= new this.constructor({ dkLen: outputLen });
    to.set(...this.get());
    to.buffer.set(buffer);
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    to.outputLen = outputLen;
    return to;
  }
  clone() {
    return this._cloneInto();
  }
};
var _BLAKE2b = class extends _BLAKE2 {
  static {
    __name(this, "_BLAKE2b");
  }
  // Same as SHA-512, but LE
  v0l = B2B_IV[0] | 0;
  v0h = B2B_IV[1] | 0;
  v1l = B2B_IV[2] | 0;
  v1h = B2B_IV[3] | 0;
  v2l = B2B_IV[4] | 0;
  v2h = B2B_IV[5] | 0;
  v3l = B2B_IV[6] | 0;
  v3h = B2B_IV[7] | 0;
  v4l = B2B_IV[8] | 0;
  v4h = B2B_IV[9] | 0;
  v5l = B2B_IV[10] | 0;
  v5h = B2B_IV[11] | 0;
  v6l = B2B_IV[12] | 0;
  v6h = B2B_IV[13] | 0;
  v7l = B2B_IV[14] | 0;
  v7h = B2B_IV[15] | 0;
  constructor(opts = {}) {
    const olen = opts.dkLen === void 0 ? 64 : opts.dkLen;
    super(128, olen);
    checkBlake2Opts(olen, opts, 64, 16, 16);
    let { key, personalization, salt } = opts;
    let keyLength = 0;
    if (key !== void 0) {
      abytes(key, void 0, "key");
      keyLength = key.length;
    }
    this.v0l ^= this.outputLen | keyLength << 8 | 1 << 16 | 1 << 24;
    if (salt !== void 0) {
      abytes(salt, void 0, "salt");
      const slt = u32(salt);
      this.v4l ^= swap8IfBE(slt[0]);
      this.v4h ^= swap8IfBE(slt[1]);
      this.v5l ^= swap8IfBE(slt[2]);
      this.v5h ^= swap8IfBE(slt[3]);
    }
    if (personalization !== void 0) {
      abytes(personalization, void 0, "personalization");
      const pers = u32(personalization);
      this.v6l ^= swap8IfBE(pers[0]);
      this.v6h ^= swap8IfBE(pers[1]);
      this.v7l ^= swap8IfBE(pers[2]);
      this.v7h ^= swap8IfBE(pers[3]);
    }
    if (key !== void 0) {
      const tmp = new Uint8Array(this.blockLen);
      tmp.set(key);
      this.update(tmp);
    }
  }
  // prettier-ignore
  get() {
    let { v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h } = this;
    return [v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h];
  }
  // prettier-ignore
  set(v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h) {
    this.v0l = v0l | 0;
    this.v0h = v0h | 0;
    this.v1l = v1l | 0;
    this.v1h = v1h | 0;
    this.v2l = v2l | 0;
    this.v2h = v2h | 0;
    this.v3l = v3l | 0;
    this.v3h = v3h | 0;
    this.v4l = v4l | 0;
    this.v4h = v4h | 0;
    this.v5l = v5l | 0;
    this.v5h = v5h | 0;
    this.v6l = v6l | 0;
    this.v6h = v6h | 0;
    this.v7l = v7l | 0;
    this.v7h = v7h | 0;
  }
  compress(msg, offset, isLast) {
    this.get().forEach((v, i) => BBUF[i] = v);
    BBUF.set(B2B_IV, 16);
    let { h, l } = fromBig(BigInt(this.length));
    BBUF[24] = B2B_IV[8] ^ l;
    BBUF[25] = B2B_IV[9] ^ h;
    if (isLast) {
      BBUF[28] = ~BBUF[28];
      BBUF[29] = ~BBUF[29];
    }
    let j = 0;
    const s = BSIGMA;
    for (let i = 0; i < 12; i++) {
      G1b(0, 4, 8, 12, msg, offset + 2 * s[j++]);
      G2b(0, 4, 8, 12, msg, offset + 2 * s[j++]);
      G1b(1, 5, 9, 13, msg, offset + 2 * s[j++]);
      G2b(1, 5, 9, 13, msg, offset + 2 * s[j++]);
      G1b(2, 6, 10, 14, msg, offset + 2 * s[j++]);
      G2b(2, 6, 10, 14, msg, offset + 2 * s[j++]);
      G1b(3, 7, 11, 15, msg, offset + 2 * s[j++]);
      G2b(3, 7, 11, 15, msg, offset + 2 * s[j++]);
      G1b(0, 5, 10, 15, msg, offset + 2 * s[j++]);
      G2b(0, 5, 10, 15, msg, offset + 2 * s[j++]);
      G1b(1, 6, 11, 12, msg, offset + 2 * s[j++]);
      G2b(1, 6, 11, 12, msg, offset + 2 * s[j++]);
      G1b(2, 7, 8, 13, msg, offset + 2 * s[j++]);
      G2b(2, 7, 8, 13, msg, offset + 2 * s[j++]);
      G1b(3, 4, 9, 14, msg, offset + 2 * s[j++]);
      G2b(3, 4, 9, 14, msg, offset + 2 * s[j++]);
    }
    this.v0l ^= BBUF[0] ^ BBUF[16];
    this.v0h ^= BBUF[1] ^ BBUF[17];
    this.v1l ^= BBUF[2] ^ BBUF[18];
    this.v1h ^= BBUF[3] ^ BBUF[19];
    this.v2l ^= BBUF[4] ^ BBUF[20];
    this.v2h ^= BBUF[5] ^ BBUF[21];
    this.v3l ^= BBUF[6] ^ BBUF[22];
    this.v3h ^= BBUF[7] ^ BBUF[23];
    this.v4l ^= BBUF[8] ^ BBUF[24];
    this.v4h ^= BBUF[9] ^ BBUF[25];
    this.v5l ^= BBUF[10] ^ BBUF[26];
    this.v5h ^= BBUF[11] ^ BBUF[27];
    this.v6l ^= BBUF[12] ^ BBUF[28];
    this.v6h ^= BBUF[13] ^ BBUF[29];
    this.v7l ^= BBUF[14] ^ BBUF[30];
    this.v7h ^= BBUF[15] ^ BBUF[31];
    clean(BBUF);
  }
  destroy() {
    this.destroyed = true;
    clean(this.buffer32);
    this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }
};
var blake2b = /* @__PURE__ */ createHasher((opts) => new _BLAKE2b(opts));

// ../node_modules/@noble/hashes/argon2.js
var AT = { Argond2d: 0, Argon2i: 1, Argon2id: 2 };
var ARGON2_SYNC_POINTS = 4;
var abytesOrZero = /* @__PURE__ */ __name((buf, errorTitle = "") => {
  if (buf === void 0)
    return Uint8Array.of();
  return kdfInputToBytes(buf, errorTitle);
}, "abytesOrZero");
function mul(a, b) {
  const aL = a & 65535;
  const aH = a >>> 16;
  const bL = b & 65535;
  const bH = b >>> 16;
  const ll = Math.imul(aL, bL);
  const hl = Math.imul(aH, bL);
  const lh = Math.imul(aL, bH);
  const hh = Math.imul(aH, bH);
  const carry = (ll >>> 16) + (hl & 65535) + lh;
  const high = hh + (hl >>> 16) + (carry >>> 16) | 0;
  const low = carry << 16 | ll & 65535;
  return { h: high, l: low };
}
__name(mul, "mul");
function mul2(a, b) {
  const { h, l } = mul(a, b);
  return { h: (h << 1 | l >>> 31) & 4294967295, l: l << 1 & 4294967295 };
}
__name(mul2, "mul2");
function blamka(Ah, Al, Bh, Bl) {
  const { h: Ch, l: Cl } = mul2(Al, Bl);
  const Rll = add3L(Al, Bl, Cl);
  return { h: add3H(Rll, Ah, Bh, Ch), l: Rll | 0 };
}
__name(blamka, "blamka");
var A2_BUF = new Uint32Array(256);
function G(a, b, c, d) {
  let Al = A2_BUF[2 * a], Ah = A2_BUF[2 * a + 1];
  let Bl = A2_BUF[2 * b], Bh = A2_BUF[2 * b + 1];
  let Cl = A2_BUF[2 * c], Ch = A2_BUF[2 * c + 1];
  let Dl = A2_BUF[2 * d], Dh = A2_BUF[2 * d + 1];
  ({ h: Ah, l: Al } = blamka(Ah, Al, Bh, Bl));
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotr32H(Dh, Dl), Dl: rotr32L(Dh, Dl) });
  ({ h: Ch, l: Cl } = blamka(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrSH(Bh, Bl, 24), Bl: rotrSL(Bh, Bl, 24) });
  ({ h: Ah, l: Al } = blamka(Ah, Al, Bh, Bl));
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotrSH(Dh, Dl, 16), Dl: rotrSL(Dh, Dl, 16) });
  ({ h: Ch, l: Cl } = blamka(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrBH(Bh, Bl, 63), Bl: rotrBL(Bh, Bl, 63) });
  A2_BUF[2 * a] = Al, A2_BUF[2 * a + 1] = Ah;
  A2_BUF[2 * b] = Bl, A2_BUF[2 * b + 1] = Bh;
  A2_BUF[2 * c] = Cl, A2_BUF[2 * c + 1] = Ch;
  A2_BUF[2 * d] = Dl, A2_BUF[2 * d + 1] = Dh;
}
__name(G, "G");
function P(v00, v01, v02, v03, v04, v05, v06, v07, v08, v09, v10, v11, v12, v13, v14, v15) {
  G(v00, v04, v08, v12);
  G(v01, v05, v09, v13);
  G(v02, v06, v10, v14);
  G(v03, v07, v11, v15);
  G(v00, v05, v10, v15);
  G(v01, v06, v11, v12);
  G(v02, v07, v08, v13);
  G(v03, v04, v09, v14);
}
__name(P, "P");
function block(x, xPos, yPos, outPos, needXor) {
  for (let i = 0; i < 256; i++)
    A2_BUF[i] = x[xPos + i] ^ x[yPos + i];
  for (let i = 0; i < 128; i += 16) {
    P(i, i + 1, i + 2, i + 3, i + 4, i + 5, i + 6, i + 7, i + 8, i + 9, i + 10, i + 11, i + 12, i + 13, i + 14, i + 15);
  }
  for (let i = 0; i < 16; i += 2) {
    P(i, i + 1, i + 16, i + 17, i + 32, i + 33, i + 48, i + 49, i + 64, i + 65, i + 80, i + 81, i + 96, i + 97, i + 112, i + 113);
  }
  if (needXor)
    for (let i = 0; i < 256; i++)
      x[outPos + i] ^= A2_BUF[i] ^ x[xPos + i] ^ x[yPos + i];
  else
    for (let i = 0; i < 256; i++)
      x[outPos + i] = A2_BUF[i] ^ x[xPos + i] ^ x[yPos + i];
  clean(A2_BUF);
}
__name(block, "block");
function Hp(A, dkLen) {
  const A8 = u8(A);
  const T = new Uint32Array(1);
  const T8 = u8(T);
  T[0] = dkLen;
  if (dkLen <= 64)
    return blake2b.create({ dkLen }).update(T8).update(A8).digest();
  const out = new Uint8Array(dkLen);
  let V = blake2b.create({}).update(T8).update(A8).digest();
  let pos = 0;
  out.set(V.subarray(0, 32));
  pos += 32;
  for (; dkLen - pos > 64; pos += 32) {
    const Vh = blake2b.create({}).update(V);
    Vh.digestInto(V);
    Vh.destroy();
    out.set(V.subarray(0, 32), pos);
  }
  out.set(blake2b(V, { dkLen: dkLen - pos }), pos);
  clean(V, T);
  return u32(out);
}
__name(Hp, "Hp");
function indexAlpha(r, s, laneLen, segmentLen, index, randL, sameLane = false) {
  let area;
  if (r === 0) {
    if (s === 0)
      area = index - 1;
    else if (sameLane)
      area = s * segmentLen + index - 1;
    else
      area = s * segmentLen + (index == 0 ? -1 : 0);
  } else if (sameLane)
    area = laneLen - segmentLen + index - 1;
  else
    area = laneLen - segmentLen + (index == 0 ? -1 : 0);
  const startPos = r !== 0 && s !== ARGON2_SYNC_POINTS - 1 ? (s + 1) * segmentLen : 0;
  const rel = area - 1 - mul(area, mul(randL, randL).h).h;
  return (startPos + rel) % laneLen;
}
__name(indexAlpha, "indexAlpha");
var maxUint32 = Math.pow(2, 32);
function isU32(num) {
  return Number.isSafeInteger(num) && num >= 0 && num < maxUint32;
}
__name(isU32, "isU32");
function argon2Opts(opts) {
  const merged = {
    version: 19,
    dkLen: 32,
    maxmem: maxUint32 - 1,
    asyncTick: 10
  };
  for (let [k, v] of Object.entries(opts))
    if (v !== void 0)
      merged[k] = v;
  const { dkLen, p, m, t, version, onProgress, asyncTick } = merged;
  if (!isU32(dkLen) || dkLen < 4)
    throw new Error('"dkLen" must be 4..');
  if (!isU32(p) || p < 1 || p >= Math.pow(2, 24))
    throw new Error('"p" must be 1..2^24');
  if (!isU32(m))
    throw new Error('"m" must be 0..2^32');
  if (!isU32(t) || t < 1)
    throw new Error('"t" (iterations) must be 1..2^32');
  if (onProgress !== void 0 && typeof onProgress !== "function")
    throw new Error('"progressCb" must be a function');
  anumber(asyncTick, "asyncTick");
  if (!isU32(m) || m < 8 * p)
    throw new Error('"m" (memory) must be at least 8*p bytes');
  if (version !== 16 && version !== 19)
    throw new Error('"version" must be 0x10 or 0x13, got ' + version);
  return merged;
}
__name(argon2Opts, "argon2Opts");
function argon2Init(password, salt, type, opts) {
  password = kdfInputToBytes(password, "password");
  salt = kdfInputToBytes(salt, "salt");
  if (!isU32(password.length))
    throw new Error('"password" must be less of length 1..4Gb');
  if (!isU32(salt.length) || salt.length < 8)
    throw new Error('"salt" must be of length 8..4Gb');
  if (!Object.values(AT).includes(type))
    throw new Error('"type" was invalid');
  let { p, dkLen, m, t, version, key, personalization, maxmem, onProgress, asyncTick } = argon2Opts(opts);
  key = abytesOrZero(key, "key");
  personalization = abytesOrZero(personalization, "personalization");
  const h = blake2b.create();
  const BUF = new Uint32Array(1);
  const BUF8 = u8(BUF);
  for (let item of [p, dkLen, m, t, version, type]) {
    BUF[0] = item;
    h.update(BUF8);
  }
  for (let i of [password, salt, key, personalization]) {
    BUF[0] = i.length;
    h.update(BUF8).update(i);
  }
  const H0 = new Uint32Array(18);
  const H0_8 = u8(H0);
  h.digestInto(H0_8);
  const lanes = p;
  const mP = 4 * p * Math.floor(m / (ARGON2_SYNC_POINTS * p));
  const laneLen = Math.floor(mP / p);
  const segmentLen = Math.floor(laneLen / ARGON2_SYNC_POINTS);
  const memUsed = mP * 256;
  if (!isU32(maxmem) || memUsed > maxmem)
    throw new Error('"maxmem" expected <2**32, got: maxmem=' + maxmem + ", memused=" + memUsed);
  const B = new Uint32Array(memUsed);
  for (let l = 0; l < p; l++) {
    const i = 256 * laneLen * l;
    H0[17] = l;
    H0[16] = 0;
    B.set(Hp(H0, 1024), i);
    H0[16] = 1;
    B.set(Hp(H0, 1024), i + 256);
  }
  let perBlock = /* @__PURE__ */ __name(() => {
  }, "perBlock");
  if (onProgress) {
    const totalBlock = t * ARGON2_SYNC_POINTS * p * segmentLen;
    const callbackPer = Math.max(Math.floor(totalBlock / 1e4), 1);
    let blockCnt = 0;
    perBlock = /* @__PURE__ */ __name(() => {
      blockCnt++;
      if (onProgress && (!(blockCnt % callbackPer) || blockCnt === totalBlock))
        onProgress(blockCnt / totalBlock);
    }, "perBlock");
  }
  clean(BUF, H0);
  return { type, mP, p, t, version, B, laneLen, lanes, segmentLen, dkLen, perBlock, asyncTick };
}
__name(argon2Init, "argon2Init");
function argon2Output(B, p, laneLen, dkLen) {
  const B_final = new Uint32Array(256);
  for (let l = 0; l < p; l++)
    for (let j = 0; j < 256; j++)
      B_final[j] ^= B[256 * (laneLen * l + laneLen - 1) + j];
  const res = u8(Hp(B_final, dkLen));
  clean(B_final);
  return res;
}
__name(argon2Output, "argon2Output");
function processBlock(B, address, l, r, s, index, laneLen, segmentLen, lanes, offset, prev, dataIndependent, needXor) {
  if (offset % laneLen)
    prev = offset - 1;
  let randL, randH;
  if (dataIndependent) {
    let i128 = index % 128;
    if (i128 === 0) {
      address[256 + 12]++;
      block(address, 256, 2 * 256, 0, false);
      block(address, 0, 2 * 256, 0, false);
    }
    randL = address[2 * i128];
    randH = address[2 * i128 + 1];
  } else {
    const T = 256 * prev;
    randL = B[T];
    randH = B[T + 1];
  }
  const refLane = r === 0 && s === 0 ? l : randH % lanes;
  const refPos = indexAlpha(r, s, laneLen, segmentLen, index, randL, refLane == l);
  const refBlock = laneLen * refLane + refPos;
  block(B, 256 * prev, 256 * refBlock, offset * 256, needXor);
}
__name(processBlock, "processBlock");
function argon2(type, password, salt, opts) {
  const { mP, p, t, version, B, laneLen, lanes, segmentLen, dkLen, perBlock } = argon2Init(password, salt, type, opts);
  const address = new Uint32Array(3 * 256);
  address[256 + 6] = mP;
  address[256 + 8] = t;
  address[256 + 10] = type;
  for (let r = 0; r < t; r++) {
    const needXor = r !== 0 && version === 19;
    address[256 + 0] = r;
    for (let s = 0; s < ARGON2_SYNC_POINTS; s++) {
      address[256 + 4] = s;
      const dataIndependent = type == AT.Argon2i || type == AT.Argon2id && r === 0 && s < 2;
      for (let l = 0; l < p; l++) {
        address[256 + 2] = l;
        address[256 + 12] = 0;
        let startPos = 0;
        if (r === 0 && s === 0) {
          startPos = 2;
          if (dataIndependent) {
            address[256 + 12]++;
            block(address, 256, 2 * 256, 0, false);
            block(address, 0, 2 * 256, 0, false);
          }
        }
        let offset = l * laneLen + s * segmentLen + startPos;
        let prev = offset % laneLen ? offset - 1 : offset + laneLen - 1;
        for (let index = startPos; index < segmentLen; index++, offset++, prev++) {
          perBlock();
          processBlock(B, address, l, r, s, index, laneLen, segmentLen, lanes, offset, prev, dataIndependent, needXor);
        }
      }
    }
  }
  clean(address);
  return argon2Output(B, p, laneLen, dkLen);
}
__name(argon2, "argon2");
var argon2id = /* @__PURE__ */ __name((password, salt, opts) => argon2(AT.Argon2id, password, salt, opts), "argon2id");

// api/_lib/crypto.ts
var textEncoder = new TextEncoder();
var equalBytes = /* @__PURE__ */ __name((left, right) => {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left[index] ^ right[index];
  }
  return mismatch === 0;
}, "equalBytes");
var toBase64Url = /* @__PURE__ */ __name((bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""), "toBase64Url");
var fromBase64Url = /* @__PURE__ */ __name((input) => {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}, "fromBase64Url");
var randomToken = /* @__PURE__ */ __name((byteLength = 32) => {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}, "randomToken");
var sha256Hex = /* @__PURE__ */ __name(async (value) => {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}, "sha256Hex");
var ARGON_CONFIG = {
  m: 19456,
  t: 3,
  p: 1,
  dkLen: 32
};
var hashPassword = /* @__PURE__ */ __name((password) => {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const hash = argon2id(textEncoder.encode(password), salt, ARGON_CONFIG);
  return `argon2id$v=1$m=${ARGON_CONFIG.m},t=${ARGON_CONFIG.t},p=${ARGON_CONFIG.p}$${toBase64Url(
    salt
  )}$${toBase64Url(hash)}`;
}, "hashPassword");
var parseArgon2Hash = /* @__PURE__ */ __name((encoded) => {
  const segments = encoded.split("$");
  if (segments.length !== 5) return null;
  const [algorithm, versionSegment, paramsSegment, saltSegment, hashSegment] = segments;
  if (algorithm !== "argon2id" || versionSegment !== "v=1") return null;
  const params = Object.fromEntries(
    paramsSegment.split(",").map((entry) => {
      const [key, value] = entry.split("=");
      return [key, Number(value)];
    })
  );
  if (!params.m || !params.t || !params.p) return null;
  return {
    m: params.m,
    t: params.t,
    p: params.p,
    salt: fromBase64Url(saltSegment),
    expectedHash: fromBase64Url(hashSegment)
  };
}, "parseArgon2Hash");
var verifyPassword = /* @__PURE__ */ __name((password, encodedHash) => {
  const parsed = parseArgon2Hash(encodedHash);
  if (!parsed) return false;
  const computed = argon2id(textEncoder.encode(password), parsed.salt, {
    m: parsed.m,
    t: parsed.t,
    p: parsed.p,
    dkLen: parsed.expectedHash.length
  });
  return equalBytes(computed, parsed.expectedHash);
}, "verifyPassword");

// api/_lib/names.ts
var displayNameFromEmail = /* @__PURE__ */ __name((email) => email.split("@")[0].split(/[._-]/).filter(Boolean).map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1)).join(" "), "displayNameFromEmail");

// api/_lib/auth.ts
var DEFAULT_SESSION_COOKIE_NAME = "wef_session";
var DEFAULT_SESSION_TTL_HOURS = 24 * 30;
var normalizeCookieString = /* @__PURE__ */ __name((cookieString) => cookieString ?? "", "normalizeCookieString");
var parseCookieValue = /* @__PURE__ */ __name((request, name) => {
  const cookieHeader = normalizeCookieString(request.headers.get("cookie"));
  for (const cookiePair of cookieHeader.split(";")) {
    const [rawName, ...rawValueParts] = cookiePair.trim().split("=");
    if (rawName !== name || rawValueParts.length === 0) continue;
    return decodeURIComponent(rawValueParts.join("="));
  }
  return null;
}, "parseCookieValue");
var toAuthUser = /* @__PURE__ */ __name((row) => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name?.trim() || displayNameFromEmail(row.email),
  userType: row.user_type,
  isAdmin: Boolean(row.is_admin),
  status: row.status,
  coachUserId: row.coach_user_id,
  canManageClients: Boolean(row.is_admin) || row.user_type === "coach"
}), "toAuthUser");
var getSessionCookieName = /* @__PURE__ */ __name((env) => env.SESSION_COOKIE_NAME || DEFAULT_SESSION_COOKIE_NAME, "getSessionCookieName");
var getSessionMaxAgeSeconds = /* @__PURE__ */ __name((env) => {
  const parsed = Number(env.SESSION_TTL_HOURS);
  const hours = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SESSION_TTL_HOURS;
  return Math.round(hours * 60 * 60);
}, "getSessionMaxAgeSeconds");
var buildSessionCookie = /* @__PURE__ */ __name((request, env, sessionToken, maxAgeSeconds) => {
  const requestUrl = new URL(request.url);
  const cookieName = getSessionCookieName(env);
  const secure = requestUrl.protocol === "https:";
  const parts = [
    `${cookieName}=${encodeURIComponent(sessionToken)}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}, "buildSessionCookie");
var clearSessionCookie = /* @__PURE__ */ __name((request, env) => {
  const requestUrl = new URL(request.url);
  const cookieName = getSessionCookieName(env);
  const secure = requestUrl.protocol === "https:";
  const parts = [
    `${cookieName}=`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Max-Age=0"
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}, "clearSessionCookie");
var getAuthSession = /* @__PURE__ */ __name(async (request, env) => {
  const cookieName = getSessionCookieName(env);
  const sessionToken = parseCookieValue(request, cookieName);
  if (!sessionToken) return null;
  const tokenHash = await sha256Hex(sessionToken);
  const row = await env.DB.prepare(
    `
      SELECT
        s.id AS session_id,
        u.id,
        u.email,
        u.full_name,
        u.user_type,
        u.is_admin,
        u.status,
        u.coach_user_id
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?
        AND s.revoked_at IS NULL
        AND datetime(s.expires_at) > CURRENT_TIMESTAMP
        AND u.status = 'active'
      LIMIT 1
    `
  ).bind(tokenHash).first();
  if (!row) return null;
  return {
    sessionId: row.session_id,
    tokenHash,
    user: toAuthUser(row)
  };
}, "getAuthSession");
var issueSession = /* @__PURE__ */ __name(async (request, env, userId) => {
  const sessionToken = randomToken(32);
  const tokenHash = await sha256Hex(sessionToken);
  const maxAgeSeconds = getSessionMaxAgeSeconds(env);
  const expiresAt = new Date(Date.now() + maxAgeSeconds * 1e3).toISOString();
  const sessionId = crypto.randomUUID();
  await env.DB.prepare(
    `
      INSERT INTO sessions (id, user_id, token_hash, expires_at)
      VALUES (?, ?, ?, ?)
    `
  ).bind(sessionId, userId, tokenHash, expiresAt).run();
  return {
    cookieHeader: buildSessionCookie(request, env, sessionToken, maxAgeSeconds)
  };
}, "issueSession");
var revokeSession = /* @__PURE__ */ __name(async (request, env) => {
  const session = await getAuthSession(request, env);
  if (!session) return;
  await env.DB.prepare(
    `
      UPDATE sessions
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
  ).bind(session.sessionId).run();
}, "revokeSession");

// api/_lib/response.ts
var json = /* @__PURE__ */ __name((payload, status = 200, headers) => new Response(JSON.stringify(payload), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    ...headers
  }
}), "json");
var fail = /* @__PURE__ */ __name((status, error, message2, details) => json({ error, message: message2, details }, status), "fail");

// api/_lib/guards.ts
var requireAuth = /* @__PURE__ */ __name(async (request, env) => {
  const session = await getAuthSession(request, env);
  if (!session) return fail(401, "unauthorized", "Autenticazione richiesta.");
  return session;
}, "requireAuth");
var requireManager = /* @__PURE__ */ __name(async (request, env) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (!auth.user.canManageClients) {
    return fail(403, "forbidden", "Accesso riservato ai gestori.");
  }
  return auth;
}, "requireManager");
var requireAdmin = /* @__PURE__ */ __name(async (request, env) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (!auth.user.isAdmin) {
    return fail(403, "forbidden", "Accesso riservato agli amministratori.");
  }
  return auth;
}, "requireAdmin");
var loadManagedUser = /* @__PURE__ */ __name(async (env, userId) => env.DB.prepare(
  `
      SELECT
        id,
        email,
        full_name,
        user_type,
        is_admin,
        status,
        coach_user_id,
        invited_by_user_id,
        invite_token_hash,
        invite_expires_at,
        invited_at,
        activated_at,
        last_login_at,
        created_at,
        updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `
).bind(userId).first(), "loadManagedUser");
var requireManagedUserAccess = /* @__PURE__ */ __name(async (auth, env, userId) => {
  const targetUser = await loadManagedUser(env, userId);
  if (!targetUser) {
    return fail(404, "user_not_found", "Utente non trovato.");
  }
  if (auth.user.isAdmin) {
    return targetUser;
  }
  if (auth.user.id === targetUser.id) {
    return targetUser;
  }
  if (auth.user.userType === "coach" && targetUser.user_type === "client" && targetUser.coach_user_id === auth.user.id) {
    return targetUser;
  }
  return fail(403, "forbidden", "Non puoi gestire questo utente.");
}, "requireManagedUserAccess");

// api/_lib/http.ts
var readJson = /* @__PURE__ */ __name(async (request) => {
  try {
    return await request.json();
  } catch {
    return fail(400, "invalid_json", "Il corpo della richiesta deve essere un JSON valido.");
  }
}, "readJson");
var normalizeEmail = /* @__PURE__ */ __name((value) => value.trim().toLowerCase(), "normalizeEmail");

// api/_lib/admin-workouts.ts
var parseNullable = /* @__PURE__ */ __name((value) => {
  if (value === void 0 || value === null) return null;
  const asString = String(value).trim();
  return asString ? asString : null;
}, "parseNullable");
var formatDateLabel = /* @__PURE__ */ __name((isoValue) => {
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return isoValue;
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}, "formatDateLabel");
var loadPlanRow = /* @__PURE__ */ __name(async (env, planId, userId) => env.DB.prepare(
  `
      SELECT id, title, is_active, created_at, updated_at
      FROM workout_plans
      WHERE id = ?
        AND user_id = ?
      LIMIT 1
    `
).bind(planId, userId).first(), "loadPlanRow");
var validateAdminWorkoutPlanInput = /* @__PURE__ */ __name((payload) => {
  if (!payload || typeof payload !== "object") {
    return fail(400, "invalid_payload", "Il payload della scheda deve essere un oggetto.");
  }
  const input = payload;
  if (!input.title?.trim()) {
    return fail(400, "invalid_payload", "Il titolo della scheda \xE8 obbligatorio.");
  }
  if (!Array.isArray(input.weeks) || input.weeks.length === 0) {
    return fail(400, "invalid_payload", "La scheda deve includere almeno una settimana.");
  }
  for (let weekIndex = 0; weekIndex < input.weeks.length; weekIndex += 1) {
    const week2 = input.weeks[weekIndex];
    if (!week2.name?.trim()) {
      return fail(400, "invalid_payload", `Settimana ${weekIndex + 1}: il nome \xE8 obbligatorio.`);
    }
    if (!Array.isArray(week2.days) || week2.days.length === 0) {
      return fail(400, "invalid_payload", `Settimana ${weekIndex + 1}: \xE8 obbligatorio almeno un giorno.`);
    }
    for (let dayIndex = 0; dayIndex < week2.days.length; dayIndex += 1) {
      const day2 = week2.days[dayIndex];
      if (!day2.name?.trim() || !day2.focus?.trim()) {
        return fail(
          400,
          "invalid_payload",
          `Settimana ${weekIndex + 1}, giorno ${dayIndex + 1}: nome e focus sono obbligatori.`
        );
      }
      if (!Array.isArray(day2.groups) || day2.groups.length === 0) {
        return fail(
          400,
          "invalid_payload",
          `Settimana ${weekIndex + 1}, giorno ${dayIndex + 1}: \xE8 obbligatorio almeno un gruppo di esercizi.`
        );
      }
      for (let groupIndex = 0; groupIndex < day2.groups.length; groupIndex += 1) {
        const group = day2.groups[groupIndex];
        if (group.type !== "single" && group.type !== "superset") {
          return fail(
            400,
            "invalid_payload",
            `Settimana ${weekIndex + 1}, giorno ${dayIndex + 1}, gruppo ${groupIndex + 1}: tipo non valido.`
          );
        }
        if (!Number.isInteger(group.sets) || group.sets <= 0 || !group.rest?.trim()) {
          return fail(
            400,
            "invalid_payload",
            `Settimana ${weekIndex + 1}, giorno ${dayIndex + 1}, gruppo ${groupIndex + 1}: serie e recupero sono obbligatori.`
          );
        }
        if (!Array.isArray(group.items) || group.items.length === 0) {
          return fail(
            400,
            "invalid_payload",
            `Settimana ${weekIndex + 1}, giorno ${dayIndex + 1}, gruppo ${groupIndex + 1}: gli esercizi sono obbligatori.`
          );
        }
        if (group.type === "single" && group.items.length !== 1) {
          return fail(
            400,
            "invalid_payload",
            `Settimana ${weekIndex + 1}, giorno ${dayIndex + 1}, gruppo ${groupIndex + 1}: i gruppi singoli devono avere esattamente un esercizio.`
          );
        }
        if (group.type === "superset" && group.items.length < 2) {
          return fail(
            400,
            "invalid_payload",
            `Settimana ${weekIndex + 1}, giorno ${dayIndex + 1}, gruppo ${groupIndex + 1}: le superserie devono avere almeno due esercizi.`
          );
        }
        for (let itemIndex = 0; itemIndex < group.items.length; itemIndex += 1) {
          const item = group.items[itemIndex];
          if (!item.name?.trim() || !item.reps?.trim()) {
            return fail(
              400,
              "invalid_payload",
              `Settimana ${weekIndex + 1}, giorno ${dayIndex + 1}, gruppo ${groupIndex + 1}, esercizio ${itemIndex + 1}: nome e ripetizioni sono obbligatori.`
            );
          }
        }
      }
    }
  }
  return input;
}, "validateAdminWorkoutPlanInput");
var listWorkoutPlansForUser = /* @__PURE__ */ __name(async (env, userId) => {
  const plans = await env.DB.prepare(
    `
      SELECT id, title, is_active, created_at, updated_at
      FROM workout_plans
      WHERE user_id = ?
      ORDER BY updated_at DESC, created_at DESC
    `
  ).bind(userId).all();
  return plans.results.map((plan) => ({
    id: plan.id,
    name: plan.title,
    date: formatDateLabel(plan.updated_at || plan.created_at),
    isCurrent: Boolean(plan.is_active),
    createdAt: plan.created_at,
    updatedAt: plan.updated_at
  }));
}, "listWorkoutPlansForUser");
var getWorkoutPlanById = /* @__PURE__ */ __name(async (env, userId, planId) => {
  const plan = await loadPlanRow(env, planId, userId);
  if (!plan) return null;
  const weeks = await env.DB.prepare(
    `
      SELECT id, week_order, name
      FROM workout_weeks
      WHERE plan_id = ?
      ORDER BY week_order ASC
    `
  ).bind(plan.id).all();
  const weekResults = await Promise.all(
    weeks.results.map(async (week2) => {
      const days = await env.DB.prepare(
        `
          SELECT id, day_order, name, focus
          FROM workout_days
          WHERE week_id = ?
          ORDER BY day_order ASC
        `
      ).bind(week2.id).all();
      const dayResults = await Promise.all(
        days.results.map(async (day2) => {
          const groups = await env.DB.prepare(
            `
              SELECT id, group_order, group_type, sets, rest, notes
              FROM workout_exercise_groups
              WHERE day_id = ?
              ORDER BY group_order ASC
            `
          ).bind(day2.id).all();
          const groupResults = await Promise.all(
            groups.results.map(async (group) => {
              const items = await env.DB.prepare(
                `
                  SELECT id, item_order, name, reps, previous_weight, previous_reps, previous_date
                  FROM workout_exercise_group_items
                  WHERE group_id = ?
                  ORDER BY item_order ASC
                `
              ).bind(group.id).all();
              return {
                id: group.id,
                type: group.group_type,
                sets: group.sets,
                rest: group.rest,
                notes: group.notes ?? "",
                items: items.results.map((item) => ({
                  id: item.id,
                  name: item.name,
                  reps: item.reps,
                  previous: item.previous_weight || item.previous_reps || item.previous_date ? {
                    weight: item.previous_weight ?? "",
                    reps: item.previous_reps ?? "",
                    date: item.previous_date ?? ""
                  } : void 0
                }))
              };
            })
          );
          return {
            id: day2.id,
            name: day2.name,
            focus: day2.focus,
            groups: groupResults
          };
        })
      );
      return {
        id: week2.id,
        name: week2.name,
        days: dayResults
      };
    })
  );
  return {
    id: plan.id,
    title: plan.title,
    isCurrent: Boolean(plan.is_active),
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
    weeks: weekResults
  };
}, "getWorkoutPlanById");
var clearWorkoutPlanStructure = /* @__PURE__ */ __name(async (env, planId) => {
  const dayIds = await env.DB.prepare(
    `SELECT id FROM workout_days WHERE plan_id = ?`
  ).bind(planId).all();
  const dayIdList = dayIds.results.map((day2) => day2.id);
  if (dayIdList.length > 0) {
    const placeholders = dayIdList.map(() => "?").join(", ");
    await env.DB.prepare(
      `
        DELETE FROM workout_exercise_group_items
        WHERE group_id IN (
          SELECT id FROM workout_exercise_groups WHERE day_id IN (${placeholders})
        )
      `
    ).bind(...dayIdList).run();
    await env.DB.prepare(
      `DELETE FROM workout_exercise_groups WHERE day_id IN (${placeholders})`
    ).bind(...dayIdList).run();
  }
  await env.DB.prepare(`DELETE FROM workout_days WHERE plan_id = ?`).bind(planId).run();
  await env.DB.prepare(`DELETE FROM workout_weeks WHERE plan_id = ?`).bind(planId).run();
}, "clearWorkoutPlanStructure");
var saveWorkoutPlanById = /* @__PURE__ */ __name(async (env, userId, planId, actorUserId, input) => {
  const existingPlan = await loadPlanRow(env, planId, userId);
  if (!existingPlan) {
    return fail(404, "plan_not_found", "Scheda non trovata.");
  }
  await env.DB.prepare(
    `
      UPDATE workout_plans
      SET title = ?,
          updated_by_user_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
  ).bind(input.title.trim(), actorUserId, planId).run();
  await clearWorkoutPlanStructure(env, planId);
  for (let weekIndex = 0; weekIndex < input.weeks.length; weekIndex += 1) {
    const week2 = input.weeks[weekIndex];
    const weekId = crypto.randomUUID();
    await env.DB.prepare(
      `
        INSERT INTO workout_weeks (id, plan_id, week_order, name)
        VALUES (?, ?, ?, ?)
      `
    ).bind(weekId, planId, weekIndex + 1, week2.name.trim()).run();
    for (let dayIndex = 0; dayIndex < week2.days.length; dayIndex += 1) {
      const day2 = week2.days[dayIndex];
      const dayId = crypto.randomUUID();
      await env.DB.prepare(
        `
          INSERT INTO workout_days (id, plan_id, week_id, day_order, name, focus)
          VALUES (?, ?, ?, ?, ?, ?)
        `
      ).bind(dayId, planId, weekId, dayIndex + 1, day2.name.trim(), day2.focus.trim()).run();
      for (let groupIndex = 0; groupIndex < day2.groups.length; groupIndex += 1) {
        const group = day2.groups[groupIndex];
        const groupId = crypto.randomUUID();
        await env.DB.prepare(
          `
            INSERT INTO workout_exercise_groups (
              id,
              day_id,
              group_order,
              group_type,
              sets,
              rest,
              notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `
        ).bind(
          groupId,
          dayId,
          groupIndex + 1,
          group.type,
          group.sets,
          group.rest.trim(),
          parseNullable(group.notes)
        ).run();
        for (let itemIndex = 0; itemIndex < group.items.length; itemIndex += 1) {
          const item = group.items[itemIndex];
          await env.DB.prepare(
            `
              INSERT INTO workout_exercise_group_items (
                id,
                group_id,
                item_order,
                name,
                reps,
                previous_weight,
                previous_reps,
                previous_date
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `
          ).bind(
            crypto.randomUUID(),
            groupId,
            itemIndex + 1,
            item.name.trim(),
            item.reps.trim(),
            parseNullable(item.previous?.weight),
            parseNullable(item.previous?.reps),
            parseNullable(item.previous?.date)
          ).run();
        }
      }
    }
  }
  return getWorkoutPlanById(env, userId, planId);
}, "saveWorkoutPlanById");
var createWorkoutPlanForUser = /* @__PURE__ */ __name(async (env, userId, actorUserId, copyFromPlanId) => {
  const existingPlans = await listWorkoutPlansForUser(env, userId);
  const shouldBeCurrent = existingPlans.length === 0;
  const planId = crypto.randomUUID();
  await env.DB.prepare(
    `
      INSERT INTO workout_plans (
        id,
        user_id,
        title,
        is_active,
        created_by_user_id,
        updated_by_user_id
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `
  ).bind(planId, userId, "Nuova Scheda", shouldBeCurrent ? 1 : 0, actorUserId, actorUserId).run();
  let draft = {
    title: "Nuova Scheda",
    weeks: [
      {
        name: "Settimana 1",
        days: [
          {
            name: "Giorno 1",
            focus: "Focus",
            groups: [
              {
                type: "single",
                sets: 3,
                rest: `1'30"`,
                notes: "",
                items: [{ name: "Nuovo esercizio", reps: "10" }]
              }
            ]
          }
        ]
      }
    ]
  };
  if (copyFromPlanId) {
    const source = await getWorkoutPlanById(env, userId, copyFromPlanId);
    if (source) {
      draft = {
        title: `${source.title} Copy`,
        weeks: source.weeks
      };
    }
  }
  return saveWorkoutPlanById(env, userId, planId, actorUserId, draft);
}, "createWorkoutPlanForUser");
var activateWorkoutPlanForUser = /* @__PURE__ */ __name(async (env, userId, planId) => {
  const existingPlan = await loadPlanRow(env, planId, userId);
  if (!existingPlan) {
    return fail(404, "plan_not_found", "Scheda non trovata.");
  }
  await env.DB.batch([
    env.DB.prepare(
      `
          UPDATE workout_plans
          SET is_active = 0,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `
    ).bind(userId),
    env.DB.prepare(
      `
          UPDATE workout_plans
          SET is_active = 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `
    ).bind(planId)
  ]);
  return getWorkoutPlanById(env, userId, planId);
}, "activateWorkoutPlanForUser");
var getCurrentFlattenedWorkoutPlanForUser = /* @__PURE__ */ __name(async (env, userId) => {
  const currentPlan = await env.DB.prepare(
    `
      SELECT id
      FROM workout_plans
      WHERE user_id = ?
        AND is_active = 1
      ORDER BY updated_at DESC
      LIMIT 1
    `
  ).bind(userId).first();
  if (!currentPlan) return null;
  const richPlan = await getWorkoutPlanById(env, userId, currentPlan.id);
  if (!richPlan) return null;
  const firstWeek = richPlan.weeks[0];
  if (!firstWeek) {
    return {
      id: richPlan.id,
      title: richPlan.title,
      days: []
    };
  }
  return {
    id: richPlan.id,
    title: richPlan.title,
    days: firstWeek.days.map((day2, dayIndex) => ({
      id: dayIndex + 1,
      name: day2.name,
      focus: day2.focus,
      exercises: day2.groups.map((group) => {
        if (group.type === "single") {
          const singleItem = group.items[0];
          return {
            id: group.id,
            name: singleItem?.name ?? "Esercizio",
            sets: group.sets,
            reps: singleItem?.reps ?? "",
            rest: group.rest,
            trainerNote: group.notes || void 0,
            previous: singleItem?.previous
          };
        }
        const compositeName = group.items.map((item) => item.name).join(" + ");
        const compositeReps = group.items.map((item) => item.reps).join(" / ");
        const trainerNote = [
          group.notes?.trim(),
          `Super Serie: ${group.items.map((item) => `${item.name} (${item.reps})`).join(" + ")}`
        ].filter(Boolean).join(" | ");
        return {
          id: group.id,
          name: compositeName,
          sets: group.sets,
          reps: compositeReps,
          rest: group.rest,
          trainerNote: trainerNote || void 0,
          previous: group.items[0]?.previous
        };
      })
    }))
  };
}, "getCurrentFlattenedWorkoutPlanForUser");

// api/admin/users/[userId]/workouts/[planId]/activate.ts
var onRequestPost = /* @__PURE__ */ __name(async ({ request, env, params }) => {
  const auth = await requireManager(request, env);
  if (auth instanceof Response) return auth;
  const userId = params.userId;
  const planId = params.planId;
  if (!userId || !planId) return fail(400, "invalid_payload", "Utente e scheda sono obbligatori.");
  const access = await requireManagedUserAccess(auth, env, userId);
  if (access instanceof Response) return access;
  const plan = await activateWorkoutPlanForUser(env, userId, planId);
  if (plan instanceof Response) return plan;
  return json({ plan });
}, "onRequestPost");

// api/admin/users/[userId]/workouts/[planId].ts
var onRequestGet = /* @__PURE__ */ __name(async ({ request, env, params }) => {
  const auth = await requireManager(request, env);
  if (auth instanceof Response) return auth;
  const userId = params.userId;
  const planId = params.planId;
  if (!userId || !planId) return fail(400, "invalid_payload", "Utente e scheda sono obbligatori.");
  const access = await requireManagedUserAccess(auth, env, userId);
  if (access instanceof Response) return access;
  const plan = await getWorkoutPlanById(env, userId, planId);
  if (!plan) return fail(404, "plan_not_found", "Scheda non trovata.");
  return json({ plan });
}, "onRequestGet");
var onRequestPut = /* @__PURE__ */ __name(async ({ request, env, params }) => {
  const auth = await requireManager(request, env);
  if (auth instanceof Response) return auth;
  const userId = params.userId;
  const planId = params.planId;
  if (!userId || !planId) return fail(400, "invalid_payload", "Utente e scheda sono obbligatori.");
  const access = await requireManagedUserAccess(auth, env, userId);
  if (access instanceof Response) return access;
  const bodyOrResponse = await readJson(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;
  const payloadOrResponse = validateAdminWorkoutPlanInput(bodyOrResponse);
  if (payloadOrResponse instanceof Response) return payloadOrResponse;
  const saved = await saveWorkoutPlanById(env, userId, planId, auth.user.id, payloadOrResponse);
  if (saved instanceof Response) return saved;
  return json({ plan: saved });
}, "onRequestPut");

// api/_lib/admin-users.ts
var mapCoachSummary = /* @__PURE__ */ __name((row) => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name?.trim() || displayNameFromEmail(row.email),
  isAdmin: Boolean(row.is_admin),
  status: row.status,
  assignedClientCount: Number(row.assigned_clients || 0)
}), "mapCoachSummary");
var mapUserSummary = /* @__PURE__ */ __name((row) => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name?.trim() || displayNameFromEmail(row.email),
  userType: row.user_type,
  isAdmin: Boolean(row.is_admin),
  status: row.status,
  createdAt: row.created_at,
  activatedAt: row.activated_at,
  lastLoginAt: row.last_login_at,
  inviteExpiresAt: row.invite_expires_at,
  coach: row.coach_id && row.coach_email && row.coach_status ? mapCoachSummary({
    id: row.coach_id,
    email: row.coach_email,
    full_name: row.coach_full_name,
    is_admin: row.coach_is_admin ?? 0,
    status: row.coach_status
  }) : null
}), "mapUserSummary");
var listVisibleUsers = /* @__PURE__ */ __name(async (env, auth) => {
  const baseSelect = `
    SELECT
      u.id,
      u.email,
      u.full_name,
      u.user_type,
      u.is_admin,
      u.status,
      u.created_at,
      u.activated_at,
      u.last_login_at,
      u.invite_expires_at,
      coach.id AS coach_id,
      coach.email AS coach_email,
      coach.full_name AS coach_full_name,
      coach.is_admin AS coach_is_admin,
      coach.status AS coach_status
    FROM users u
    LEFT JOIN users coach ON coach.id = u.coach_user_id
  `;
  let result;
  if (auth.user.isAdmin) {
    result = await env.DB.prepare(
      `${baseSelect}
       WHERE u.id != ?
       ORDER BY CASE u.user_type WHEN 'coach' THEN 0 ELSE 1 END, COALESCE(u.full_name, u.email) ASC`
    ).bind(auth.user.id).all();
  } else {
    result = await env.DB.prepare(
      `${baseSelect}
       WHERE u.user_type = 'client'
         AND u.coach_user_id = ?
       ORDER BY COALESCE(u.full_name, u.email) ASC`
    ).bind(auth.user.id).all();
  }
  return result.results.map(
    (row) => mapUserSummary({
      id: String(row.id),
      email: String(row.email),
      full_name: typeof row.full_name === "string" ? row.full_name : null,
      user_type: row.user_type === "coach" ? "coach" : "client",
      is_admin: Number(row.is_admin || 0),
      status: row.status === "disabled" ? "disabled" : row.status === "invited" ? "invited" : "active",
      created_at: String(row.created_at),
      activated_at: typeof row.activated_at === "string" ? row.activated_at : null,
      last_login_at: typeof row.last_login_at === "string" ? row.last_login_at : null,
      invite_expires_at: typeof row.invite_expires_at === "string" ? row.invite_expires_at : null,
      coach_id: typeof row.coach_id === "string" ? row.coach_id : null,
      coach_email: typeof row.coach_email === "string" ? row.coach_email : null,
      coach_full_name: typeof row.coach_full_name === "string" ? row.coach_full_name : null,
      coach_is_admin: row.coach_is_admin === null || row.coach_is_admin === void 0 ? null : Number(row.coach_is_admin),
      coach_status: row.coach_status === "disabled" ? "disabled" : row.coach_status === "invited" ? "invited" : row.coach_status === "active" ? "active" : null
    })
  );
}, "listVisibleUsers");
var listCoaches = /* @__PURE__ */ __name(async (env) => {
  const coaches = await env.DB.prepare(
    `
      SELECT
        u.id,
        u.email,
        u.full_name,
        u.is_admin,
        u.status,
        COUNT(client.id) AS assigned_clients
      FROM users u
      LEFT JOIN users client ON client.coach_user_id = u.id AND client.user_type = 'client'
      WHERE u.user_type = 'coach'
      GROUP BY u.id, u.email, u.full_name, u.is_admin, u.status
      ORDER BY COALESCE(u.full_name, u.email) ASC
    `
  ).all();
  return coaches.results.map(mapCoachSummary);
}, "listCoaches");
var loadUserSummaryRow = /* @__PURE__ */ __name(async (env, userId) => env.DB.prepare(
  `
      SELECT
        u.id,
        u.email,
        u.full_name,
        u.user_type,
        u.is_admin,
        u.status,
        u.created_at,
        u.activated_at,
        u.last_login_at,
        u.invite_expires_at,
        coach.id AS coach_id,
        coach.email AS coach_email,
        coach.full_name AS coach_full_name,
        coach.is_admin AS coach_is_admin,
        coach.status AS coach_status
      FROM users u
      LEFT JOIN users coach ON coach.id = u.coach_user_id
      WHERE u.id = ?
      LIMIT 1
    `
).bind(userId).first(), "loadUserSummaryRow");
var getManagedUserDetail = /* @__PURE__ */ __name(async (env, auth, userId) => {
  const targetUser = await requireManagedUserAccess(auth, env, userId);
  if (targetUser instanceof Response) return targetUser;
  const [user, checkins, workouts] = await Promise.all([
    loadUserSummaryRow(env, targetUser.id),
    env.DB.prepare(
      `
        SELECT id, recorded_at, weight, body_fat
        FROM body_checkins
        WHERE user_id = ?
        ORDER BY datetime(recorded_at) DESC
      `
    ).bind(targetUser.id).all(),
    listWorkoutPlansForUser(env, targetUser.id)
  ]);
  if (!user) {
    return fail(404, "user_not_found", "Utente non trovato.");
  }
  return {
    user: mapUserSummary(user),
    coach: user.coach_id && user.coach_email && user.coach_status ? mapCoachSummary({
      id: user.coach_id,
      email: user.coach_email,
      full_name: user.coach_full_name,
      is_admin: user.coach_is_admin ?? 0,
      status: user.coach_status
    }) : null,
    checkins: checkins.results.map((checkin) => ({
      id: checkin.id,
      date: checkin.recorded_at,
      weight: Number(checkin.weight),
      fat: checkin.body_fat === null ? null : Number(checkin.body_fat)
    })),
    workouts
  };
}, "getManagedUserDetail");
var assignCoachToClient = /* @__PURE__ */ __name(async (env, clientUserId, coachUserId) => {
  const client = await env.DB.prepare(
    `SELECT id FROM users WHERE id = ? AND user_type = 'client' LIMIT 1`
  ).bind(clientUserId).first();
  if (!client) {
    return fail(404, "user_not_found", "Cliente non trovato.");
  }
  if (coachUserId) {
    const coach = await env.DB.prepare(
      `SELECT id FROM users WHERE id = ? AND user_type = 'coach' AND status != 'disabled' LIMIT 1`
    ).bind(coachUserId).first();
    if (!coach) {
      return fail(400, "invalid_coach", "Il coach deve essere un utente coach esistente.");
    }
  }
  await env.DB.prepare(
    `
      UPDATE users
      SET coach_user_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
  ).bind(coachUserId, clientUserId).run();
  return { ok: true };
}, "assignCoachToClient");
var createBodyCheckin = /* @__PURE__ */ __name(async (env, auth, userId, payload) => {
  const targetUser = await requireManagedUserAccess(auth, env, userId);
  if (targetUser instanceof Response) return targetUser;
  await env.DB.prepare(
    `
      INSERT INTO body_checkins (
        id,
        user_id,
        recorded_at,
        weight,
        body_fat,
        created_by_user_id
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `
  ).bind(
    crypto.randomUUID(),
    targetUser.id,
    payload.recordedAt,
    payload.weight,
    payload.fat,
    auth.user.id
  ).run();
  return getManagedUserDetail(env, auth, targetUser.id);
}, "createBodyCheckin");

// api/admin/users/[userId]/checkins.ts
var onRequestPost2 = /* @__PURE__ */ __name(async ({ request, env, params }) => {
  const auth = await requireManager(request, env);
  if (auth instanceof Response) return auth;
  const userId = params.userId;
  if (!userId) {
    return fail(400, "invalid_user", "L'identificativo utente \xE8 obbligatorio.");
  }
  const bodyOrResponse = await readJson(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;
  const weight = Number(bodyOrResponse.weight);
  const fat = bodyOrResponse.fat === void 0 || bodyOrResponse.fat === null ? null : Number(bodyOrResponse.fat);
  if (!bodyOrResponse.recordedAt?.trim() || !Number.isFinite(weight) || weight <= 0) {
    return fail(400, "invalid_payload", "La data della rilevazione e un peso positivo sono obbligatori.");
  }
  if (fat !== null && (!Number.isFinite(fat) || fat < 0 || fat > 100)) {
    return fail(400, "invalid_payload", "La massa grassa deve essere compresa tra 0 e 100.");
  }
  const detail = await createBodyCheckin(env, auth, userId, {
    recordedAt: bodyOrResponse.recordedAt.trim(),
    weight,
    fat
  });
  return detail instanceof Response ? detail : json(detail);
}, "onRequestPost");

// api/admin/users/[userId]/coach.ts
var onRequestPut2 = /* @__PURE__ */ __name(async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;
  const userId = params.userId;
  if (!userId) {
    return fail(400, "invalid_user", "L'identificativo utente \xE8 obbligatorio.");
  }
  const bodyOrResponse = await readJson(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;
  const result = await assignCoachToClient(
    env,
    userId,
    typeof bodyOrResponse.coachUserId === "string" ? bodyOrResponse.coachUserId.trim() || null : null
  );
  if (result instanceof Response) return result;
  const detail = await getManagedUserDetail(env, auth, userId);
  return detail instanceof Response ? detail : json(detail);
}, "onRequestPut");

// api/admin/users/[userId]/detail.ts
var onRequestGet2 = /* @__PURE__ */ __name(async ({ request, env, params }) => {
  const auth = await requireManager(request, env);
  if (auth instanceof Response) return auth;
  const userId = params.userId;
  if (!userId) {
    return fail(400, "invalid_user", "L'identificativo utente \xE8 obbligatorio.");
  }
  const detail = await getManagedUserDetail(env, auth, userId);
  return detail instanceof Response ? detail : json(detail);
}, "onRequestGet");

// api/admin/users/[userId]/workouts/index.ts
var onRequestGet3 = /* @__PURE__ */ __name(async ({ request, env, params }) => {
  const auth = await requireManager(request, env);
  if (auth instanceof Response) return auth;
  const userId = params.userId;
  if (!userId) return fail(400, "invalid_user", "L'identificativo utente \xE8 obbligatorio.");
  const access = await requireManagedUserAccess(auth, env, userId);
  if (access instanceof Response) return access;
  const workouts = await listWorkoutPlansForUser(env, userId);
  return json({ workouts });
}, "onRequestGet");
var onRequestPost3 = /* @__PURE__ */ __name(async ({ request, env, params }) => {
  const auth = await requireManager(request, env);
  if (auth instanceof Response) return auth;
  const userId = params.userId;
  if (!userId) return fail(400, "invalid_user", "L'identificativo utente \xE8 obbligatorio.");
  const access = await requireManagedUserAccess(auth, env, userId);
  if (access instanceof Response) return access;
  const bodyOrResponse = await readJson(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;
  const created = await createWorkoutPlanForUser(
    env,
    userId,
    auth.user.id,
    typeof bodyOrResponse.copyFromPlanId === "string" ? bodyOrResponse.copyFromPlanId.trim() || null : null
  );
  if (created instanceof Response) return created;
  return json({ plan: created }, 201);
}, "onRequestPost");

// api/_lib/users.ts
var findUserByEmail = /* @__PURE__ */ __name(async (env, email) => env.DB.prepare(
  `
      SELECT
        id,
        email,
        full_name,
        user_type,
        is_admin,
        status,
        coach_user_id,
        invited_by_user_id,
        invite_token_hash,
        invite_expires_at,
        invited_at,
        activated_at,
        last_login_at,
        created_at,
        updated_at
      FROM users
      WHERE email = ?
      LIMIT 1
    `
).bind(normalizeEmail(email)).first(), "findUserByEmail");
var getAuthUserById = /* @__PURE__ */ __name(async (env, userId) => {
  const row = await env.DB.prepare(
    `
      SELECT
        id,
        email,
        full_name,
        user_type,
        is_admin,
        status,
        coach_user_id
      FROM users
      WHERE id = ?
      LIMIT 1
    `
  ).bind(userId).first();
  return row ? toAuthUser(row) : null;
}, "getAuthUserById");
var findInvitedUserByToken = /* @__PURE__ */ __name(async (env, inviteToken) => {
  const tokenHash = await sha256Hex(inviteToken);
  return env.DB.prepare(
    `
      SELECT
        id,
        email,
        full_name,
        user_type,
        is_admin,
        status,
        coach_user_id,
        invited_by_user_id,
        invite_token_hash,
        invite_expires_at,
        invited_at,
        activated_at,
        last_login_at,
        created_at,
        updated_at
      FROM users
      WHERE invite_token_hash = ?
        AND status = 'invited'
        AND datetime(invite_expires_at) > CURRENT_TIMESTAMP
      LIMIT 1
    `
  ).bind(tokenHash).first();
}, "findInvitedUserByToken");
var createInvitedUser = /* @__PURE__ */ __name(async (env, input) => {
  const normalizedEmail = normalizeEmail(input.email);
  const fullName = input.fullName?.trim() || null;
  const expiresInHours = Number(input.expiresInHours);
  if (!normalizedEmail) {
    return fail(400, "invalid_email", "L'email \xE8 obbligatoria.");
  }
  if (!["client", "coach"].includes(input.userType)) {
    return fail(400, "invalid_user_type", "Il tipo utente deve essere cliente oppure coach.");
  }
  if (!Number.isFinite(expiresInHours) || expiresInHours <= 0 || expiresInHours > 24 * 30) {
    return fail(400, "invalid_expiry", "La scadenza dell'invito deve essere compresa tra 1 e 720 ore.");
  }
  const existingUser = await findUserByEmail(env, normalizedEmail);
  if (existingUser) {
    return fail(409, "account_exists", "Esiste gi\xE0 un utente con questa email.");
  }
  let coachUserId = null;
  if (input.userType === "client" && input.coachUserId) {
    const coach = await env.DB.prepare(
      `
        SELECT id
        FROM users
        WHERE id = ?
          AND user_type = 'coach'
          AND status != 'disabled'
        LIMIT 1
      `
    ).bind(input.coachUserId).first();
    if (!coach) {
      return fail(400, "invalid_coach", "Il coach assegnato deve essere un utente coach esistente.");
    }
    coachUserId = input.coachUserId;
  }
  const userId = crypto.randomUUID();
  const inviteToken = crypto.randomUUID();
  const inviteTokenHash = await sha256Hex(inviteToken);
  const inviteExpiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1e3).toISOString();
  await env.DB.prepare(
    `
      INSERT INTO users (
        id,
        email,
        full_name,
        user_type,
        is_admin,
        status,
        coach_user_id,
        invited_by_user_id,
        invite_token_hash,
        invite_expires_at,
        invited_at
      )
      VALUES (?, ?, ?, ?, 0, 'invited', ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `
  ).bind(
    userId,
    normalizedEmail,
    fullName,
    input.userType,
    coachUserId,
    input.invitedByUserId,
    inviteTokenHash,
    inviteExpiresAt
  ).run();
  return { userId, inviteToken };
}, "createInvitedUser");
var activateInvitedUser = /* @__PURE__ */ __name(async (env, invitedUser, email, identity, password) => {
  const normalizedEmail = normalizeEmail(email);
  if (normalizeEmail(invitedUser.email) !== normalizedEmail) {
    return fail(400, "email_mismatch", "L'email dell'invito non corrisponde a quella inserita.");
  }
  if (identity.provider === "email") {
    if (!password || password.length < 8) {
      return fail(400, "invalid_password", "La password deve contenere almeno 8 caratteri.");
    }
  }
  const existingIdentity = await env.DB.prepare(
    `
      SELECT id
      FROM user_identities
      WHERE provider = ?
        AND provider_subject = ?
      LIMIT 1
    `
  ).bind(identity.provider, identity.providerSubject).first();
  if (existingIdentity) {
    return fail(409, "identity_conflict", "Questa identit\xE0 \xE8 gi\xE0 collegata a un altro account.");
  }
  const statements = [
    env.DB.prepare(
      `
          INSERT INTO user_identities (
            id,
            user_id,
            provider,
            provider_subject,
            email_verified,
            last_login_at
          )
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `
    ).bind(
      crypto.randomUUID(),
      invitedUser.id,
      identity.provider,
      identity.providerSubject,
      identity.emailVerified ? 1 : 0
    ),
    env.DB.prepare(
      `
          UPDATE users
          SET status = 'active',
              invite_token_hash = NULL,
              invite_expires_at = NULL,
              activated_at = CURRENT_TIMESTAMP,
              last_login_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `
    ).bind(invitedUser.id)
  ];
  if (identity.provider === "email" && password) {
    statements.push(
      env.DB.prepare(
        `
            INSERT INTO email_credentials (user_id, password_hash)
            VALUES (?, ?)
          `
      ).bind(invitedUser.id, hashPassword(password))
    );
  }
  await env.DB.batch(statements);
  return { userId: invitedUser.id };
}, "activateInvitedUser");
var attachIdentityToUser = /* @__PURE__ */ __name(async (env, userId, provider, providerSubject, emailVerified) => {
  try {
    await env.DB.prepare(
      `
        INSERT INTO user_identities (
          id,
          user_id,
          provider,
          provider_subject,
          email_verified,
          last_login_at
        )
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `
    ).bind(crypto.randomUUID(), userId, provider, providerSubject, emailVerified ? 1 : 0).run();
    return true;
  } catch {
    return false;
  }
}, "attachIdentityToUser");
var getUserByIdentity = /* @__PURE__ */ __name(async (env, provider, providerSubject) => env.DB.prepare(
  `
      SELECT
        u.id,
        u.email,
        u.full_name,
        u.user_type,
        u.is_admin,
        u.status,
        u.coach_user_id,
        u.invited_by_user_id,
        u.invite_token_hash,
        u.invite_expires_at,
        u.invited_at,
        u.activated_at,
        u.last_login_at,
        u.created_at,
        u.updated_at
      FROM user_identities i
      JOIN users u ON u.id = i.user_id
      WHERE i.provider = ?
        AND i.provider_subject = ?
      LIMIT 1
    `
).bind(provider, providerSubject).first(), "getUserByIdentity");
var touchIdentityLogin = /* @__PURE__ */ __name(async (env, provider, providerSubject, userId) => {
  await env.DB.batch([
    env.DB.prepare(
      `
          UPDATE user_identities
          SET last_login_at = CURRENT_TIMESTAMP
          WHERE provider = ?
            AND provider_subject = ?
        `
    ).bind(provider, providerSubject),
    env.DB.prepare(
      `
          UPDATE users
          SET last_login_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `
    ).bind(userId)
  ]);
}, "touchIdentityLogin");

// api/auth/login/email.ts
var onRequestPost4 = /* @__PURE__ */ __name(async ({ request, env }) => {
  const bodyOrResponse = await readJson(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;
  const email = normalizeEmail(bodyOrResponse.email || "");
  const password = bodyOrResponse.password || "";
  if (!email || !password) {
    return fail(400, "invalid_credentials", "Email e password sono obbligatorie.");
  }
  const account = await env.DB.prepare(
    `
      SELECT
        u.id,
        u.email,
        u.status,
        c.password_hash
      FROM users u
      JOIN email_credentials c ON c.user_id = u.id
      WHERE u.email = ?
      LIMIT 1
    `
  ).bind(email).first();
  if (!account || !verifyPassword(password, account.password_hash)) {
    return fail(401, "invalid_credentials", "Email o password non valide.");
  }
  if (account.status === "invited") {
    return fail(403, "account_not_activated", "Completa l'attivazione dell'invito prima di accedere.");
  }
  if (account.status === "disabled") {
    return fail(403, "account_disabled", "L'account \xE8 disabilitato.");
  }
  await touchIdentityLogin(env, "email", account.email, account.id);
  const user = await getAuthUserById(env, account.id);
  if (!user) {
    return fail(500, "user_not_found", "Impossibile caricare l'account.");
  }
  const { cookieHeader } = await issueSession(request, env, account.id);
  return json(
    { user },
    200,
    {
      "set-cookie": cookieHeader
    }
  );
}, "onRequestPost");

// ../node_modules/jose/dist/webapi/lib/buffer_utils.js
var encoder = new TextEncoder();
var decoder = new TextDecoder();
var MAX_INT32 = 2 ** 32;
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0);
  const buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers) {
    buf.set(buffer, i);
    i += buffer.length;
  }
  return buf;
}
__name(concat, "concat");
function encode(string) {
  const bytes = new Uint8Array(string.length);
  for (let i = 0; i < string.length; i++) {
    const code = string.charCodeAt(i);
    if (code > 127) {
      throw new TypeError("non-ASCII string encountered in encode()");
    }
    bytes[i] = code;
  }
  return bytes;
}
__name(encode, "encode");

// ../node_modules/jose/dist/webapi/lib/base64.js
function decodeBase64(encoded) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(encoded);
  }
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
__name(decodeBase64, "decodeBase64");

// ../node_modules/jose/dist/webapi/util/base64url.js
function decode(input) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(typeof input === "string" ? input : decoder.decode(input), {
      alphabet: "base64url"
    });
  }
  let encoded = input;
  if (encoded instanceof Uint8Array) {
    encoded = decoder.decode(encoded);
  }
  encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return decodeBase64(encoded);
  } catch {
    throw new TypeError("The input to be decoded is not correctly encoded.");
  }
}
__name(decode, "decode");

// ../node_modules/jose/dist/webapi/util/errors.js
var JOSEError = class extends Error {
  static {
    __name(this, "JOSEError");
  }
  static code = "ERR_JOSE_GENERIC";
  code = "ERR_JOSE_GENERIC";
  constructor(message2, options) {
    super(message2, options);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
};
var JWTClaimValidationFailed = class extends JOSEError {
  static {
    __name(this, "JWTClaimValidationFailed");
  }
  static code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
var JWTExpired = class extends JOSEError {
  static {
    __name(this, "JWTExpired");
  }
  static code = "ERR_JWT_EXPIRED";
  code = "ERR_JWT_EXPIRED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
var JOSEAlgNotAllowed = class extends JOSEError {
  static {
    __name(this, "JOSEAlgNotAllowed");
  }
  static code = "ERR_JOSE_ALG_NOT_ALLOWED";
  code = "ERR_JOSE_ALG_NOT_ALLOWED";
};
var JOSENotSupported = class extends JOSEError {
  static {
    __name(this, "JOSENotSupported");
  }
  static code = "ERR_JOSE_NOT_SUPPORTED";
  code = "ERR_JOSE_NOT_SUPPORTED";
};
var JWSInvalid = class extends JOSEError {
  static {
    __name(this, "JWSInvalid");
  }
  static code = "ERR_JWS_INVALID";
  code = "ERR_JWS_INVALID";
};
var JWTInvalid = class extends JOSEError {
  static {
    __name(this, "JWTInvalid");
  }
  static code = "ERR_JWT_INVALID";
  code = "ERR_JWT_INVALID";
};
var JWKSInvalid = class extends JOSEError {
  static {
    __name(this, "JWKSInvalid");
  }
  static code = "ERR_JWKS_INVALID";
  code = "ERR_JWKS_INVALID";
};
var JWKSNoMatchingKey = class extends JOSEError {
  static {
    __name(this, "JWKSNoMatchingKey");
  }
  static code = "ERR_JWKS_NO_MATCHING_KEY";
  code = "ERR_JWKS_NO_MATCHING_KEY";
  constructor(message2 = "no applicable key found in the JSON Web Key Set", options) {
    super(message2, options);
  }
};
var JWKSMultipleMatchingKeys = class extends JOSEError {
  static {
    __name(this, "JWKSMultipleMatchingKeys");
  }
  [Symbol.asyncIterator];
  static code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  constructor(message2 = "multiple matching keys found in the JSON Web Key Set", options) {
    super(message2, options);
  }
};
var JWKSTimeout = class extends JOSEError {
  static {
    __name(this, "JWKSTimeout");
  }
  static code = "ERR_JWKS_TIMEOUT";
  code = "ERR_JWKS_TIMEOUT";
  constructor(message2 = "request timed out", options) {
    super(message2, options);
  }
};
var JWSSignatureVerificationFailed = class extends JOSEError {
  static {
    __name(this, "JWSSignatureVerificationFailed");
  }
  static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  constructor(message2 = "signature verification failed", options) {
    super(message2, options);
  }
};

// ../node_modules/jose/dist/webapi/lib/crypto_key.js
var unusable = /* @__PURE__ */ __name((name, prop = "algorithm.name") => new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`), "unusable");
var isAlgorithm = /* @__PURE__ */ __name((algorithm, name) => algorithm.name === name, "isAlgorithm");
function getHashLength(hash) {
  return parseInt(hash.name.slice(4), 10);
}
__name(getHashLength, "getHashLength");
function getNamedCurve(alg) {
  switch (alg) {
    case "ES256":
      return "P-256";
    case "ES384":
      return "P-384";
    case "ES512":
      return "P-521";
    default:
      throw new Error("unreachable");
  }
}
__name(getNamedCurve, "getNamedCurve");
function checkUsage(key, usage) {
  if (usage && !key.usages.includes(usage)) {
    throw new TypeError(`CryptoKey does not support this operation, its usages must include ${usage}.`);
  }
}
__name(checkUsage, "checkUsage");
function checkSigCryptoKey(key, alg, usage) {
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512": {
      if (!isAlgorithm(key.algorithm, "HMAC"))
        throw unusable("HMAC");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "RS256":
    case "RS384":
    case "RS512": {
      if (!isAlgorithm(key.algorithm, "RSASSA-PKCS1-v1_5"))
        throw unusable("RSASSA-PKCS1-v1_5");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "PS256":
    case "PS384":
    case "PS512": {
      if (!isAlgorithm(key.algorithm, "RSA-PSS"))
        throw unusable("RSA-PSS");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "Ed25519":
    case "EdDSA": {
      if (!isAlgorithm(key.algorithm, "Ed25519"))
        throw unusable("Ed25519");
      break;
    }
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87": {
      if (!isAlgorithm(key.algorithm, alg))
        throw unusable(alg);
      break;
    }
    case "ES256":
    case "ES384":
    case "ES512": {
      if (!isAlgorithm(key.algorithm, "ECDSA"))
        throw unusable("ECDSA");
      const expected = getNamedCurve(alg);
      const actual = key.algorithm.namedCurve;
      if (actual !== expected)
        throw unusable(expected, "algorithm.namedCurve");
      break;
    }
    default:
      throw new TypeError("CryptoKey does not support this operation");
  }
  checkUsage(key, usage);
}
__name(checkSigCryptoKey, "checkSigCryptoKey");

// ../node_modules/jose/dist/webapi/lib/invalid_key_input.js
function message(msg, actual, ...types) {
  types = types.filter(Boolean);
  if (types.length > 2) {
    const last = types.pop();
    msg += `one of type ${types.join(", ")}, or ${last}.`;
  } else if (types.length === 2) {
    msg += `one of type ${types[0]} or ${types[1]}.`;
  } else {
    msg += `of type ${types[0]}.`;
  }
  if (actual == null) {
    msg += ` Received ${actual}`;
  } else if (typeof actual === "function" && actual.name) {
    msg += ` Received function ${actual.name}`;
  } else if (typeof actual === "object" && actual != null) {
    if (actual.constructor?.name) {
      msg += ` Received an instance of ${actual.constructor.name}`;
    }
  }
  return msg;
}
__name(message, "message");
var invalidKeyInput = /* @__PURE__ */ __name((actual, ...types) => message("Key must be ", actual, ...types), "invalidKeyInput");
var withAlg = /* @__PURE__ */ __name((alg, actual, ...types) => message(`Key for the ${alg} algorithm must be `, actual, ...types), "withAlg");

// ../node_modules/jose/dist/webapi/lib/is_key_like.js
var isCryptoKey = /* @__PURE__ */ __name((key) => {
  if (key?.[Symbol.toStringTag] === "CryptoKey")
    return true;
  try {
    return key instanceof CryptoKey;
  } catch {
    return false;
  }
}, "isCryptoKey");
var isKeyObject = /* @__PURE__ */ __name((key) => key?.[Symbol.toStringTag] === "KeyObject", "isKeyObject");
var isKeyLike = /* @__PURE__ */ __name((key) => isCryptoKey(key) || isKeyObject(key), "isKeyLike");

// ../node_modules/jose/dist/webapi/lib/is_disjoint.js
function isDisjoint(...headers) {
  const sources = headers.filter(Boolean);
  if (sources.length === 0 || sources.length === 1) {
    return true;
  }
  let acc;
  for (const header of sources) {
    const parameters = Object.keys(header);
    if (!acc || acc.size === 0) {
      acc = new Set(parameters);
      continue;
    }
    for (const parameter of parameters) {
      if (acc.has(parameter)) {
        return false;
      }
      acc.add(parameter);
    }
  }
  return true;
}
__name(isDisjoint, "isDisjoint");

// ../node_modules/jose/dist/webapi/lib/is_object.js
var isObjectLike = /* @__PURE__ */ __name((value) => typeof value === "object" && value !== null, "isObjectLike");
function isObject(input) {
  if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
    return false;
  }
  if (Object.getPrototypeOf(input) === null) {
    return true;
  }
  let proto = input;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(input) === proto;
}
__name(isObject, "isObject");

// ../node_modules/jose/dist/webapi/lib/check_key_length.js
function checkKeyLength(alg, key) {
  if (alg.startsWith("RS") || alg.startsWith("PS")) {
    const { modulusLength } = key.algorithm;
    if (typeof modulusLength !== "number" || modulusLength < 2048) {
      throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
    }
  }
}
__name(checkKeyLength, "checkKeyLength");

// ../node_modules/jose/dist/webapi/lib/jwk_to_key.js
function subtleMapping(jwk) {
  let algorithm;
  let keyUsages;
  switch (jwk.kty) {
    case "AKP": {
      switch (jwk.alg) {
        case "ML-DSA-44":
        case "ML-DSA-65":
        case "ML-DSA-87":
          algorithm = { name: jwk.alg };
          keyUsages = jwk.priv ? ["sign"] : ["verify"];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "RSA": {
      switch (jwk.alg) {
        case "PS256":
        case "PS384":
        case "PS512":
          algorithm = { name: "RSA-PSS", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RS256":
        case "RS384":
        case "RS512":
          algorithm = { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512":
          algorithm = {
            name: "RSA-OAEP",
            hash: `SHA-${parseInt(jwk.alg.slice(-3), 10) || 1}`
          };
          keyUsages = jwk.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "EC": {
      switch (jwk.alg) {
        case "ES256":
          algorithm = { name: "ECDSA", namedCurve: "P-256" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ES384":
          algorithm = { name: "ECDSA", namedCurve: "P-384" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ES512":
          algorithm = { name: "ECDSA", namedCurve: "P-521" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: "ECDH", namedCurve: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "OKP": {
      switch (jwk.alg) {
        case "Ed25519":
        case "EdDSA":
          algorithm = { name: "Ed25519" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    default:
      throw new JOSENotSupported('Invalid or unsupported JWK "kty" (Key Type) Parameter value');
  }
  return { algorithm, keyUsages };
}
__name(subtleMapping, "subtleMapping");
async function jwkToKey(jwk) {
  if (!jwk.alg) {
    throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
  }
  const { algorithm, keyUsages } = subtleMapping(jwk);
  const keyData = { ...jwk };
  if (keyData.kty !== "AKP") {
    delete keyData.alg;
  }
  delete keyData.use;
  return crypto.subtle.importKey("jwk", keyData, algorithm, jwk.ext ?? (jwk.d || jwk.priv ? false : true), jwk.key_ops ?? keyUsages);
}
__name(jwkToKey, "jwkToKey");

// ../node_modules/jose/dist/webapi/key/import.js
async function importJWK(jwk, alg, options) {
  if (!isObject(jwk)) {
    throw new TypeError("JWK must be an object");
  }
  let ext;
  alg ??= jwk.alg;
  ext ??= options?.extractable ?? jwk.ext;
  switch (jwk.kty) {
    case "oct":
      if (typeof jwk.k !== "string" || !jwk.k) {
        throw new TypeError('missing "k" (Key Value) Parameter value');
      }
      return decode(jwk.k);
    case "RSA":
      if ("oth" in jwk && jwk.oth !== void 0) {
        throw new JOSENotSupported('RSA JWK "oth" (Other Primes Info) Parameter value is not supported');
      }
      return jwkToKey({ ...jwk, alg, ext });
    case "AKP": {
      if (typeof jwk.alg !== "string" || !jwk.alg) {
        throw new TypeError('missing "alg" (Algorithm) Parameter value');
      }
      if (alg !== void 0 && alg !== jwk.alg) {
        throw new TypeError("JWK alg and alg option value mismatch");
      }
      return jwkToKey({ ...jwk, ext });
    }
    case "EC":
    case "OKP":
      return jwkToKey({ ...jwk, alg, ext });
    default:
      throw new JOSENotSupported('Unsupported "kty" (Key Type) Parameter value');
  }
}
__name(importJWK, "importJWK");

// ../node_modules/jose/dist/webapi/lib/validate_crit.js
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0) {
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  }
  if (!protectedHeader || protectedHeader.crit === void 0) {
    return /* @__PURE__ */ new Set();
  }
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== "string" || input.length === 0)) {
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  }
  let recognized;
  if (recognizedOption !== void 0) {
    recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
  } else {
    recognized = recognizedDefault;
  }
  for (const parameter of protectedHeader.crit) {
    if (!recognized.has(parameter)) {
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    }
    if (joseHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    }
    if (recognized.get(parameter) && protectedHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
    }
  }
  return new Set(protectedHeader.crit);
}
__name(validateCrit, "validateCrit");

// ../node_modules/jose/dist/webapi/lib/validate_algorithms.js
function validateAlgorithms(option, algorithms) {
  if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s !== "string"))) {
    throw new TypeError(`"${option}" option must be an array of strings`);
  }
  if (!algorithms) {
    return void 0;
  }
  return new Set(algorithms);
}
__name(validateAlgorithms, "validateAlgorithms");

// ../node_modules/jose/dist/webapi/lib/is_jwk.js
var isJWK = /* @__PURE__ */ __name((key) => isObject(key) && typeof key.kty === "string", "isJWK");
var isPrivateJWK = /* @__PURE__ */ __name((key) => key.kty !== "oct" && (key.kty === "AKP" && typeof key.priv === "string" || typeof key.d === "string"), "isPrivateJWK");
var isPublicJWK = /* @__PURE__ */ __name((key) => key.kty !== "oct" && key.d === void 0 && key.priv === void 0, "isPublicJWK");
var isSecretJWK = /* @__PURE__ */ __name((key) => key.kty === "oct" && typeof key.k === "string", "isSecretJWK");

// ../node_modules/jose/dist/webapi/lib/normalize_key.js
var cache;
var handleJWK = /* @__PURE__ */ __name(async (key, jwk, alg, freeze = false) => {
  cache ||= /* @__PURE__ */ new WeakMap();
  let cached = cache.get(key);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const cryptoKey = await jwkToKey({ ...jwk, alg });
  if (freeze)
    Object.freeze(key);
  if (!cached) {
    cache.set(key, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
}, "handleJWK");
var handleKeyObject = /* @__PURE__ */ __name((keyObject, alg) => {
  cache ||= /* @__PURE__ */ new WeakMap();
  let cached = cache.get(keyObject);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const isPublic = keyObject.type === "public";
  const extractable = isPublic ? true : false;
  let cryptoKey;
  if (keyObject.asymmetricKeyType === "x25519") {
    switch (alg) {
      case "ECDH-ES":
      case "ECDH-ES+A128KW":
      case "ECDH-ES+A192KW":
      case "ECDH-ES+A256KW":
        break;
      default:
        throw new TypeError("given KeyObject instance cannot be used for this algorithm");
    }
    cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, isPublic ? [] : ["deriveBits"]);
  }
  if (keyObject.asymmetricKeyType === "ed25519") {
    if (alg !== "EdDSA" && alg !== "Ed25519") {
      throw new TypeError("given KeyObject instance cannot be used for this algorithm");
    }
    cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
      isPublic ? "verify" : "sign"
    ]);
  }
  switch (keyObject.asymmetricKeyType) {
    case "ml-dsa-44":
    case "ml-dsa-65":
    case "ml-dsa-87": {
      if (alg !== keyObject.asymmetricKeyType.toUpperCase()) {
        throw new TypeError("given KeyObject instance cannot be used for this algorithm");
      }
      cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
        isPublic ? "verify" : "sign"
      ]);
    }
  }
  if (keyObject.asymmetricKeyType === "rsa") {
    let hash;
    switch (alg) {
      case "RSA-OAEP":
        hash = "SHA-1";
        break;
      case "RS256":
      case "PS256":
      case "RSA-OAEP-256":
        hash = "SHA-256";
        break;
      case "RS384":
      case "PS384":
      case "RSA-OAEP-384":
        hash = "SHA-384";
        break;
      case "RS512":
      case "PS512":
      case "RSA-OAEP-512":
        hash = "SHA-512";
        break;
      default:
        throw new TypeError("given KeyObject instance cannot be used for this algorithm");
    }
    if (alg.startsWith("RSA-OAEP")) {
      return keyObject.toCryptoKey({
        name: "RSA-OAEP",
        hash
      }, extractable, isPublic ? ["encrypt"] : ["decrypt"]);
    }
    cryptoKey = keyObject.toCryptoKey({
      name: alg.startsWith("PS") ? "RSA-PSS" : "RSASSA-PKCS1-v1_5",
      hash
    }, extractable, [isPublic ? "verify" : "sign"]);
  }
  if (keyObject.asymmetricKeyType === "ec") {
    const nist = /* @__PURE__ */ new Map([
      ["prime256v1", "P-256"],
      ["secp384r1", "P-384"],
      ["secp521r1", "P-521"]
    ]);
    const namedCurve = nist.get(keyObject.asymmetricKeyDetails?.namedCurve);
    if (!namedCurve) {
      throw new TypeError("given KeyObject instance cannot be used for this algorithm");
    }
    if (alg === "ES256" && namedCurve === "P-256") {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDSA",
        namedCurve
      }, extractable, [isPublic ? "verify" : "sign"]);
    }
    if (alg === "ES384" && namedCurve === "P-384") {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDSA",
        namedCurve
      }, extractable, [isPublic ? "verify" : "sign"]);
    }
    if (alg === "ES512" && namedCurve === "P-521") {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDSA",
        namedCurve
      }, extractable, [isPublic ? "verify" : "sign"]);
    }
    if (alg.startsWith("ECDH-ES")) {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDH",
        namedCurve
      }, extractable, isPublic ? [] : ["deriveBits"]);
    }
  }
  if (!cryptoKey) {
    throw new TypeError("given KeyObject instance cannot be used for this algorithm");
  }
  if (!cached) {
    cache.set(keyObject, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
}, "handleKeyObject");
async function normalizeKey(key, alg) {
  if (key instanceof Uint8Array) {
    return key;
  }
  if (isCryptoKey(key)) {
    return key;
  }
  if (isKeyObject(key)) {
    if (key.type === "secret") {
      return key.export();
    }
    if ("toCryptoKey" in key && typeof key.toCryptoKey === "function") {
      try {
        return handleKeyObject(key, alg);
      } catch (err) {
        if (err instanceof TypeError) {
          throw err;
        }
      }
    }
    let jwk = key.export({ format: "jwk" });
    return handleJWK(key, jwk, alg);
  }
  if (isJWK(key)) {
    if (key.k) {
      return decode(key.k);
    }
    return handleJWK(key, key, alg, true);
  }
  throw new Error("unreachable");
}
__name(normalizeKey, "normalizeKey");

// ../node_modules/jose/dist/webapi/lib/check_key_type.js
var tag = /* @__PURE__ */ __name((key) => key?.[Symbol.toStringTag], "tag");
var jwkMatchesOp = /* @__PURE__ */ __name((alg, key, usage) => {
  if (key.use !== void 0) {
    let expected;
    switch (usage) {
      case "sign":
      case "verify":
        expected = "sig";
        break;
      case "encrypt":
      case "decrypt":
        expected = "enc";
        break;
    }
    if (key.use !== expected) {
      throw new TypeError(`Invalid key for this operation, its "use" must be "${expected}" when present`);
    }
  }
  if (key.alg !== void 0 && key.alg !== alg) {
    throw new TypeError(`Invalid key for this operation, its "alg" must be "${alg}" when present`);
  }
  if (Array.isArray(key.key_ops)) {
    let expectedKeyOp;
    switch (true) {
      case (usage === "sign" || usage === "verify"):
      case alg === "dir":
      case alg.includes("CBC-HS"):
        expectedKeyOp = usage;
        break;
      case alg.startsWith("PBES2"):
        expectedKeyOp = "deriveBits";
        break;
      case /^A\d{3}(?:GCM)?(?:KW)?$/.test(alg):
        if (!alg.includes("GCM") && alg.endsWith("KW")) {
          expectedKeyOp = usage === "encrypt" ? "wrapKey" : "unwrapKey";
        } else {
          expectedKeyOp = usage;
        }
        break;
      case (usage === "encrypt" && alg.startsWith("RSA")):
        expectedKeyOp = "wrapKey";
        break;
      case usage === "decrypt":
        expectedKeyOp = alg.startsWith("RSA") ? "unwrapKey" : "deriveBits";
        break;
    }
    if (expectedKeyOp && key.key_ops?.includes?.(expectedKeyOp) === false) {
      throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${expectedKeyOp}" when present`);
    }
  }
  return true;
}, "jwkMatchesOp");
var symmetricTypeCheck = /* @__PURE__ */ __name((alg, key, usage) => {
  if (key instanceof Uint8Array)
    return;
  if (isJWK(key)) {
    if (isSecretJWK(key) && jwkMatchesOp(alg, key, usage))
      return;
    throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
  }
  if (!isKeyLike(key)) {
    throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key", "Uint8Array"));
  }
  if (key.type !== "secret") {
    throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
  }
}, "symmetricTypeCheck");
var asymmetricTypeCheck = /* @__PURE__ */ __name((alg, key, usage) => {
  if (isJWK(key)) {
    switch (usage) {
      case "decrypt":
      case "sign":
        if (isPrivateJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation must be a private JWK`);
      case "encrypt":
      case "verify":
        if (isPublicJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation must be a public JWK`);
    }
  }
  if (!isKeyLike(key)) {
    throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key"));
  }
  if (key.type === "secret") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
  }
  if (key.type === "public") {
    switch (usage) {
      case "sign":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm signing must be of type "private"`);
      case "decrypt":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm decryption must be of type "private"`);
    }
  }
  if (key.type === "private") {
    switch (usage) {
      case "verify":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm verifying must be of type "public"`);
      case "encrypt":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm encryption must be of type "public"`);
    }
  }
}, "asymmetricTypeCheck");
function checkKeyType(alg, key, usage) {
  switch (alg.substring(0, 2)) {
    case "A1":
    case "A2":
    case "di":
    case "HS":
    case "PB":
      symmetricTypeCheck(alg, key, usage);
      break;
    default:
      asymmetricTypeCheck(alg, key, usage);
  }
}
__name(checkKeyType, "checkKeyType");

// ../node_modules/jose/dist/webapi/lib/subtle_dsa.js
function subtleAlgorithm(alg, algorithm) {
  const hash = `SHA-${alg.slice(-3)}`;
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512":
      return { hash, name: "HMAC" };
    case "PS256":
    case "PS384":
    case "PS512":
      return { hash, name: "RSA-PSS", saltLength: parseInt(alg.slice(-3), 10) >> 3 };
    case "RS256":
    case "RS384":
    case "RS512":
      return { hash, name: "RSASSA-PKCS1-v1_5" };
    case "ES256":
    case "ES384":
    case "ES512":
      return { hash, name: "ECDSA", namedCurve: algorithm.namedCurve };
    case "Ed25519":
    case "EdDSA":
      return { name: "Ed25519" };
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87":
      return { name: alg };
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  }
}
__name(subtleAlgorithm, "subtleAlgorithm");

// ../node_modules/jose/dist/webapi/lib/get_sign_verify_key.js
async function getSigKey(alg, key, usage) {
  if (key instanceof Uint8Array) {
    if (!alg.startsWith("HS")) {
      throw new TypeError(invalidKeyInput(key, "CryptoKey", "KeyObject", "JSON Web Key"));
    }
    return crypto.subtle.importKey("raw", key, { hash: `SHA-${alg.slice(-3)}`, name: "HMAC" }, false, [usage]);
  }
  checkSigCryptoKey(key, alg, usage);
  return key;
}
__name(getSigKey, "getSigKey");

// ../node_modules/jose/dist/webapi/lib/verify.js
async function verify(alg, key, signature, data) {
  const cryptoKey = await getSigKey(alg, key, "verify");
  checkKeyLength(alg, cryptoKey);
  const algorithm = subtleAlgorithm(alg, cryptoKey.algorithm);
  try {
    return await crypto.subtle.verify(algorithm, cryptoKey, signature, data);
  } catch {
    return false;
  }
}
__name(verify, "verify");

// ../node_modules/jose/dist/webapi/jws/flattened/verify.js
async function flattenedVerify(jws, key, options) {
  if (!isObject(jws)) {
    throw new JWSInvalid("Flattened JWS must be an object");
  }
  if (jws.protected === void 0 && jws.header === void 0) {
    throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
  }
  if (jws.protected !== void 0 && typeof jws.protected !== "string") {
    throw new JWSInvalid("JWS Protected Header incorrect type");
  }
  if (jws.payload === void 0) {
    throw new JWSInvalid("JWS Payload missing");
  }
  if (typeof jws.signature !== "string") {
    throw new JWSInvalid("JWS Signature missing or incorrect type");
  }
  if (jws.header !== void 0 && !isObject(jws.header)) {
    throw new JWSInvalid("JWS Unprotected Header incorrect type");
  }
  let parsedProt = {};
  if (jws.protected) {
    try {
      const protectedHeader = decode(jws.protected);
      parsedProt = JSON.parse(decoder.decode(protectedHeader));
    } catch {
      throw new JWSInvalid("JWS Protected Header is invalid");
    }
  }
  if (!isDisjoint(parsedProt, jws.header)) {
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  }
  const joseHeader = {
    ...parsedProt,
    ...jws.header
  };
  const extensions = validateCrit(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, parsedProt, joseHeader);
  let b64 = true;
  if (extensions.has("b64")) {
    b64 = parsedProt.b64;
    if (typeof b64 !== "boolean") {
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    }
  }
  const { alg } = joseHeader;
  if (typeof alg !== "string" || !alg) {
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  }
  const algorithms = options && validateAlgorithms("algorithms", options.algorithms);
  if (algorithms && !algorithms.has(alg)) {
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  }
  if (b64) {
    if (typeof jws.payload !== "string") {
      throw new JWSInvalid("JWS Payload must be a string");
    }
  } else if (typeof jws.payload !== "string" && !(jws.payload instanceof Uint8Array)) {
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  }
  let resolvedKey = false;
  if (typeof key === "function") {
    key = await key(parsedProt, jws);
    resolvedKey = true;
  }
  checkKeyType(alg, key, "verify");
  const data = concat(jws.protected !== void 0 ? encode(jws.protected) : new Uint8Array(), encode("."), typeof jws.payload === "string" ? b64 ? encode(jws.payload) : encoder.encode(jws.payload) : jws.payload);
  let signature;
  try {
    signature = decode(jws.signature);
  } catch {
    throw new JWSInvalid("Failed to base64url decode the signature");
  }
  const k = await normalizeKey(key, alg);
  const verified = await verify(alg, k, signature, data);
  if (!verified) {
    throw new JWSSignatureVerificationFailed();
  }
  let payload;
  if (b64) {
    try {
      payload = decode(jws.payload);
    } catch {
      throw new JWSInvalid("Failed to base64url decode the payload");
    }
  } else if (typeof jws.payload === "string") {
    payload = encoder.encode(jws.payload);
  } else {
    payload = jws.payload;
  }
  const result = { payload };
  if (jws.protected !== void 0) {
    result.protectedHeader = parsedProt;
  }
  if (jws.header !== void 0) {
    result.unprotectedHeader = jws.header;
  }
  if (resolvedKey) {
    return { ...result, key: k };
  }
  return result;
}
__name(flattenedVerify, "flattenedVerify");

// ../node_modules/jose/dist/webapi/jws/compact/verify.js
async function compactVerify(jws, key, options) {
  if (jws instanceof Uint8Array) {
    jws = decoder.decode(jws);
  }
  if (typeof jws !== "string") {
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  }
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3) {
    throw new JWSInvalid("Invalid Compact JWS");
  }
  const verified = await flattenedVerify({ payload, protected: protectedHeader, signature }, key, options);
  const result = { payload: verified.payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
__name(compactVerify, "compactVerify");

// ../node_modules/jose/dist/webapi/lib/jwt_claims_set.js
var epoch = /* @__PURE__ */ __name((date) => Math.floor(date.getTime() / 1e3), "epoch");
var minute = 60;
var hour = minute * 60;
var day = hour * 24;
var week = day * 7;
var year = day * 365.25;
var REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
function secs(str) {
  const matched = REGEX.exec(str);
  if (!matched || matched[4] && matched[1]) {
    throw new TypeError("Invalid time period format");
  }
  const value = parseFloat(matched[2]);
  const unit = matched[3].toLowerCase();
  let numericDate;
  switch (unit) {
    case "sec":
    case "secs":
    case "second":
    case "seconds":
    case "s":
      numericDate = Math.round(value);
      break;
    case "minute":
    case "minutes":
    case "min":
    case "mins":
    case "m":
      numericDate = Math.round(value * minute);
      break;
    case "hour":
    case "hours":
    case "hr":
    case "hrs":
    case "h":
      numericDate = Math.round(value * hour);
      break;
    case "day":
    case "days":
    case "d":
      numericDate = Math.round(value * day);
      break;
    case "week":
    case "weeks":
    case "w":
      numericDate = Math.round(value * week);
      break;
    default:
      numericDate = Math.round(value * year);
      break;
  }
  if (matched[1] === "-" || matched[4] === "ago") {
    return -numericDate;
  }
  return numericDate;
}
__name(secs, "secs");
var normalizeTyp = /* @__PURE__ */ __name((value) => {
  if (value.includes("/")) {
    return value.toLowerCase();
  }
  return `application/${value.toLowerCase()}`;
}, "normalizeTyp");
var checkAudiencePresence = /* @__PURE__ */ __name((audPayload, audOption) => {
  if (typeof audPayload === "string") {
    return audOption.includes(audPayload);
  }
  if (Array.isArray(audPayload)) {
    return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
  }
  return false;
}, "checkAudiencePresence");
function validateClaimsSet(protectedHeader, encodedPayload, options = {}) {
  let payload;
  try {
    payload = JSON.parse(decoder.decode(encodedPayload));
  } catch {
  }
  if (!isObject(payload)) {
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
  }
  const { typ } = options;
  if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
  }
  const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
  const presenceCheck = [...requiredClaims];
  if (maxTokenAge !== void 0)
    presenceCheck.push("iat");
  if (audience !== void 0)
    presenceCheck.push("aud");
  if (subject !== void 0)
    presenceCheck.push("sub");
  if (issuer !== void 0)
    presenceCheck.push("iss");
  for (const claim of new Set(presenceCheck.reverse())) {
    if (!(claim in payload)) {
      throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
    }
  }
  if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
    throw new JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
  }
  if (subject && payload.sub !== subject) {
    throw new JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
  }
  if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [audience] : audience)) {
    throw new JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
  }
  let tolerance;
  switch (typeof options.clockTolerance) {
    case "string":
      tolerance = secs(options.clockTolerance);
      break;
    case "number":
      tolerance = options.clockTolerance;
      break;
    case "undefined":
      tolerance = 0;
      break;
    default:
      throw new TypeError("Invalid clockTolerance option type");
  }
  const { currentDate } = options;
  const now = epoch(currentDate || /* @__PURE__ */ new Date());
  if ((payload.iat !== void 0 || maxTokenAge) && typeof payload.iat !== "number") {
    throw new JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
  }
  if (payload.nbf !== void 0) {
    if (typeof payload.nbf !== "number") {
      throw new JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
    }
    if (payload.nbf > now + tolerance) {
      throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
    }
  }
  if (payload.exp !== void 0) {
    if (typeof payload.exp !== "number") {
      throw new JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
    }
    if (payload.exp <= now - tolerance) {
      throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
    }
  }
  if (maxTokenAge) {
    const age = now - payload.iat;
    const max = typeof maxTokenAge === "number" ? maxTokenAge : secs(maxTokenAge);
    if (age - tolerance > max) {
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
    }
    if (age < 0 - tolerance) {
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", "check_failed");
    }
  }
  return payload;
}
__name(validateClaimsSet, "validateClaimsSet");

// ../node_modules/jose/dist/webapi/jwt/verify.js
async function jwtVerify(jwt, key, options) {
  const verified = await compactVerify(jwt, key, options);
  if (verified.protectedHeader.crit?.includes("b64") && verified.protectedHeader.b64 === false) {
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  }
  const payload = validateClaimsSet(verified.protectedHeader, verified.payload, options);
  const result = { payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
__name(jwtVerify, "jwtVerify");

// ../node_modules/jose/dist/webapi/jwks/local.js
function getKtyFromAlg(alg) {
  switch (typeof alg === "string" && alg.slice(0, 2)) {
    case "RS":
    case "PS":
      return "RSA";
    case "ES":
      return "EC";
    case "Ed":
      return "OKP";
    case "ML":
      return "AKP";
    default:
      throw new JOSENotSupported('Unsupported "alg" value for a JSON Web Key Set');
  }
}
__name(getKtyFromAlg, "getKtyFromAlg");
function isJWKSLike(jwks) {
  return jwks && typeof jwks === "object" && Array.isArray(jwks.keys) && jwks.keys.every(isJWKLike);
}
__name(isJWKSLike, "isJWKSLike");
function isJWKLike(key) {
  return isObject(key);
}
__name(isJWKLike, "isJWKLike");
var LocalJWKSet = class {
  static {
    __name(this, "LocalJWKSet");
  }
  #jwks;
  #cached = /* @__PURE__ */ new WeakMap();
  constructor(jwks) {
    if (!isJWKSLike(jwks)) {
      throw new JWKSInvalid("JSON Web Key Set malformed");
    }
    this.#jwks = structuredClone(jwks);
  }
  jwks() {
    return this.#jwks;
  }
  async getKey(protectedHeader, token) {
    const { alg, kid } = { ...protectedHeader, ...token?.header };
    const kty = getKtyFromAlg(alg);
    const candidates = this.#jwks.keys.filter((jwk2) => {
      let candidate = kty === jwk2.kty;
      if (candidate && typeof kid === "string") {
        candidate = kid === jwk2.kid;
      }
      if (candidate && (typeof jwk2.alg === "string" || kty === "AKP")) {
        candidate = alg === jwk2.alg;
      }
      if (candidate && typeof jwk2.use === "string") {
        candidate = jwk2.use === "sig";
      }
      if (candidate && Array.isArray(jwk2.key_ops)) {
        candidate = jwk2.key_ops.includes("verify");
      }
      if (candidate) {
        switch (alg) {
          case "ES256":
            candidate = jwk2.crv === "P-256";
            break;
          case "ES384":
            candidate = jwk2.crv === "P-384";
            break;
          case "ES512":
            candidate = jwk2.crv === "P-521";
            break;
          case "Ed25519":
          case "EdDSA":
            candidate = jwk2.crv === "Ed25519";
            break;
        }
      }
      return candidate;
    });
    const { 0: jwk, length } = candidates;
    if (length === 0) {
      throw new JWKSNoMatchingKey();
    }
    if (length !== 1) {
      const error = new JWKSMultipleMatchingKeys();
      const _cached = this.#cached;
      error[Symbol.asyncIterator] = async function* () {
        for (const jwk2 of candidates) {
          try {
            yield await importWithAlgCache(_cached, jwk2, alg);
          } catch {
          }
        }
      };
      throw error;
    }
    return importWithAlgCache(this.#cached, jwk, alg);
  }
};
async function importWithAlgCache(cache2, jwk, alg) {
  const cached = cache2.get(jwk) || cache2.set(jwk, {}).get(jwk);
  if (cached[alg] === void 0) {
    const key = await importJWK({ ...jwk, ext: true }, alg);
    if (key instanceof Uint8Array || key.type !== "public") {
      throw new JWKSInvalid("JSON Web Key Set members must be public keys");
    }
    cached[alg] = key;
  }
  return cached[alg];
}
__name(importWithAlgCache, "importWithAlgCache");
function createLocalJWKSet(jwks) {
  const set = new LocalJWKSet(jwks);
  const localJWKSet = /* @__PURE__ */ __name(async (protectedHeader, token) => set.getKey(protectedHeader, token), "localJWKSet");
  Object.defineProperties(localJWKSet, {
    jwks: {
      value: /* @__PURE__ */ __name(() => structuredClone(set.jwks()), "value"),
      enumerable: false,
      configurable: false,
      writable: false
    }
  });
  return localJWKSet;
}
__name(createLocalJWKSet, "createLocalJWKSet");

// ../node_modules/jose/dist/webapi/jwks/remote.js
function isCloudflareWorkers() {
  return typeof WebSocketPair !== "undefined" || typeof navigator !== "undefined" && true || typeof EdgeRuntime !== "undefined" && EdgeRuntime === "vercel";
}
__name(isCloudflareWorkers, "isCloudflareWorkers");
var USER_AGENT;
if (typeof navigator === "undefined" || !"Cloudflare-Workers"?.startsWith?.("Mozilla/5.0 ")) {
  const NAME = "jose";
  const VERSION = "v6.2.0";
  USER_AGENT = `${NAME}/${VERSION}`;
}
var customFetch = /* @__PURE__ */ Symbol();
async function fetchJwks(url, headers, signal, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    method: "GET",
    signal,
    redirect: "manual",
    headers
  }).catch((err) => {
    if (err.name === "TimeoutError") {
      throw new JWKSTimeout();
    }
    throw err;
  });
  if (response.status !== 200) {
    throw new JOSEError("Expected 200 OK from the JSON Web Key Set HTTP response");
  }
  try {
    return await response.json();
  } catch {
    throw new JOSEError("Failed to parse the JSON Web Key Set HTTP response as JSON");
  }
}
__name(fetchJwks, "fetchJwks");
var jwksCache = /* @__PURE__ */ Symbol();
function isFreshJwksCache(input, cacheMaxAge) {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  if (!("uat" in input) || typeof input.uat !== "number" || Date.now() - input.uat >= cacheMaxAge) {
    return false;
  }
  if (!("jwks" in input) || !isObject(input.jwks) || !Array.isArray(input.jwks.keys) || !Array.prototype.every.call(input.jwks.keys, isObject)) {
    return false;
  }
  return true;
}
__name(isFreshJwksCache, "isFreshJwksCache");
var RemoteJWKSet = class {
  static {
    __name(this, "RemoteJWKSet");
  }
  #url;
  #timeoutDuration;
  #cooldownDuration;
  #cacheMaxAge;
  #jwksTimestamp;
  #pendingFetch;
  #headers;
  #customFetch;
  #local;
  #cache;
  constructor(url, options) {
    if (!(url instanceof URL)) {
      throw new TypeError("url must be an instance of URL");
    }
    this.#url = new URL(url.href);
    this.#timeoutDuration = typeof options?.timeoutDuration === "number" ? options?.timeoutDuration : 5e3;
    this.#cooldownDuration = typeof options?.cooldownDuration === "number" ? options?.cooldownDuration : 3e4;
    this.#cacheMaxAge = typeof options?.cacheMaxAge === "number" ? options?.cacheMaxAge : 6e5;
    this.#headers = new Headers(options?.headers);
    if (USER_AGENT && !this.#headers.has("User-Agent")) {
      this.#headers.set("User-Agent", USER_AGENT);
    }
    if (!this.#headers.has("accept")) {
      this.#headers.set("accept", "application/json");
      this.#headers.append("accept", "application/jwk-set+json");
    }
    this.#customFetch = options?.[customFetch];
    if (options?.[jwksCache] !== void 0) {
      this.#cache = options?.[jwksCache];
      if (isFreshJwksCache(options?.[jwksCache], this.#cacheMaxAge)) {
        this.#jwksTimestamp = this.#cache.uat;
        this.#local = createLocalJWKSet(this.#cache.jwks);
      }
    }
  }
  pendingFetch() {
    return !!this.#pendingFetch;
  }
  coolingDown() {
    return typeof this.#jwksTimestamp === "number" ? Date.now() < this.#jwksTimestamp + this.#cooldownDuration : false;
  }
  fresh() {
    return typeof this.#jwksTimestamp === "number" ? Date.now() < this.#jwksTimestamp + this.#cacheMaxAge : false;
  }
  jwks() {
    return this.#local?.jwks();
  }
  async getKey(protectedHeader, token) {
    if (!this.#local || !this.fresh()) {
      await this.reload();
    }
    try {
      return await this.#local(protectedHeader, token);
    } catch (err) {
      if (err instanceof JWKSNoMatchingKey) {
        if (this.coolingDown() === false) {
          await this.reload();
          return this.#local(protectedHeader, token);
        }
      }
      throw err;
    }
  }
  async reload() {
    if (this.#pendingFetch && isCloudflareWorkers()) {
      this.#pendingFetch = void 0;
    }
    this.#pendingFetch ||= fetchJwks(this.#url.href, this.#headers, AbortSignal.timeout(this.#timeoutDuration), this.#customFetch).then((json2) => {
      this.#local = createLocalJWKSet(json2);
      if (this.#cache) {
        this.#cache.uat = Date.now();
        this.#cache.jwks = json2;
      }
      this.#jwksTimestamp = Date.now();
      this.#pendingFetch = void 0;
    }).catch((err) => {
      this.#pendingFetch = void 0;
      throw err;
    });
    await this.#pendingFetch;
  }
};
function createRemoteJWKSet(url, options) {
  const set = new RemoteJWKSet(url, options);
  const remoteJWKSet = /* @__PURE__ */ __name(async (protectedHeader, token) => set.getKey(protectedHeader, token), "remoteJWKSet");
  Object.defineProperties(remoteJWKSet, {
    coolingDown: {
      get: /* @__PURE__ */ __name(() => set.coolingDown(), "get"),
      enumerable: true,
      configurable: false
    },
    fresh: {
      get: /* @__PURE__ */ __name(() => set.fresh(), "get"),
      enumerable: true,
      configurable: false
    },
    reload: {
      value: /* @__PURE__ */ __name(() => set.reload(), "value"),
      enumerable: true,
      configurable: false,
      writable: false
    },
    reloading: {
      get: /* @__PURE__ */ __name(() => set.pendingFetch(), "get"),
      enumerable: true,
      configurable: false
    },
    jwks: {
      value: /* @__PURE__ */ __name(() => set.jwks(), "value"),
      enumerable: true,
      configurable: false,
      writable: false
    }
  });
  return remoteJWKSet;
}
__name(createRemoteJWKSet, "createRemoteJWKSet");

// api/_lib/id-token.ts
var googleJwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);
var ensureString = /* @__PURE__ */ __name((value) => typeof value === "string" && value.trim() ? value.trim() : null, "ensureString");
var isAuthoritativeGoogleEmail = /* @__PURE__ */ __name((email, hostedDomain) => email.endsWith("@gmail.com") || hostedDomain !== null, "isAuthoritativeGoogleEmail");
var verifyGoogleToken = /* @__PURE__ */ __name(async (idToken, env) => {
  if (!idToken || typeof idToken !== "string") {
    return fail(400, "invalid_token", "Token d'identit\xE0 mancante.");
  }
  try {
    if (!env.GOOGLE_CLIENT_ID) {
      return fail(500, "auth_misconfigured", "GOOGLE_CLIENT_ID non configurato.");
    }
    const { payload } = await jwtVerify(idToken, googleJwks, {
      audience: env.GOOGLE_CLIENT_ID,
      issuer: ["https://accounts.google.com", "accounts.google.com"]
    });
    const googleSubject = ensureString(payload.sub);
    const email = ensureString(payload.email);
    const emailVerified = payload.email_verified === true;
    const hostedDomain = ensureString(payload.hd);
    if (!googleSubject || !email || !emailVerified) {
      return fail(401, "invalid_token", "Il token Google non contiene dati verificati sufficienti.");
    }
    return {
      googleSubject,
      email: email.toLowerCase(),
      emailVerified,
      hostedDomain,
      isAuthoritativeEmail: isAuthoritativeGoogleEmail(email.toLowerCase(), hostedDomain)
    };
  } catch {
    return fail(401, "invalid_token", "Validazione del token d\u2019identit\xE0 non riuscita.");
  }
}, "verifyGoogleToken");

// api/auth/login/_google-login.ts
var accountStatusError = /* @__PURE__ */ __name((status) => {
  if (status === "invited") {
    return fail(403, "account_not_activated", "Completa l'attivazione dell'invito prima di accedere.");
  }
  if (status === "disabled") {
    return fail(403, "account_disabled", "L'account \xE8 disabilitato.");
  }
  return null;
}, "accountStatusError");
var loginWithGoogle = /* @__PURE__ */ __name(async (request, env) => {
  const bodyOrResponse = await readJson(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;
  const identityOrResponse = await verifyGoogleToken(bodyOrResponse.idToken, env);
  if (identityOrResponse instanceof Response) return identityOrResponse;
  const googleIdentity = identityOrResponse;
  const existingIdentityUser = await getUserByIdentity(env, "google", googleIdentity.googleSubject);
  if (existingIdentityUser) {
    const statusError2 = accountStatusError(existingIdentityUser.status);
    if (statusError2) return statusError2;
    await touchIdentityLogin(env, "google", googleIdentity.googleSubject, existingIdentityUser.id);
    const user2 = await getAuthUserById(env, existingIdentityUser.id);
    if (!user2) {
      return fail(500, "user_not_found", "Impossibile caricare l'account.");
    }
    const { cookieHeader: cookieHeader2 } = await issueSession(request, env, existingIdentityUser.id);
    return json({ user: user2 }, 200, { "set-cookie": cookieHeader2 });
  }
  if (!googleIdentity.email || !googleIdentity.emailVerified) {
    return fail(403, "account_not_provisioned", "Account non abilitato. Chiedi a un amministratore di inviarti un invito.");
  }
  if (!googleIdentity.isAuthoritativeEmail) {
    return fail(
      403,
      "google_email_not_authoritative",
      "Google pu\xF2 collegare automaticamente solo indirizzi Gmail o Google Workspace gestiti. Per questo indirizzo usa l\u2019accesso con email."
    );
  }
  const user = await findUserByEmail(env, googleIdentity.email);
  if (!user) {
    return fail(403, "account_not_provisioned", "Account non abilitato. Chiedi a un amministratore di inviarti un invito.");
  }
  const statusError = accountStatusError(user.status);
  if (statusError) return statusError;
  const linked = await attachIdentityToUser(
    env,
    user.id,
    "google",
    googleIdentity.googleSubject,
    googleIdentity.emailVerified
  );
  if (!linked) {
    const reloadedIdentityUser = await getUserByIdentity(env, "google", googleIdentity.googleSubject);
    if (!reloadedIdentityUser || reloadedIdentityUser.id !== user.id) {
      return fail(409, "identity_conflict", "Questa identit\xE0 \xE8 gi\xE0 collegata a un altro account.");
    }
  }
  await touchIdentityLogin(env, "google", googleIdentity.googleSubject, user.id);
  const authUser = await getAuthUserById(env, user.id);
  if (!authUser) {
    return fail(500, "user_not_found", "Impossibile caricare l'account.");
  }
  const { cookieHeader } = await issueSession(request, env, user.id);
  return json({ user: authUser }, 200, { "set-cookie": cookieHeader });
}, "loginWithGoogle");

// api/auth/login/google.ts
var onRequestPost5 = /* @__PURE__ */ __name(async ({ request, env }) => loginWithGoogle(request, env), "onRequestPost");

// api/auth/signup/email.ts
var onRequestPost6 = /* @__PURE__ */ __name(async ({ request, env }) => {
  const bodyOrResponse = await readJson(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;
  const inviteToken = (bodyOrResponse.inviteToken || "").trim();
  const email = normalizeEmail(bodyOrResponse.email || "");
  const password = bodyOrResponse.password || "";
  if (!inviteToken || !email || !password) {
    return fail(400, "invalid_payload", "Token d'invito, email e password sono obbligatori.");
  }
  const invitedUser = await findInvitedUserByToken(env, inviteToken);
  if (!invitedUser) {
    return fail(400, "invalid_invite", "L'invito non \xE8 valido, \xE8 scaduto oppure \xE8 gi\xE0 stato utilizzato.");
  }
  const activated = await activateInvitedUser(
    env,
    invitedUser,
    email,
    {
      provider: "email",
      providerSubject: email,
      emailVerified: true
    },
    password
  );
  if (activated instanceof Response) return activated;
  const user = await getAuthUserById(env, activated.userId);
  if (!user) {
    return fail(500, "user_not_found", "Impossibile caricare l'account.");
  }
  const { cookieHeader } = await issueSession(request, env, activated.userId);
  return json({ user }, 201, { "set-cookie": cookieHeader });
}, "onRequestPost");

// api/auth/signup/_google-signup.ts
var signupWithGoogle = /* @__PURE__ */ __name(async (request, env) => {
  const bodyOrResponse = await readJson(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;
  const inviteToken = (bodyOrResponse.inviteToken || "").trim();
  if (!inviteToken) {
    return fail(400, "invalid_invite", "Il token d'invito \xE8 obbligatorio.");
  }
  const invitedUser = await findInvitedUserByToken(env, inviteToken);
  if (!invitedUser) {
    return fail(400, "invalid_invite", "L'invito non \xE8 valido, \xE8 scaduto oppure \xE8 gi\xE0 stato utilizzato.");
  }
  const identityOrResponse = await verifyGoogleToken(bodyOrResponse.idToken, env);
  if (identityOrResponse instanceof Response) return identityOrResponse;
  const googleIdentity = identityOrResponse;
  if (!googleIdentity.email || !googleIdentity.emailVerified) {
    return fail(400, "invalid_token", "Il token Google deve includere un'email verificata per completare l'invito.");
  }
  if (!googleIdentity.isAuthoritativeEmail) {
    return fail(
      400,
      "google_email_not_authoritative",
      "La registrazione con Google \xE8 supportata solo per indirizzi Gmail o Google Workspace gestiti. Per questo indirizzo usa la registrazione con email."
    );
  }
  const activated = await activateInvitedUser(env, invitedUser, googleIdentity.email, {
    provider: "google",
    providerSubject: googleIdentity.googleSubject,
    emailVerified: googleIdentity.emailVerified
  });
  if (activated instanceof Response) return activated;
  const user = await getAuthUserById(env, activated.userId);
  if (!user) {
    return fail(500, "user_not_found", "Impossibile caricare l'account.");
  }
  const { cookieHeader } = await issueSession(request, env, activated.userId);
  return json({ user }, 201, { "set-cookie": cookieHeader });
}, "signupWithGoogle");

// api/auth/signup/google.ts
var onRequestPost7 = /* @__PURE__ */ __name(async ({ request, env }) => signupWithGoogle(request, env), "onRequestPost");

// api/admin/coaches/index.ts
var onRequestGet4 = /* @__PURE__ */ __name(async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;
  const coaches = await listCoaches(env);
  return json({ coaches });
}, "onRequestGet");

// api/admin/users/index.ts
var buildInviteUrl = /* @__PURE__ */ __name((request, env, inviteToken) => {
  const base = env.APP_BASE_URL?.trim() || new URL(request.url).origin;
  return `${base.replace(/\/$/, "")}/accept-invite?token=${encodeURIComponent(inviteToken)}`;
}, "buildInviteUrl");
var onRequestGet5 = /* @__PURE__ */ __name(async ({ request, env }) => {
  const auth = await requireManager(request, env);
  if (auth instanceof Response) return auth;
  const users = await listVisibleUsers(env, auth);
  return json({ users });
}, "onRequestGet");
var onRequestPost8 = /* @__PURE__ */ __name(async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;
  const bodyOrResponse = await readJson(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;
  const userType = bodyOrResponse.userType === "coach" ? "coach" : "client";
  const createResult = await createInvitedUser(env, {
    email: bodyOrResponse.email,
    fullName: bodyOrResponse.fullName,
    userType,
    coachUserId: userType === "client" ? bodyOrResponse.coachUserId ?? null : null,
    invitedByUserId: auth.user.id,
    expiresInHours: bodyOrResponse.expiresInHours ?? 72
  });
  if (createResult instanceof Response) return createResult;
  const detail = await getManagedUserDetail(env, auth, createResult.userId);
  if (detail instanceof Response) return detail;
  return json(
    {
      user: detail.user,
      inviteUrl: buildInviteUrl(request, env, createResult.inviteToken),
      expiresAt: detail.user.inviteExpiresAt
    },
    201
  );
}, "onRequestPost");

// api/auth/logout.ts
var onRequestPost9 = /* @__PURE__ */ __name(async ({ request, env }) => {
  await revokeSession(request, env);
  return json(
    { ok: true },
    200,
    {
      "set-cookie": clearSessionCookie(request, env)
    }
  );
}, "onRequestPost");

// api/auth/me.ts
var onRequestGet6 = /* @__PURE__ */ __name(async ({ request, env }) => {
  const auth = await getAuthSession(request, env);
  if (!auth) {
    return fail(401, "unauthorized", "Autenticazione richiesta.");
  }
  return json({ user: auth.user });
}, "onRequestGet");

// api/_lib/workout-plan.ts
var getWorkoutPlanForUser = /* @__PURE__ */ __name(async (env, userId) => getCurrentFlattenedWorkoutPlanForUser(env, userId), "getWorkoutPlanForUser");

// api/workout-plan/me.ts
var onRequestGet7 = /* @__PURE__ */ __name(async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  const plan = await getWorkoutPlanForUser(env, auth.user.id);
  return json({ plan });
}, "onRequestGet");

// ../.wrangler/tmp/pages-UjFQVr/functionsRoutes-0.42023099897677696.mjs
var routes = [
  {
    routePath: "/api/admin/users/:userId/workouts/:planId/activate",
    mountPath: "/api/admin/users/:userId/workouts/:planId",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/admin/users/:userId/workouts/:planId",
    mountPath: "/api/admin/users/:userId/workouts",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/admin/users/:userId/workouts/:planId",
    mountPath: "/api/admin/users/:userId/workouts",
    method: "PUT",
    middlewares: [],
    modules: [onRequestPut]
  },
  {
    routePath: "/api/admin/users/:userId/checkins",
    mountPath: "/api/admin/users/:userId",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/admin/users/:userId/coach",
    mountPath: "/api/admin/users/:userId",
    method: "PUT",
    middlewares: [],
    modules: [onRequestPut2]
  },
  {
    routePath: "/api/admin/users/:userId/detail",
    mountPath: "/api/admin/users/:userId",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/admin/users/:userId/workouts",
    mountPath: "/api/admin/users/:userId/workouts",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/admin/users/:userId/workouts",
    mountPath: "/api/admin/users/:userId/workouts",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/auth/login/email",
    mountPath: "/api/auth/login",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/auth/login/google",
    mountPath: "/api/auth/login",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/auth/signup/email",
    mountPath: "/api/auth/signup",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/api/auth/signup/google",
    mountPath: "/api/auth/signup",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost7]
  },
  {
    routePath: "/api/admin/coaches",
    mountPath: "/api/admin/coaches",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/admin/users",
    mountPath: "/api/admin/users",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/admin/users",
    mountPath: "/api/admin/users",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost8]
  },
  {
    routePath: "/api/auth/logout",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost9]
  },
  {
    routePath: "/api/auth/me",
    mountPath: "/api/auth",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/workout-plan/me",
    mountPath: "/api/workout-plan",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  }
];

// ../../../.npm/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode2 = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode2(value, key);
        });
      } else {
        params[key.name] = decode2(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode2 = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode2(token));
    } else {
      var prefix = escapeString(encode2(token.prefix));
      var suffix = escapeString(encode2(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-truHN0/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-truHN0/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
/*! Bundled license information:

@noble/hashes/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/
//# sourceMappingURL=functionsWorker-0.4426465691444894.mjs.map
