const { promisify } = require("node:util");
const { randomBytes, scrypt: scryptCallback, timingSafeEqual } = require("node:crypto");

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const PREFIX = "scrypt";

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, KEY_LENGTH);
  return `${PREFIX}$${salt}$${derivedKey.toString("hex")}`;
}

function safeStringEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

async function verifyPassword(password, storedPassword) {
  if (typeof storedPassword !== "string" || !storedPassword) {
    return { valid: false, needsUpgrade: false };
  }

  if (!storedPassword.startsWith(`${PREFIX}$`)) {
    const valid = safeStringEqual(password, storedPassword);
    return {
      valid,
      needsUpgrade: valid,
    };
  }

  const [prefix, salt, storedKeyHex] = storedPassword.split("$");
  if (prefix !== PREFIX || !salt || !storedKeyHex) {
    return { valid: false, needsUpgrade: false };
  }

  try {
    const storedKey = Buffer.from(storedKeyHex, "hex");
    const derivedKey = await scrypt(password, salt, storedKey.length);
    return {
      valid: storedKey.length > 0 && timingSafeEqual(storedKey, derivedKey),
      needsUpgrade: false,
    };
  } catch (_error) {
    return { valid: false, needsUpgrade: false };
  }
}

module.exports = { hashPassword, safeStringEqual, verifyPassword };
