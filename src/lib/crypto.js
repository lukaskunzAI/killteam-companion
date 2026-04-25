// Decrypts the bundled rules.enc.json using AES-GCM with a PBKDF2-derived key.
const fromB64 = (b64) =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export async function deriveKey(password, saltB64, kdfParams) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: fromB64(saltB64),
      iterations: kdfParams.iterations,
      hash: kdfParams.hash,
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}

export async function decryptPayload(payload, password) {
  const key = await deriveKey(password, payload.salt, payload.kdf);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(payload.iv) },
    key,
    fromB64(payload.ct),
  );
  return new TextDecoder().decode(plaintext);
}
