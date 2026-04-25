import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "kt_tracker_v1";

const blankPlayer = (name) => ({
  name,
  cp: 2,
  vp: 0,
  tac: 0,
  initiative: false,
  operatives: [],
});

const blankState = () => ({
  turningPoint: 1,
  players: [blankPlayer("Du"), blankPlayer("Gegner")],
  critOps: [
    { id: 1, label: "Obj. 1", controlledBy: null },
    { id: 2, label: "Obj. 2", controlledBy: null },
    { id: 3, label: "Obj. 3", controlledBy: null },
    { id: 4, label: "Obj. 4", controlledBy: null },
  ],
  notes: "",
});

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankState();
    return { ...blankState(), ...JSON.parse(raw) };
  } catch {
    return blankState();
  }
}

export default function GameTracker() {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updatePlayer = (idx, patch) => {
    setState((s) => ({
      ...s,
      players: s.players.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
    }));
  };

  const setInitiative = (idx) => {
    setState((s) => ({
      ...s,
      players: s.players.map((p, i) => ({ ...p, initiative: i === idx })),
    }));
  };

  const newGame = () => {
    if (confirm("Neues Spiel? Aktueller Stand wird zurückgesetzt.")) {
      setState(blankState());
    }
  };

  const nextTurn = () => {
    setState((s) => ({
      ...s,
      turningPoint: Math.min(4, s.turningPoint + 1),
      players: s.players.map((p) => ({
        ...p,
        operatives: p.operatives.map((o) => ({ ...o, activated: false })),
      })),
    }));
  };

  const prevTurn = () => {
    setState((s) => ({ ...s, turningPoint: Math.max(1, s.turningPoint - 1) }));
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">
      {/* Turn header */}
      <div className="bg-[#141414] border border-[#222] rounded-lg p-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-neutral-500">
              Turning Point
            </div>
            <div
              className="text-4xl font-bold text-amber-500 tabular-nums"
              style={{ fontFamily: "Rajdhani, sans-serif" }}
            >
              {state.turningPoint} <span className="text-neutral-600">/ 4</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 ml-4">
            <button
              onClick={nextTurn}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-black text-sm font-semibold rounded"
            >
              Nächster TP →
            </button>
            <button
              onClick={prevTurn}
              className="px-3 py-1 bg-[#222] hover:bg-[#2a2a2a] text-neutral-300 text-sm rounded"
            >
              ← Zurück
            </button>
          </div>
        </div>
        <button
          onClick={newGame}
          className="px-4 py-2 border border-[#333] hover:border-red-700 hover:text-red-400 text-neutral-400 text-sm rounded transition-colors"
        >
          Neues Spiel
        </button>
      </div>

      {/* Players */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.players.map((p, idx) => (
          <PlayerCard
            key={idx}
            player={p}
            onChange={(patch) => updatePlayer(idx, patch)}
            onSetInitiative={() => setInitiative(idx)}
          />
        ))}
      </div>

      {/* Crit Ops / Objectives */}
      <div className="bg-[#141414] border border-[#222] rounded-lg p-5">
        <h2
          className="text-lg font-bold tracking-wide text-amber-500 mb-3"
          style={{ fontFamily: "Rajdhani, sans-serif" }}
        >
          Objectives
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {state.critOps.map((obj) => (
            <ObjectiveCard
              key={obj.id}
              obj={obj}
              players={state.players}
              onChange={(patch) =>
                setState((s) => ({
                  ...s,
                  critOps: s.critOps.map((o) =>
                    o.id === obj.id ? { ...o, ...patch } : o,
                  ),
                }))
              }
            />
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-[#141414] border border-[#222] rounded-lg p-5">
        <h2
          className="text-lg font-bold tracking-wide text-amber-500 mb-3"
          style={{ fontFamily: "Rajdhani, sans-serif" }}
        >
          Notizen
        </h2>
        <textarea
          value={state.notes}
          onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
          rows={4}
          placeholder="z.B. aktive Ploys, Gambits, Reminders…"
          className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-amber-600/60"
        />
      </div>
    </div>
  );
}

function PlayerCard({ player, onChange, onSetInitiative }) {
  const [newOp, setNewOp] = useState("");

  const addOp = () => {
    const name = newOp.trim();
    if (!name) return;
    onChange({
      operatives: [
        ...player.operatives,
        { id: crypto.randomUUID(), name, hp: 10, max: 10, activated: false },
      ],
    });
    setNewOp("");
  };

  const updateOp = (id, patch) => {
    onChange({
      operatives: player.operatives.map((o) =>
        o.id === id ? { ...o, ...patch } : o,
      ),
    });
  };

  const removeOp = (id) => {
    onChange({ operatives: player.operatives.filter((o) => o.id !== id) });
  };

  return (
    <motion.div
      layout
      className={`bg-[#141414] border rounded-lg p-5 transition-colors ${
        player.initiative
          ? "border-amber-600/60"
          : "border-[#222]"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <input
          value={player.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="bg-transparent text-xl font-bold tracking-wide focus:outline-none focus:bg-[#0a0a0a] rounded px-1"
          style={{ fontFamily: "Rajdhani, sans-serif" }}
        />
        <button
          onClick={onSetInitiative}
          className={`text-[11px] uppercase tracking-wider px-2 py-1 rounded border transition-colors ${
            player.initiative
              ? "bg-amber-600 text-black border-amber-600"
              : "border-[#333] text-neutral-400 hover:border-amber-600/60"
          }`}
        >
          Initiative
        </button>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Counter
          label="CP"
          value={player.cp}
          onChange={(v) => onChange({ cp: Math.max(0, v) })}
        />
        <Counter
          label="VP"
          value={player.vp}
          onChange={(v) => onChange({ vp: Math.max(0, v) })}
        />
        <Counter
          label="TacOps"
          value={player.tac}
          onChange={(v) => onChange({ tac: Math.max(0, v) })}
        />
      </div>

      {/* Operatives */}
      <div>
        <div className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2">
          Operatives
        </div>
        <div className="space-y-1.5">
          <AnimatePresence>
            {player.operatives.map((o) => (
              <motion.div
                key={o.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm ${
                  o.hp <= 0
                    ? "bg-red-950/30 text-neutral-500 line-through"
                    : o.activated
                    ? "bg-[#1a1a1a] text-neutral-500"
                    : "bg-[#0a0a0a]"
                }`}
              >
                <button
                  onClick={() => updateOp(o.id, { activated: !o.activated })}
                  title="Activated toggle"
                  className={`w-4 h-4 rounded-sm border ${
                    o.activated
                      ? "bg-amber-600 border-amber-600"
                      : "border-[#333]"
                  }`}
                />
                <input
                  value={o.name}
                  onChange={(e) => updateOp(o.id, { name: e.target.value })}
                  className="flex-1 bg-transparent focus:outline-none focus:bg-[#0a0a0a]"
                />
                <button
                  onClick={() => updateOp(o.id, { hp: Math.max(0, o.hp - 1) })}
                  className="w-6 h-6 rounded bg-[#1a1a1a] hover:bg-red-900 text-neutral-400"
                >
                  −
                </button>
                <span className="tabular-nums w-12 text-center text-neutral-300">
                  {o.hp}/{o.max}
                </span>
                <button
                  onClick={() =>
                    updateOp(o.id, { hp: Math.min(o.max, o.hp + 1) })
                  }
                  className="w-6 h-6 rounded bg-[#1a1a1a] hover:bg-emerald-900 text-neutral-400"
                >
                  +
                </button>
                <button
                  onClick={() => removeOp(o.id)}
                  className="w-6 h-6 rounded text-neutral-500 hover:text-red-400"
                  title="Entfernen"
                >
                  ×
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex gap-2 mt-3">
          <input
            value={newOp}
            onChange={(e) => setNewOp(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addOp()}
            placeholder="Operative-Name + Enter"
            className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-amber-600/60"
          />
          <button
            onClick={addOp}
            className="px-3 bg-[#222] hover:bg-amber-600 hover:text-black text-neutral-300 text-sm rounded transition-colors"
          >
            +
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Counter({ label, value, onChange }) {
  return (
    <div className="bg-[#0a0a0a] border border-[#222] rounded-md p-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-neutral-500">
        {label}
      </div>
      <div className="flex items-center justify-center gap-2 mt-0.5">
        <button
          onClick={() => onChange(value - 1)}
          className="w-7 h-7 rounded bg-[#1a1a1a] hover:bg-red-900 text-neutral-400"
        >
          −
        </button>
        <span
          className="text-2xl font-bold tabular-nums w-8"
          style={{ fontFamily: "Rajdhani, sans-serif" }}
        >
          {value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-7 h-7 rounded bg-[#1a1a1a] hover:bg-emerald-900 text-neutral-400"
        >
          +
        </button>
      </div>
    </div>
  );
}

function ObjectiveCard({ obj, players, onChange }) {
  const cycle = () => {
    const order = [null, 0, 1];
    const cur = order.indexOf(obj.controlledBy);
    const next = order[(cur + 1) % order.length];
    onChange({ controlledBy: next });
  };
  const tone =
    obj.controlledBy === 0
      ? "border-amber-600/60 bg-amber-600/10"
      : obj.controlledBy === 1
      ? "border-sky-500/60 bg-sky-500/10"
      : "border-[#2a2a2a] bg-[#0a0a0a]";
  return (
    <button
      onClick={cycle}
      className={`text-center p-3 rounded-lg border transition-colors ${tone}`}
    >
      <div
        className="text-base font-bold tracking-wide"
        style={{ fontFamily: "Rajdhani, sans-serif" }}
      >
        {obj.label}
      </div>
      <div className="text-xs text-neutral-400 mt-1 truncate">
        {obj.controlledBy === null
          ? "neutral"
          : players[obj.controlledBy]?.name || ""}
      </div>
    </button>
  );
}
