import { useEffect, useState } from "react";
import LoginGate from "./components/LoginGate.jsx";
import RulesBrowser from "./components/RulesBrowser.jsx";
import GameTracker from "./components/GameTracker.jsx";
import { decryptPayload } from "./lib/crypto.js";

const TABS = [
  { id: "rules", label: "Regeln" },
  { id: "tracker", label: "Tracker" },
];

export default function App() {
  const [sections, setSections] = useState(null);
  const [tab, setTab] = useState("rules");
  const [bootChecking, setBootChecking] = useState(true);

  // Try to auto-unlock if we already have a password in sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("kt_pw");
    if (!stored) {
      setBootChecking(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(import.meta.env.BASE_URL + "rules.enc.json");
        const payload = await res.json();
        const plaintext = await decryptPayload(payload, stored);
        setSections(JSON.parse(plaintext));
      } catch {
        sessionStorage.removeItem("kt_pw");
      } finally {
        setBootChecking(false);
      }
    })();
  }, []);

  if (bootChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-500 text-sm">
        Lade …
      </div>
    );
  }

  if (!sections) {
    return <LoginGate onUnlock={setSections} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b border-[#1f1f1f] bg-[#0d0d0d] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-amber-600/20 border border-amber-600/40 flex items-center justify-center">
            <span className="text-amber-500 font-bold text-xs">KT</span>
          </div>
          <span
            className="text-lg font-bold tracking-wide"
            style={{ fontFamily: "Rajdhani, sans-serif" }}
          >
            Kill Team <span className="text-amber-500">Companion</span>
          </span>
          <span className="text-[10px] uppercase tracking-wider text-neutral-500 ml-1 px-1.5 py-0.5 border border-[#2a2a2a] rounded">
            v3
          </span>
        </div>
        <nav className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-amber-600 text-black"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-[#1a1a1a]"
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={() => {
              sessionStorage.removeItem("kt_pw");
              setSections(null);
            }}
            title="Sperren"
            className="ml-2 px-2 py-1.5 text-neutral-500 hover:text-red-400 text-sm"
          >
            Sperren
          </button>
        </nav>
      </header>
      <div className="flex-1 overflow-hidden">
        {tab === "rules" ? (
          <RulesBrowser sections={sections} />
        ) : (
          <GameTracker />
        )}
      </div>
    </div>
  );
}
