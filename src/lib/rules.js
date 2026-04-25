// Build a navigable tree from the flat list of sections we get out of the
// Wahapedia extractor. The shape we want is:
//
//   [
//     { title: "Übersicht", body, items: [] },
//     { title: "CORE RULES", body, items: [
//       { title: "Strategy Phase", items: [...steps] },
//       { title: "Firefight Phase", items: [...steps] },
//       { title: "Actions", items: [
//         { title: "Reposition 1AP", body, items: [] },
//         ...
//         { title: "Shoot 1AP", body, items: [...sub-steps] },
//       ]},
//     ]},
//     { title: "KEY PRINCIPLES", body, items: [...principles] },
//   ]
const TOP_GROUPS = new Set(["core rules", "key principles"]);
const PHASE_GROUPS = new Set(["strategy phase", "firefight phase", "actions"]);

const norm = (s) => s.trim().toLowerCase();

export function buildNav(sections) {
  const intro = { title: "Übersicht", id: "intro", body: "", items: [] };
  const groups = [intro];
  let curGroup = intro;
  let curPhase = null;
  let lastTopLevelChild = null; // for nesting h4 sub-steps under their parent action

  for (const s of sections) {
    const t = norm(s.title);

    // h1 "Core Rules" is the welcome blurb
    if (s.level === 1 && t === "core rules") {
      intro.body = s.body;
      continue;
    }

    // h3 "CORE RULES" / "KEY PRINCIPLES" mark top-level rule groups
    if (s.level === 3 && TOP_GROUPS.has(t)) {
      curGroup = {
        title: s.title,
        id: s.id,
        body: s.body,
        items: [],
      };
      groups.push(curGroup);
      curPhase = null;
      lastTopLevelChild = null;
      continue;
    }

    // h2 phase headers — only meaningful inside CORE RULES
    if (s.level === 2 && PHASE_GROUPS.has(t)) {
      curPhase = {
        title: s.title,
        id: s.id,
        body: s.body,
        items: [],
        isPhase: true,
      };
      curGroup.items.push(curPhase);
      lastTopLevelChild = null;
      continue;
    }

    // h4 sub-steps belong to the most recent action/section
    if (s.level >= 4 && lastTopLevelChild) {
      lastTopLevelChild.items.push({ ...s, items: [] });
      continue;
    }

    const item = { ...s, items: [] };
    const target = curPhase || curGroup;
    target.items.push(item);
    lastTopLevelChild = item;
  }

  // Drop empty intro group if we ended up with no body for it
  if (!intro.body && intro.items.length === 0) groups.shift();

  return groups;
}
