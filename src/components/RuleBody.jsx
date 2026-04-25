// Render the markdown-ish body text we pull from Wahapedia. Recognises
// paragraph blocks (\n\n separator), `- ` bullet lists, `1. ` ordered lists,
// and `**bold**` inline.
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

export default function RuleBody({ body, className = "" }) {
  if (!body) return null;
  const blocks = body.split(/\n\n+/);
  return (
    <div className={`prose-rule ${className}`}>
      {blocks.map((block, idx) => {
        const lines = block.split("\n");
        const isUl = lines.length > 1 && lines.every((l) => l.trim().startsWith("- "));
        const isOl = lines.length > 1 && lines.every((l) => /^\s*\d+\.\s/.test(l));
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
