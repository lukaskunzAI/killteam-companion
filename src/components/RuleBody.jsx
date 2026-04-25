// Render the markdown-ish body text we pulled from Wahapedia.
// Recognised: paragraph blocks (\n\n separator), `- ` bullet lists,
// `1. ` ordered lists, `**bold**` inline.
const inlineBold = (s, keyPrefix = "i") => {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={`${keyPrefix}-${i}`}>{p.slice(2, -2)}</strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{p}</span>
    ),
  );
};

export default function RuleBody({ body }) {
  if (!body) return null;
  const blocks = body.split(/\n\n+/);
  return (
    <div className="rule-body">
      {blocks.map((block, idx) => {
        const lines = block.split("\n");
        const isUl = lines.every((l) => l.trim().startsWith("- "));
        const isOl = lines.every((l) => /^\s*\d+\.\s/.test(l));
        if (isUl) {
          return (
            <ul key={idx}>
              {lines.map((l, i) => (
                <li key={i}>
                  {inlineBold(l.trim().replace(/^- /, ""), `b${idx}-${i}`)}
                </li>
              ))}
            </ul>
          );
        }
        if (isOl) {
          return (
            <ol key={idx}>
              {lines.map((l, i) => (
                <li key={i}>
                  {inlineBold(
                    l.trim().replace(/^\d+\.\s*/, ""),
                    `b${idx}-${i}`,
                  )}
                </li>
              ))}
            </ol>
          );
        }
        return <p key={idx}>{inlineBold(block, `p${idx}`)}</p>;
      })}
    </div>
  );
}
