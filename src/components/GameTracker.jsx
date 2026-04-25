import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "kt_tracker_v2";

const blankPlayer = (name) => ({
  name,
  cp: 2,
  vp: 0,
  initiative: false,
  tacOps: ["", "", ""],
  ploysActive: "",
  equipment: "",
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
  primaryScores: [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  notes: "",
});

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankState();
    const parsed = JSON.parse(raw);
    return { ...blankState(), ...parsed };
  } catch {
    return blankState();
  }
}

export default function GameTracker() {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updatePlayer = (idx, patch) =>
    setState((s) => ({
      ...s,
      players: s.players.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
    }));

  const setInitiative = (idx) =>
    setState((s) => ({
      ...s,
      players: s.players.map((p, i) => ({ ...p, initiative: i === idx })),
    }));

  const newGame = () => {
    if (confirm("Neues Spiel? Aktueller Stand wird zurückgesetzt.")) {
      setState(blankState());
    }
  };

  const nextTurn = () =>
    setState((s) => ({
      ...s,
      turningPoint: Math.min(4, s.turningPoint + 1),
      players: s.players.map((p) => ({
        ...p,
        operatives: p.operatives.map((o) => ({
          ...o,
          ready: true,
          activated: false,
        })),
      })),
    }));

  const prevTurn = () =>
    setState((s) => ({ ...s, turningPoint: Math.max(1, s.turningPoint - 1) }));

  const totalVP = (i) =>
    state.players[i].vp + state.primaryScores[i].reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-5">
      {/* Top bar */}
      <div className="bg-[#101010] border border-[#1f1f1f] rounded-lg p-4 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Turning Point
            </div>
            <div className="display text-3xl font-semibold text-amber-400 tabular-nums leading-none mt-1">
              {state.turningPoint}
              <span className="text-neutral-700 text-xl"> / 4</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={nextTurn}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[13px] font-medium rounded"
            >
              Nächster TP →
            </button>
            <button
              onClick={prevTurn}
              className="px-3 py-1 bg-[#1c1c1c] hover:bg-[#222] text-neutral-300 text-[13px] rounded"
            >
              ← Zurück
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ScoreDisplay
            label={state.players[0].name}
            value={totalVP(0)}
            highlight={state.players[0].initiative}
          />
          <span className="text-neutral-700">vs</span>
          <ScoreDisplay
            label={state.players[1].name}
            value={totalVP(1)}
            highlight={state.players[1].initiative}
          />
        </div>
        <button
          onClick={newGame}
          className="px-3 py-1.5 border border-[#1f1f1f] hover:border-red-700 hover:text-red-400 text-neutral-500 text-[12px] rounded"
        >
          Neues Spiel
        </button>
      </div>

      {/* Per-player panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.players.map((p, idx) => (
          <PlayerPanel
            key={idx}
            player={p}
            playerIndex={idx}
            scores={state.primaryScores[idx]}
            onScore={(tp, val) =>
              setState((s) => ({
                ...s,
                primaryScores: s.primaryScores.map((arr, i) =>
                  i !== idx ? arr : arr.map((v, t) => (t === tp ? val : v)),
                ),
              }))
            }
            onChange={(patch) => updatePlayer(idx, patch)}
            onSetInitiative={() => setInitiative(idx)}
          />
        ))}
      </div>

      {/* Objectives */}
      <div className="bg-[#101010] border border-[#1f1f1f] rounded-lg p-4">
        <h2 className="display text-[11px] uppercase tracking-[0.2em] text-amber-500/80 mb-3">
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
      <div className="bg-[#101010] border border-[#1f1f1f] rounded-lg p-4">
        <h2 className="display text-[11px] uppercase tracking-[0.2em] text-amber-500/80 mb-3">
          Notizen
        </h2>
        <textarea
          value={state.notes}
          onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
          rows={4}
          placeholder="Aktivierungs-Reihenfolge, Reminders, Ploys diese Runde …"
          className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-amber-500/60"
        />
      </div>
    </div>
  );
}

function ScoreDisplay({ label, value, highlight }) {
  return (
    <div
      className={`px-3 py-1.5 rounded border ${
        highlight ? "border-amber-500/60 bg-amber-500/10" : "border-[#1f1f1f]"
      }`}
    >
      <div className="text-[9px] uppercase tracking-[0.15em] text-neutral-500">
        {label}
      </div>
      <div className="display text-xl font-semibold tabular-nums text-neutral-100 leading-none">
        {value}
      </div>
    </div>
  );
}

function PlayerPanel({
  player,
  playerIndex,
  scores,
  onScore,
  onChange,
  onSetInitiative,
}) {
  const [newOp, setNewOp] = useState("");

  const addOp = () => {
    const name = newOp.trim();
    if (!name) return;
    onChange({
      operatives: [
        ...player.operatives,
        {
          id: crypto.randomUUID(),
          name,
          hp: 10,
          max: 10,
          order: "engage",
          ready: true,
          activated: false,
          notes: "",
        },
      ],
    });
    setNewOp("");
  };

  const updateOp = (id, patch) =>
    onChange({
      operatives: player.operatives.map((o) =>
        o.id === id ? { ...o, ...patch } : o,
      ),
    });

  const removeOp = (id) =>
    onChange({ operatives: player.operatives.filter((o) => o.id !== id) });

  return (
    <motion.div
      layout
      className={`bg-[#101010] border rounded-lg overflow-hidden ${
        player.initiative ? "border-amber-500/50" : "border-[#1f1f1f]"
      }`}
    >
      <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-3">
        <input
          value={player.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="display bg-transparent text-lg font-semibold tracking-wide focus:outline-none focus:bg-[#0a0a0a] rounded px-1 -mx-1 text-neutral-100 flex-1"
        />
        <button
          onClick={onSetInitiative}
          className={`text-[10px] uppercase tracking-[0.15em] px-2 py-1 rounded border transition-colors ${
            player.initiative
              ? "bg-amber-500 text-black border-amber-500"
              : "border-[#1f1f1f] text-neutral-500 hover:border-amber-500/50"
          }`}
        >
          Initiative
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 mb-3">
        <Counter
          label="CP"
          value={player.cp}
          onChange={(v) => onChange({ cp: Math.max(0, v) })}
        />
        <Counter
          label="VP"
          hint="Tac Ops + extra"
          value={player.vp}
          onChange={(v) => onChange({ vp: Math.max(0, v) })}
        />
      </div>

      {/* Primary score per turn */}
      <div className="px-4 mb-3">
        <div className="text-[9px] uppercase tracking-[0.15em] text-neutral-500 mb-1.5">
          Primary VP per TP
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[0, 1, 2, 3].map((tp) => (
            <PrimaryCell
              key={tp}
              tp={tp}
              value={scores[tp]}
              onChange={(v) => onScore(tp, v)}
            />
          ))}
        </div>
      </div>

      {/* Tac Ops */}
      <div className="px-4 mb-3">
        <div className="text-[9px] uppercase tracking-[0.15em] text-neutral-500 mb-1.5">
          Tac Ops (3)
        </div>
        <div className="space-y-1">
          {player.tacOps.map((slot, i) => (
            <input
              key={i}
              value={slot}
              onChange={(e) => {
                const next = [...player.tacOps];
                next[i] = e.target.value;
                onChange({ tacOps: next });
              }}
              placeholder={`Tac Op ${i + 1}`}
              className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-md px-2 py-1 text-[12.5px] placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/60"
            />
          ))}
        </div>
      </div>

      {/* Operatives */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[9px] uppercase tracking-[0.15em] text-neutral-500">
            Operatives
          </div>
          <div className="text-[10px] text-neutral-600">
            {player.operatives.filter((o) => o.activated).length}/
            {player.operatives.length} activated
          </div>
        </div>
        <div className="space-y-1">
          <AnimatePresence>
            {player.operatives.map((o) => (
              <motion.div
                key={o.id}
                layout
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[12.5px] ${
                  o.hp <= 0
                    ? "bg-red-950/30 text-neutral-600 line-through"
                    : !o.ready || o.activated
                    ? "bg-[#161616] text-neutral-500"
                    : "bg-[#0a0a0a] text-neutral-300"
                }`}
              >
                <button
                  onClick={() =>
                    updateOp(o.id, {
                      order: o.order === "conceal" ? "engage" : "conceal",
                    })
                  }
                  title="Conceal/Engage"
                  className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${
                    o.order === "conceal"
                      ? "bg-sky-500/20 text-sky-300"
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {o.order === "conceal" ? "C" : "E"}
                </button>
                <button
                  onClick={() => updateOp(o.id, { activated: !o.activated })}
                  title="Activated"
                  className={`w-4 h-4 rounded-sm border ${
                    o.activated
                      ? "bg-amber-500 border-amber-500"
                      : "border-[#2a2a2a]"
                  }`}
                />
                <input
                  value={o.name}
                  onChange={(e) => updateOp(o.id, { name: e.target.value })}
                  className="flex-1 bg-transparent focus:outline-none focus:bg-[#0a0a0a] rounded px-1"
                />
                <button
                  onClick={() => updateOp(o.id, { hp: Math.max(0, o.hp - 1) })}
                  className="w-5 h-5 rounded bg-[#161616] hover:bg-red-950 text-neutral-500"
                >
                  −
                </button>
                <span className="tabular-nums w-10 text-center text-neutral-300 text-[12px]">
                  {o.hp}/{o.max}
                </span>
                <button
                  onClick={() =>
                    updateOp(o.id, { hp: Math.min(o.max, o.hp + 1) })
                  }
                  className="w-5 h-5 rounded bg-[#161616] hover:bg-emerald-950 text-neutral-500"
                >
                  +
                </button>
                <button
                  onClick={() => removeOp(o.id)}
                  className="w-5 h-5 text-neutral-600 hover:text-red-400"
                  title="Entfernen"
                >
                  ×
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex gap-1 mt-2">
          <input
            value={newOp}
            onChange={(e) => setNewOp(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addOp()}
            placeholder="Operative + Enter"
            className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-md px-2 py-1 text-[12.5px] placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/60"
          />
          <button
            onClick={addOp}
            className="px-2.5 bg-[#1c1c1c] hover:bg-amber-500 hover:text-black text-neutral-400 text-sm rounded transition-colors"
          >
            +
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Counter({ label, hint, value, onChange }) {
  return (
    <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-md p-2">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] uppercase tracking-[0.15em] text-neutral-500">
          {label}
        </span>
        {hint && <span className="text-[9px] text-neutral-700">{hint}</span>}
      </div>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => onChange(value - 1)}
          className="w-6 h-6 rounded bg-[#161616] hover:bg-red-950 text-neutral-400"
        >
          −
        </button>
        <span className="display text-xl font-semibold tabular-nums w-7 text-center text-neutral-100">
          {value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-6 h-6 rounded bg-[#161616] hover:bg-emerald-950 text-neutral-400"
        >
          +
        </button>
      </div>
    </div>
  );
}

function PrimaryCell({ tp, value, onChange }) {
  const max = 4;
  return (
    <div
      className="bg-[#0a0a0a] border border-[#1f1f1f] rounded p-1.5 cursor-pointer select-none"
      onClick={() => onChange((value + 1) % (max + 1))}
      onContextMenu={(e) => {
        e.preventDefault();
        onChange(Math.max(0, value - 1));
      }}
      title="Klick: +1, Rechtsklick: −1"
    >
      <div className="text-[9px] uppercase tracking-[0.15em] text-neutral-600 text-center">
        TP {tp + 1}
      </div>
      <div className="display text-base font-semibold tabular-nums text-center text-neutral-200">
        {value}
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
      ? "border-amber-500/50 bg-amber-500/10"
      : obj.controlledBy === 1
      ? "border-sky-500/50 bg-sky-500/10"
      : "border-[#1f1f1f] bg-[#0a0a0a]";
  return (
    <button
      onClick={cycle}
      className={`text-center p-3 rounded-lg border transition-colors ${tone}`}
    >
      <div className="display text-sm font-semibold tracking-wide">
        {obj.label}
      </div>
      <div className="text-[11px] text-neutral-400 mt-0.5 truncate">
        {obj.controlledBy === null
          ? "neutral"
          : players[obj.controlledBy]?.name || ""}
      </div>
    </button>
  );
}
