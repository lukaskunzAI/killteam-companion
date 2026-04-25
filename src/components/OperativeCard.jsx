// Renders an operative datacard: stats strip, weapons table, abilities list,
// keywords footer.
const STAT_LABELS = ["APL", "MOVE", "SAVE", "WOUNDS"];

export default function OperativeCard({ op }) {
  return (
    <article
      id={`op-${op.id}`}
      className="bg-[#101010] border border-[#1f1f1f] rounded-lg overflow-hidden scroll-mt-20"
    >
      <header className="px-5 pt-4 pb-3">
        <h3 className="display text-xl font-semibold text-amber-400 tracking-wide">
          {op.name}
        </h3>
        {op.lore && (
          <p className="mt-1 text-[13px] text-neutral-500 leading-relaxed italic">
            {op.lore}
          </p>
        )}
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-4 border-y border-[#1f1f1f] bg-[#0c0c0c]">
        {STAT_LABELS.map((k) => (
          <div
            key={k}
            className="px-3 py-3 text-center border-r border-[#1f1f1f] last:border-r-0"
          >
            <div className="text-[10px] uppercase tracking-[0.15em] text-neutral-500">
              {k}
            </div>
            <div className="display text-2xl font-semibold text-neutral-100 tabular-nums mt-0.5">
              {op.stats[k] || "—"}
            </div>
          </div>
        ))}
      </div>

      {/* Weapons */}
      {op.weapons.length > 0 && (
        <div className="px-5 pt-4">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                <th className="text-left font-medium pb-1.5"></th>
                <th className="text-left font-medium pb-1.5">Weapon</th>
                <th className="text-center font-medium pb-1.5 w-10">A</th>
                <th className="text-center font-medium pb-1.5 w-12">Hit</th>
                <th className="text-center font-medium pb-1.5 w-14">Dmg</th>
                <th className="text-left font-medium pb-1.5 pl-3">Rules</th>
              </tr>
            </thead>
            <tbody>
              {op.weapons.map((w, i) => (
                <tr
                  key={i}
                  className="border-t border-[#1a1a1a] text-neutral-300"
                >
                  <td className="py-1.5 pr-2 text-amber-500/70 text-[11px] uppercase tracking-wider">
                    {w.type === "melee" ? "✕" : "→"}
                  </td>
                  <td className="py-1.5 pr-2 text-neutral-100">{w.name}</td>
                  <td className="py-1.5 text-center tabular-nums">{w.atk}</td>
                  <td className="py-1.5 text-center tabular-nums">{w.hit}</td>
                  <td className="py-1.5 text-center tabular-nums">{w.dmg}</td>
                  <td className="py-1.5 pl-3 text-neutral-400 text-[12px]">
                    {w.wr === "-" ? "" : w.wr}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Abilities */}
      {op.abilities.length > 0 && (
        <div className="px-5 py-4 space-y-3">
          {op.abilities.map((a, i) => (
            <div key={i} className="text-[13.5px] leading-relaxed">
              {a.name && (
                <span className="text-amber-400 font-semibold">{a.name}: </span>
              )}
              <span className="text-neutral-300">{a.body}</span>
            </div>
          ))}
        </div>
      )}

      {/* Unique actions (h_actions on operative) */}
      {op.uniqueActions?.length > 0 && (
        <div className="px-5 pb-4 space-y-3">
          {op.uniqueActions.map((u, i) => (
            <div key={i} className="bg-[#0c0c0c] border border-[#1f1f1f] rounded p-3">
              <div className="flex items-baseline justify-between mb-1">
                <span className="display font-semibold text-neutral-100 text-sm tracking-wide">
                  {u.title}
                </span>
                {u.ap && (
                  <span className="text-[10px] uppercase tracking-wider text-amber-500/80">
                    {u.ap}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-neutral-400 leading-relaxed">
                {u.body}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Footer: keywords + base */}
      {(op.keywords?.length > 0 || op.base) && (
        <footer className="px-5 py-2.5 bg-[#0a0a0a] border-t border-[#1a1a1a] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex flex-wrap gap-1.5">
            {op.keywords?.map((k, i) => (
              <span
                key={i}
                className="text-[10px] uppercase tracking-[0.12em] text-neutral-500"
              >
                {k}
                {i < op.keywords.length - 1 && (
                  <span className="text-neutral-700 ml-1.5">·</span>
                )}
              </span>
            ))}
          </div>
          {op.base && (
            <span className="text-[10px] uppercase tracking-wider text-neutral-500">
              ⌀{op.base}
            </span>
          )}
        </footer>
      )}
    </article>
  );
}
