import { useState } from "react";
import { motion } from "framer-motion";
import { decryptPayload } from "../lib/crypto.js";

export default function LoginGate({ onUnlock }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(import.meta.env.BASE_URL + "rules.enc.json");
      if (!res.ok) throw new Error("Failed to load encrypted rules.");
      const payload = await res.json();
      const plaintext = await decryptPayload(payload, password);
      const sections = JSON.parse(plaintext);
      sessionStorage.setItem("kt_pw", password);
      onUnlock(sections);
    } catch (err) {
      console.error(err);
      setError("Falsches Passwort.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-[#141414] border border-[#2a2a2a] rounded-xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-amber-600/20 border border-amber-600/40 flex items-center justify-center mb-3">
            <span className="text-amber-500 font-bold">KT</span>
          </div>
          <h1
            className="text-2xl font-bold tracking-wide"
            style={{ fontFamily: "Rajdhani, sans-serif" }}
          >
            Kill Team Companion
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            V3 Rules &middot; Game Tracker
          </p>
        </div>

        <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-2">
          Passwort
        </label>
        <input
          autoFocus
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-md px-3 py-2.5 text-neutral-100 focus:outline-none focus:border-amber-600/60 focus:ring-1 focus:ring-amber-600/40"
          placeholder="••••••••"
        />
        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}
        <button
          type="submit"
          disabled={busy || !password}
          className="mt-5 w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-2.5 rounded-md transition-colors"
        >
          {busy ? "Entschlüssele …" : "Entsperren"}
        </button>
        <p className="mt-4 text-[11px] text-neutral-500 text-center">
          Inhalte sind clientseitig AES-GCM-verschlüsselt.
        </p>
      </motion.form>
    </div>
  );
}
