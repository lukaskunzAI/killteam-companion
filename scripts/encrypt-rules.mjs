// Encrypts rules-source.json with AES-GCM using a key derived (PBKDF2) from
// a shared password. Output is dropped into public/rules.enc.json so it
// ships with the static bundle. The plaintext source is .gitignored.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { webcrypto as crypto } from "node:crypto";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SOURCE = join(ROOT, "rules-source.json");
const OUT_DIR = join(ROOT, "public");
const OUT = join(OUT_DIR, "rules.enc.json");

const password =
  process.env.KT_APP_PASSWORD ||
  process.env.VITE_KT_APP_PASSWORD ||
  "killteam-2026"; // dev default; override via env for real deploys

if (!existsSync(SOURCE)) {
  console.error(`Missing ${SOURCE}. Drop the extracted rules JSON there.`);
  process.exit(1);
}

const plaintext = readFileSync(SOURCE, "utf8");

const enc = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));

const baseKey = await crypto.subtle.importKey(
  "raw",
  enc.encode(password),
  { name: "PBKDF2" },
  false,
  ["deriveKey"],
);

const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: 200_000, hash: "SHA-256" },
  baseKey,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt"],
);

const ciphertext = new Uint8Array(
  await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext),
  ),
);

const toB64 = (bytes) => Buffer.from(bytes).toString("base64");

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

writeFileSync(
  OUT,
  JSON.stringify(
    {
      v: 1,
      kdf: { name: "PBKDF2", hash: "SHA-256", iterations: 200_000 },
      cipher: { name: "AES-GCM", length: 256 },
      salt: toB64(salt),
      iv: toB64(iv),
      ct: toB64(ciphertext),
    },
    null,
    2,
  ),
);

console.log(
  `[encrypt-rules] wrote ${OUT} (${ciphertext.byteLength} bytes ciphertext)`,
);
console.log(
  `[encrypt-rules] password: ${password === "killteam-2026" ? "(default)" : "(from env)"}`,
);
