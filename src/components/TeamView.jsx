import { useEffect, useMemo, useState } from "react";
import OperativeCard from "./OperativeCard.jsx";
import RuleBody from "./RuleBody.jsx";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "operatives", label: "Operatives" },
  { id: "ploys", label: "Ploys" },
  { id: "equipment", label: "Equipment" },
  { id: "datacards", label: "Datacards" },
];

export default function TeamView({ team }) {
  const [tab, setTab] = useState("overview");
  const [activeId, setActiveId] = useState(null);
  const [query, setQuery] = useState("");

  // reset tab + scroll when team changes
  useEffect(() => {
    setTab("overview");
    setActiveId(null);
    setQuery("");
  }, [team.id]);

  useEffect(() => {
    if (!activeId) return;
    const el = document.getElementById(activeId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeId, tab]);

  const operativesFiltered = useMemo(() => {
    if (!query.trim()) return team.operatives;
    const q = query.toLowerCase();
    return team.operatives.filter((op) => {
      const hay =
        op.name +
        " " +
        op.keywords.join(" ") +
        " " +
        op.weapons.map((w) => w.name).join(" ") +
        " " +
        op.abilities.map((a) => a.name + " " + a.body).join(" ");
      return hay.toLowerCase().includes(q);
    });
  }, [team.operatives, query]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] h-[calc(100vh-56px)]">
      <aside className="border-r border-[#1a1a1a] bg-[#0c0c0c] overflow-y-auto p-3">
        <div className="display text-[10px] uppercase tracking-[0.18em] text-amber-500/80 font-semibold mb-3 px-1">
          {team.team}
        </div>
        <nav className="space-y-0.5 mb-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-[#161616] ${
                tab === t.id
                  ? "bg-[#161616] text-amber-400"
                  : "text-neutral-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "operatives" && (
          <div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Operativen filtern…"
              className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-amber-500/60 mb-2"
            />
            <div className="space-y-0.5">
              {operativesFiltered.map((op) => (
                <button
                  key={op.id}
                  onClick={() => setActiveId(`op-${op.id}`)}
                  className="w-full text-left px-2 py-1 rounded text-[13px] hover:bg-[#161616] text-neutral-400 hover:text-neutral-200"
                >
                  {op.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      <main className="overflow-y-auto px-6 md:px-12 py-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="display text-3xl font-semibold text-amber-400 mb-1 tracking-wide">
            {team.team}
          </h1>
          {team.intro && (
            <p className="text-neutral-400 text-[13.5px] leading-relaxed mb-8 italic">
              {team.intro}
            </p>
          )}

          {tab === "overview" && <OverviewTab team={team} />}
          {tab === "operatives" && (
            <div className="space-y-6">
              {operativesFiltered.map((op) => (
                <OperativeCard key={op.id} op={op} />
              ))}
            </div>
          )}
          {tab === "ploys" && <PloysTab team={team} />}
          {tab === "equipment" && <EquipmentTab team={team} />}
          {tab === "datacards" && <DatacardsTab team={team} />}
        </div>
      </main>
    </div>
  );
}

function OverviewTab({ team }) {
  return (
    <div className="space-y-8">
      {team.composition && (
        <section>
          <SectionHead>Kill Team Composition</SectionHead>
          <RuleBody body={team.composition} />
        </section>
      )}
      {team.factionRules.length > 0 && (
        <section>
          <SectionHead>Faction Rules</SectionHead>
          <div className="space-y-4">
            {team.factionRules.map((r) => (
              <div key={r.title}>
                <h4 className="display text-base font-semibold text-neutral-100 mb-1">
                  {r.title}
                </h4>
                <RuleBody body={r.body} />
              </div>
            ))}
          </div>
        </section>
      )}
      {team.tokens.length > 0 && (
        <section>
          <SectionHead>Marker / Token Guide</SectionHead>
          <ul className="prose-rule">
            {team.tokens.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function PloysTab({ team }) {
  return (
    <div className="space-y-8">
      {team.strategyPloys.length > 0 && (
        <section>
          <SectionHead>Strategy Ploys</SectionHead>
          <div className="space-y-4">
            {team.strategyPloys.map((p) => (
              <PloyCard key={p.title} ploy={p} variant="strategy" />
            ))}
          </div>
        </section>
      )}
      {team.firefightPloys.length > 0 && (
        <section>
          <SectionHead>Firefight Ploys</SectionHead>
          <div className="space-y-4">
            {team.firefightPloys.map((p) => (
              <PloyCard key={p.title} ploy={p} variant="firefight" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PloyCard({ ploy, variant }) {
  return (
    <div className="bg-[#101010] border border-[#1f1f1f] rounded-lg p-4">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h4 className="display text-base font-semibold text-amber-400 tracking-wide">
          {ploy.title}
        </h4>
        <span className="text-[10px] uppercase tracking-wider text-neutral-500">
          {variant === "strategy" ? "Strategy" : "Firefight"}
          {ploy.cost && ` · ${ploy.cost}`}
        </span>
      </div>
      {ploy.lore && (
        <p className="text-[12.5px] text-neutral-500 italic mb-2 leading-relaxed">
          {ploy.lore}
        </p>
      )}
      <p className="text-[13.5px] text-neutral-300 leading-relaxed">{ploy.body}</p>
    </div>
  );
}

function EquipmentTab({ team }) {
  return (
    <section>
      <SectionHead>Faction Equipment</SectionHead>
      <div className="space-y-4">
        {team.factionEquipment.map((e) => (
          <div
            key={e.title}
            className="bg-[#101010] border border-[#1f1f1f] rounded-lg p-4"
          >
            <h4 className="display text-base font-semibold text-amber-400 mb-1">
              {e.title}
            </h4>
            {e.lore && (
              <p className="text-[12.5px] text-neutral-500 italic mb-2 leading-relaxed">
                {e.lore}
              </p>
            )}
            <p className="text-[13.5px] text-neutral-300 leading-relaxed">{e.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DatacardsTab({ team }) {
  return (
    <section>
      <SectionHead>Team Datacards</SectionHead>
      <div className="space-y-4">
        {team.datacards.map((d) => (
          <div
            key={d.title}
            className="bg-[#101010] border border-[#1f1f1f] rounded-lg p-4"
          >
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <h4 className="display text-base font-semibold text-neutral-100 tracking-wide">
                {d.title}
              </h4>
              {d.ap && (
                <span className="text-[11px] uppercase tracking-wider text-amber-500/80">
                  {d.ap}
                </span>
              )}
            </div>
            <RuleBody body={d.body} />
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHead({ children }) {
  return (
    <h2 className="display text-sm font-semibold uppercase tracking-[0.2em] text-amber-500/80 mb-4 pb-1 border-b border-[#1f1f1f]">
      {children}
    </h2>
  );
}
