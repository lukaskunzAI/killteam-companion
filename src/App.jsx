import { useEffect, useState } from "react";
import LoginGate from "./components/LoginGate.jsx";
import CoreRulesView from "./components/CoreRulesView.jsx";
import TeamView from "./components/TeamView.jsx";
import GameTracker from "./components/GameTracker.jsx";
import { decryptCorpus } from "./lib/crypto.js";

export default function App() {
  const [corpus, setCorpus] = useState(null);
  const [view, setView] = useState({ kind: "rules" });
  const [bootChecking, setBootChecking] = useState(true);

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
        setCorpus(await decryptCorpus(payload, stored));
      } catch {
        sessionStorage.removeItem("kt_pw");
      } finally {
        setBootChecking(false);
      }
    })();
  }, []);

  if (bootChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-600 text-sm">
        Lade …
      </div>
    );
  }

  if (!corpus) return <LoginGate onUnlock={setCorpus} />;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b border-[#1a1a1a] bg-[#0c0c0c] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <span className="text-amber-400 font-bold text-[10px]">KT</span>
          </div>
          <span className="display text-base font-semibold text-neutral-100 tracking-wide">
            Kill Team <span className="text-amber-400">Companion</span>
          </span>
          <span className="text-[9px] uppercase tracking-[0.15em] text-neutral-500 ml-1 px-1.5 py-0.5 border border-[#1f1f1f] rounded">
            v3
          </span>
        </div>

        <nav className="flex items-center gap-1">
          <NavButton
            active={view.kind === "rules"}
            onClick={() => setView({ kind: "rules" })}
          >
            Core Rules
          </NavButton>
          <TeamMenu
            teams={corpus.teams}
            current={view.kind === "team" ? view.teamId : null}
            onPick={(teamId) => setView({ kind: "team", teamId })}
          />
          <NavButton
            active={view.kind === "tracker"}
            onClick={() => setView({ kind: "tracker" })}
          >
            Tracker
          </NavButton>
          <button
            onClick={() => {
              sessionStorage.removeItem("kt_pw");
              setCorpus(null);
            }}
            className="ml-2 px-2 py-1.5 text-neutral-600 hover:text-red-400 text-[12px]"
          >
            Sperren
          </button>
        </nav>
      </header>

      <div className="flex-1 overflow-hidden">
        {view.kind === "rules" && <CoreRulesView sections={corpus.coreRules} />}
        {view.kind === "team" && (
          <TeamView
            team={corpus.teams.find((t) => t.id === view.teamId) || corpus.teams[0]}
          />
        )}
        {view.kind === "tracker" && <GameTracker />}
      </div>
    </div>
  );
}

function NavButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
        active
          ? "bg-amber-500 text-black"
          : "text-neutral-400 hover:text-neutral-100 hover:bg-[#161616]"
      }`}
    >
      {children}
    </button>
  );
}

function TeamMenu({ teams, current, onPick }) {
  const [open, setOpen] = useState(false);
  if (!teams || teams.length === 0) return null;

  if (teams.length === 1) {
    const t = teams[0];
    return (
      <NavButton active={current === t.id} onClick={() => onPick(t.id)}>
        {t.team}
      </NavButton>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
          current
            ? "bg-amber-500 text-black"
            : "text-neutral-400 hover:text-neutral-100 hover:bg-[#161616]"
        }`}
      >
        Teams ▾
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 bg-[#101010] border border-[#1f1f1f] rounded-md py-1 min-w-[180px] z-20"
          onMouseLeave={() => setOpen(false)}
        >
          {teams.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                onPick(t.id);
                setOpen(false);
              }}
              className={`block w-full text-left px-3 py-1.5 text-[13px] hover:bg-[#161616] ${
                current === t.id ? "text-amber-400" : "text-neutral-300"
              }`}
            >
              {t.team}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
