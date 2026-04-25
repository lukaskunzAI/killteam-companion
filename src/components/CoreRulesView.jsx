import { useEffect, useMemo, useState } from "react";
import RuleBody from "./RuleBody.jsx";
import { buildNav } from "../lib/rules.js";

export default function CoreRulesView({ sections }) {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(null);

  const groups = useMemo(() => buildNav(sections), [sections]);

  const filtered = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q),
    );
  }, [query, sections]);

  useEffect(() => {
    if (!activeId) return;
    const el = document.getElementById(`rule-${activeId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] h-[calc(100vh-56px)]">
      <aside className="border-r border-[#1a1a1a] bg-[#0c0c0c] overflow-y-auto p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suche…"
          className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-md px-3 py-2 text-sm placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/60"
        />
        {filtered ? (
          <div className="mt-3 space-y-0.5">
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
                className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-[#161616] text-neutral-300"
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

      <main className="overflow-y-auto px-6 md:px-12 py-10">
        <div className="max-w-2xl mx-auto space-y-12">
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
      <div className="display text-[10px] uppercase tracking-[0.18em] text-amber-500/80 font-semibold mb-2 px-1">
        {group.title}
      </div>
      <div className="space-y-0.5">
        {group.items.map((item) =>
          item.isPhase ? (
            <NavPhase key={item.id} phase={item} activeId={activeId} onJump={onJump} />
          ) : (
            <NavItem key={item.id} item={item} activeId={activeId} onJump={onJump} />
          ),
        )}
      </div>
    </div>
  );
}

function NavPhase({ phase, activeId, onJump }) {
  return (
    <div className="mt-3">
      <button
        onClick={() => onJump(phase.id)}
        className={`display w-full text-left px-2 py-1 rounded text-[11px] font-semibold uppercase tracking-[0.16em] hover:bg-[#161616] ${
          activeId === phase.id ? "text-amber-400" : "text-neutral-500"
        }`}
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
      className={`w-full text-left ${indent ? "pl-5" : "px-2"} py-1 rounded text-sm hover:bg-[#161616] ${
        activeId === item.id ? "bg-[#161616] text-amber-400" : "text-neutral-300"
      }`}
    >
      {item.title}
    </button>
  );
}

function GroupSection({ group }) {
  return (
    <section id={`rule-${group.id}`} className="scroll-mt-6">
      <h1 className="display text-2xl font-semibold text-amber-400 mb-3 tracking-wide">
        {group.title}
      </h1>
      {group.body && (
        <div className="mb-8">
          <RuleBody body={group.body} />
        </div>
      )}
      <div className="space-y-8">
        {group.items.map((item) =>
          item.isPhase ? (
            <PhaseSection key={item.id} phase={item} />
          ) : (
            <ItemBlock key={item.id} item={item} />
          ),
        )}
      </div>
    </section>
  );
}

function PhaseSection({ phase }) {
  return (
    <section id={`rule-${phase.id}`} className="scroll-mt-6">
      <h2 className="display text-sm font-semibold uppercase tracking-[0.2em] text-amber-500/80 mb-3 pb-1 border-b border-[#1f1f1f]">
        {phase.title}
      </h2>
      {phase.body && (
        <div className="mb-5">
          <RuleBody body={phase.body} />
        </div>
      )}
      <div className="space-y-6">
        {phase.items.map((item) => (
          <ItemBlock key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function ItemBlock({ item }) {
  return (
    <article id={`rule-${item.id}`} className="scroll-mt-20">
      <h3 className="display text-lg font-semibold text-neutral-100 mb-2">
        {item.title}
      </h3>
      <RuleBody body={item.body} />
      {item.items?.length > 0 && (
        <div className="mt-4 space-y-4 pl-4 border-l border-[#1f1f1f]">
          {item.items.map((c) => (
            <div key={c.id} id={`rule-${c.id}`} className="scroll-mt-20">
              <h4 className="display text-sm font-semibold text-amber-400/80 mb-1">
                {c.title}
              </h4>
              <RuleBody body={c.body} />
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
