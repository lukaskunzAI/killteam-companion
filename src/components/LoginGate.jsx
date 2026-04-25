import { useState } from "react";
import { motion } from "framer-motion";
import { decryptCorpus } from "../lib/crypto.js";

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
      const corpus = await decryptCorpus(payload, password);
      sessionStorage.setItem("kt_pw", password);
      onUnlock(corpus);
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
        className="w-full max-w-sm bg-[#111] border border-[#222] rounded-xl p-8"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-3">
            <span className="text-amber-400 font-bold text-xs">KT</span>
          </div>
          <h1
            className="text-xl font-semibold tracking-wide text-neutral-100"
            style={{ fontFamily: "Rajdhani, sans-serif" }}
          >
            Kill Team Companion
          </h1>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            V3 Rules &middot; Tracker
          </p>
        </div>

        <input
          autoFocus
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-3 py-2.5 text-neutral-100 focus:outline-none focus:border-amber-500/60"
          placeholder="Passwort"
        />
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="mt-4 w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-medium py-2.5 rounded-md transition-colors"
        >
          {busy ? "Entschlüssele …" : "Entsperren"}
        </button>
        <p className="mt-4 text-[10px] text-neutral-600 text-center">
          AES-GCM clientseitig
        </p>
      </motion.form>
    </div>
  );
}
