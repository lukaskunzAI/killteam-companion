import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import RuleBody from "./RuleBody.jsx";
import { buildNav } from "../lib/rules.js";

const ACTION_ICONS = {
  Reposition: "→",
  Dash: "»",
  "Fall Back": "↩",
  Charge: "⚔",
  Shoot: "✦",
  Fight: "✕",
  "Pick Up Marker": "◉",
  "Place Marker": "◎",
};

function actionIcon(title) {
  for (const k of Object.keys(ACTION_ICONS)) {
    if (title.startsWith(k)) return ACTION_ICONS[k];
  }
  return null;
}

export default function RulesBrowser({ sections }) {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(null);

  const groups = useMemo(() => buildNav(sections), [sections]);

  const filtered = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return sections
      .filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.body.toLowerCase().includes(q),
      )
      .map((s) => ({ ...s, matchInTitle: s.title.toLowerCase().includes(q) }));
  }, [query, sections]);

  useEffect(() => {
    if (!activeId) return;
    const el = document.getElementById(`rule-${activeId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] h-[calc(100vh-56px)]">
      <aside className="border-r border-[#1f1f1f] bg-[#0d0d0d] overflow-y-auto p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suche Regeln…"
          className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-amber-600/60"
        />

        {filtered ? (
          <div className="mt-3 space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-neutral-500 px-1 mb-1">
              {filtered.length} Treffer
            </div>
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setQuery("");
                  setActiveId(s.id);
                }}
                className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-[#1a1a1a] text-neutral-300"
              >
                {s.title}
              </button>
            ))}
          </div>
        ) : (
          <nav className="mt-3 space-y-4">
            {groups.map((g) => (
              <NavGroup
                key={g.id}
                group={g}
                activeId={activeId}
                onJump={setActiveId}
              />
            ))}
          </nav>
        )}
      </aside>

      <main className="overflow-y-auto px-6 md:px-10 py-8">
        <div className="max-w-3xl mx-auto space-y-10">
          {groups.map((g) => (
            <GroupSection key={g.id} group={g} />
          ))}
        </div>
      </main>
    </div>
  );
}

function NavGroup({ group, activeId, onJump }) {
  return (
    <div>
      <div
        className="text-[11px] uppercase tracking-wider text-amber-500 font-semibold mb-1.5 px-1"
        style={{ fontFamily: "Rajdhani, sans-serif" }}
      >
        {group.title}
      </div>
      <div className="space-y-0.5">
        {group.items.map((item) =>
          item.isPhase ? (
            <NavPhase
              key={item.id}
              phase={item}
              activeId={activeId}
              onJump={onJump}
            />
          ) : (
            <NavItem
              key={item.id}
              item={item}
              activeId={activeId}
              onJump={onJump}
            />
          ),
        )}
      </div>
    </div>
  );
}

function NavPhase({ phase, activeId, onJump }) {
  return (
    <div className="mt-2">
      <button
        onClick={() => onJump(phase.id)}
        className={`w-full text-left px-2 py-1 rounded text-sm font-semibold uppercase tracking-wider text-neutral-400 hover:bg-[#1a1a1a] ${
          activeId === phase.id ? "text-amber-400" : ""
        }`}
        style={{ fontFamily: "Rajdhani, sans-serif" }}
      >
        {phase.title}
      </button>
      {phase.items.map((item) => (
        <NavItem
          key={item.id}
          item={item}
          activeId={activeId}
          onJump={onJump}
          indent
        />
      ))}
    </div>
  );
}

function NavItem({ item, activeId, onJump, indent = false }) {
  return (
    <button
      onClick={() => onJump(item.id)}
      className={`w-full text-left ${indent ? "pl-5" : "px-2"} py-1 rounded text-sm hover:bg-[#1a1a1a] ${
        activeId === item.id ? "bg-[#1a1a1a] text-amber-400" : "text-neutral-300"
      }`}
    >
      {item.title}
    </button>
  );
}

function GroupSection({ group }) {
  return (
    <section id={`rule-${group.id}`} className="scroll-mt-6">
      <h1
        className="text-3xl font-bold text-amber-500 mb-2 tracking-wide"
        style={{ fontFamily: "Rajdhani, sans-serif" }}
      >
        {group.title}
      </h1>
      {group.body && (
        <div className="mb-6">
          <RuleBody body={group.body} />
        </div>
      )}
      <div className="space-y-6">
        {group.items.map((item) =>
          item.isPhase ? (
            <PhaseSection key={item.id} phase={item} />
          ) : (
            <ItemCard key={item.id} item={item} />
          ),
        )}
      </div>
    </section>
  );
}

function PhaseSection({ phase }) {
  return (
    <section
      id={`rule-${phase.id}`}
      className="scroll-mt-6 bg-[#0f0f0f] border-l-2 border-amber-600/40 pl-5 py-3"
    >
      <h2
        className="text-2xl font-bold text-amber-400 mb-3 uppercase tracking-wider"
        style={{ fontFamily: "Rajdhani, sans-serif" }}
      >
        {phase.title}
      </h2>
      {phase.body && (
        <div className="mb-4">
          <RuleBody body={phase.body} />
        </div>
      )}
      <div className="space-y-4">
        {phase.items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function ItemCard({ item }) {
  const icon = actionIcon(item.title);
  return (
    <motion.article
      id={`rule-${item.id}`}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="bg-[#141414] border border-[#222] rounded-lg p-5 scroll-mt-20"
    >
      <header className="flex items-baseline gap-2 mb-3">
        {icon && (
          <span className="text-amber-500/80 text-lg leading-none">
            {icon}
          </span>
        )}
        <h3
          className="text-xl font-semibold tracking-wide"
          style={{ fontFamily: "Rajdhani, sans-serif" }}
        >
          {item.title}
        </h3>
      </header>
      <RuleBody body={item.body} />
      {item.items?.length > 0 && (
        <div className="mt-5 space-y-4 pl-4 border-l-2 border-[#222]">
          {item.items.map((c) => (
            <div key={c.id} id={`rule-${c.id}`} className="scroll-mt-20">
              <h4 className="text-base font-semibold text-amber-400/90 mb-1.5">
                {c.title}
              </h4>
              <RuleBody body={c.body} />
            </div>
          ))}
        </div>
      )}
    </motion.article>
  );
}
