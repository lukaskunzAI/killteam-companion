#!/usr/bin/env python3
"""Extract a Wahapedia Kill Team V3 team page into structured JSON.

All text is taken verbatim from the source HTML — only HTML tags and
ad/chrome elements are stripped. No paraphrasing.
"""
import json, re, sys
from bs4 import BeautifulSoup, NavigableString, Tag

SRC = sys.argv[1]
DST = sys.argv[2]
TEAM_ID = sys.argv[3] if len(sys.argv) > 3 else None
TEAM_NAME = sys.argv[4] if len(sys.argv) > 4 else None

html = open(SRC, encoding="utf-8").read()
soup = BeautifulSoup(html, "lxml")

for sel in [
    "script", "style", "noscript", "iframe",
    "[id^=ezoic-]", "[id^=tooltip_content]",
    ".page_breaker_ads", ".noprint",
    "form", "header", "footer",
]:
    for el in soup.select(sel):
        el.decompose()

main = soup.find("div", id="content") or soup.body


def clean(s):
    return re.sub(r"\s+", " ", s).strip()


def text_of(node):
    return clean(node.get_text(" ", strip=True))


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


# ---------- intro & composition ----------

team_h2 = soup.find("h2", class_="outline_header2")
team_name = TEAM_NAME or (team_h2 and text_of(team_h2)) or "Team"
if team_name.lower().endswith(" kill team"):
    team_name = team_name[: -len(" kill team")].strip()
team_id = TEAM_ID or slug(team_name)


def collect_intro(h2):
    """Collect the lore paragraphs that immediately follow a team's title h2,
    stopping when a structural container (one that itself holds a heading) is
    encountered."""
    out = []
    for sib in h2.next_siblings:
        if isinstance(sib, Tag) and sib.name in ("h2", "h3"):
            break
        if isinstance(sib, Tag) and sib.find(["h2", "h3"]):
            # this sibling already contains the next section — stop
            break
        if isinstance(sib, NavigableString):
            t = clean(str(sib))
            if t:
                out.append(t)
        elif isinstance(sib, Tag):
            t = text_of(sib)
            if t:
                out.append(t)
    return "\n\n".join(out).strip()


intro = collect_intro(team_h2) if team_h2 else ""

operatives_h2 = next(
    (h for h in soup.find_all("h2") if text_of(h).lower() == "operatives"),
    None,
)
composition = (
    collect_intro(operatives_h2)
    if operatives_h2
    else ""
)

# ---------- token captions ----------

tokens = []
tok_h2 = next(
    (h for h in soup.find_all("h2") if "token" in text_of(h).lower()),
    None,
)
if tok_h2:
    sib = tok_h2.next_sibling
    while sib is not None:
        if isinstance(sib, Tag) and sib.name in ("h2", "h3"):
            break
        if isinstance(sib, Tag):
            for cap in sib.find_all("div", style=re.compile("text-align:center")):
                t = text_of(cap)
                if t and not t.startswith("/"):
                    tokens.append(t)
        sib = sib.next_sibling
    seen = set()
    tokens = [t for t in tokens if not (t in seen or seen.add(t))]


# ---------- prose subsections (Faction Rules use h3 inside) ----------

def collect_h3_subsections(h2_title):
    h2 = next(
        (h for h in soup.find_all("h2") if text_of(h).strip().lower() == h2_title.lower()),
        None,
    )
    if not h2:
        return []
    out, cur = [], None
    for sib in h2.find_all_next():
        if sib.name == "h2":
            break
        if sib.name == "h3":
            if cur:
                out.append(cur)
            cur = {"title": text_of(sib), "body": ""}
            continue
        if cur is None:
            continue
        if not isinstance(sib, Tag):
            continue
        if sib.name in ("h4",):
            continue
        # Skip nested wrappers we already covered
        if sib.find("h3"):
            continue
        t = text_of(sib)
        if t:
            cur["body"] += ("\n\n" if cur["body"] else "") + t
    if cur:
        out.append(cur)
    cleaned = []
    for s in out:
        body = re.sub(r"\n{3,}", "\n\n", s["body"]).strip()
        # de-dup if rendered twice
        half = body[: len(body) // 2]
        if body and body == half + half:
            body = half.strip()
        if body:
            cleaned.append({"title": s["title"], "body": body})
    return cleaned


faction_rules = collect_h3_subsections("Faction Rules")


# ---------- ploy / equipment cards (stratWrapper structure) ----------

def collect_strat_cards(h2_title, name_class_pattern):
    """For a section like 'Strategy Ploys' / 'Faction Equipment', collect each
    card. Cards are wrapped in `div.stratWrapper`; the title is in
    `div.stratName.<name_class_pattern>`."""
    h2 = next(
        (h for h in soup.find_all("h2") if text_of(h).strip().lower() == h2_title.lower()),
        None,
    )
    if not h2:
        return []
    out = []
    cards_seen = set()
    for sib in h2.find_all_next():
        if sib is None:
            break
        if sib.name == "h2":
            break
        if sib.name != "div":
            continue
        cls = " ".join(sib.get("class") or [])
        if "stratWrapper" not in cls:
            continue
        if id(sib) in cards_seen:
            continue
        cards_seen.add(id(sib))
        name_div = sib.find("div", class_=re.compile(name_class_pattern))
        if not name_div:
            continue
        title = text_of(name_div)
        # Lore (italic flavor)
        lore_node = sib.find("p", class_=re.compile(r"ShowFluff|stratLegend2"))
        lore = text_of(lore_node) if lore_node else ""
        # Body: every div after the name wrapper that isn't the name/lore
        body_parts = []
        for child in sib.find_all(["div", "p"], recursive=True):
            t = text_of(child)
            if not t:
                continue
            if t == title or t == lore:
                continue
            if child.find(class_=re.compile(r"stratName")):
                continue
            if child.find_parent(class_=re.compile(r"stratName")):
                continue
            if child.find("div") or child.find("p"):
                # only collect leaf-ish blocks
                continue
            body_parts.append(t)
        body = "\n\n".join(dict.fromkeys([b for b in body_parts if b])).strip()
        if body.startswith(lore) and lore:
            body = body[len(lore) :].strip()
        cost = None
        m = re.match(r"^\s*([0-9]+CP)\s+(.+)$", title)
        if m:
            cost, title = m.group(1), m.group(2)
        out.append({"title": title, "cost": cost, "lore": lore, "body": body})
    return out


strategy_ploys = collect_strat_cards("Strategy Ploys", r"stratStrategicPloy")
firefight_ploys = collect_strat_cards(
    "Firefight Ploys", r"stratFirefightPloy|stratTacticalPloy"
)
faction_equipment = collect_strat_cards("Faction Equipment", r"stratEquipment")


# ---------- team-level datacards (h3 cards under "Datacards" h2) ----------

datacards = []
dc_h2 = next(
    (
        h
        for h in soup.find_all("h2")
        if "datacard" in text_of(h).lower() and "outline_header2" in (h.get("class") or [])
    ),
    None,
)
if dc_h2:
    # Find each h3.h_actions_ds beneath dc_h2 (until the next outline_header2),
    # then pull text from the immediate stratWrapper container.
    end_marker = None
    for sib in dc_h2.find_all_next("h2"):
        if "outline_header2" in (sib.get("class") or []):
            end_marker = sib
            break

    seen_dc = set()
    for h3 in dc_h2.find_all_next("h3"):
        if end_marker and h3.sourceline and end_marker.sourceline and h3.sourceline > end_marker.sourceline:
            break
        classes = h3.get("class") or []
        if not any(c in ("h_actions_ds", "h_actions") for c in classes):
            continue
        wrapper = h3.find_parent("div", class_=re.compile(r"stratWrapper|wtOuterFrame"))
        if wrapper is None:
            continue
        if id(wrapper) in seen_dc:
            continue
        seen_dc.add(id(wrapper))
        title = text_of(h3)
        ap = None
        m = re.search(r"\s+(\d+AP)$", title)
        if m:
            ap = m.group(1)
            title = title[: m.start()].strip()
        # Body: text of wrapper minus the heading itself
        body = text_of(wrapper).replace(text_of(h3), "", 1).strip()
        body = re.sub(r"\n{3,}", "\n\n", body).strip()
        datacards.append({"title": title, "ap": ap, "body": body})


# ---------- operatives ----------

OP_STAT_RE = re.compile(
    r'<td class="pCell[^"]*">(?P<label>APL|MOVE|SAVE|WOUNDS)<div class="dsStat">'
    r'<img[^>]*/>(?P<value>[^<]+(?:<span class="dsPlus">[^<]+</span>)?[^<]*)</div>',
)


def parse_operative(frame):
    raw = str(frame)
    name_div = frame.find("div", class_="dsUnitHeader")
    if not name_div:
        return None
    # The header div contains the name + lore concatenated; isolate the name
    # by reading just the <span> children that aren't lore.
    name_text_full = text_of(name_div)
    # The lore block is rendered inside as a separate <p> or after a <br>; use
    # the <span class="dsTitle"> if present, otherwise take text up to first
    # period followed by capital.
    title_span = name_div.find("span", class_=re.compile(r"dsTitle"))
    if title_span:
        name = text_of(title_span)
    else:
        # First "line" before lore — split on the lore markers
        # Try to find lore italic
        lore_node = name_div.find(class_=re.compile(r"ShowFluff|legend2"))
        if lore_node:
            lore_text = text_of(lore_node)
            name = name_text_full.replace(lore_text, "").strip()
        else:
            name = name_text_full.split(".")[0]
    name = re.sub(r"\s+", " ", name).strip()

    # Lore
    lore_node = frame.find(class_=re.compile(r"ShowFluff|legend2"))
    lore = text_of(lore_node) if lore_node else ""
    # de-dup if rendered twice
    if lore:
        half = lore[: len(lore) // 2]
        if lore == half + half:
            lore = half.strip()

    # Stats
    stats = {}
    for m in OP_STAT_RE.finditer(raw):
        val = re.sub(r'<span[^>]*>([^<]+)</span>', r"\1", m.group("value"))
        val = val.replace("&#34;", '"')
        stats[m.group("label")] = clean(val)

    # Weapons. Wahapedia tables have header rows, "marker" rows that announce a
    # weapon name (with a wsDataRanged/wsDataMelee marker cell), and a stat row.
    # We track the current type/name from marker rows and emit on stat rows.
    weapons = []
    for tbl in frame.find_all("table", class_=re.compile(r"wTable\b")):
        cur_type = None
        cur_name = None
        for tr in tbl.find_all("tr"):
            tds = tr.find_all(["td", "th"])
            row_html = " ".join(str(td) for td in tds)
            type_hint = (
                "melee" if "wsDataMelee" in row_html
                else "ranged" if "wsDataRanged" in row_html
                else None
            )
            cells = [text_of(td) for td in tds]
            non_empty = [c for c in cells if c]
            if not non_empty or non_empty[0].upper() == "NAME":
                continue
            # Marker row: just a name + maybe a marker cell
            if type_hint and len(non_empty) <= 2:
                cur_type = type_hint
                cur_name = non_empty[-1]
                continue
            # Stat row: pick the first 4 numeric/short cells from the end as stats
            # Layout: [.. name(s) ..] ATK HIT DMG WR_long [WR_short]
            if len(non_empty) >= 5:
                # The last cell is often a duplicate WR; drop it if equal.
                if len(non_empty) >= 6 and non_empty[-1] == non_empty[-2]:
                    non_empty = non_empty[:-1]
                # Take last 4 as ATK/HIT/DMG/WR
                wname = cur_name or non_empty[0]
                atk, hit, dmg, wr = non_empty[-4:]
                weapons.append(
                    {
                        "type": cur_type or type_hint or "ranged",
                        "name": wname,
                        "atk": atk,
                        "hit": hit,
                        "dmg": dmg,
                        "wr": wr,
                    },
                )
    # De-dupe by (type, name) keeping the first occurrence
    seen_w = set()
    deduped = []
    for w in weapons:
        key = (w["type"], w["name"])
        if key in seen_w:
            continue
        seen_w.add(key)
        deduped.append(w)
    weapons = deduped

    # Abilities use a span.redfont for the name followed by a <b>:</b> and
    # then the rule text up to the next redfont or the end of the parent block.
    abilities = []
    for nm_span in frame.find_all("span", class_="redfont"):
        nm = text_of(nm_span)
        if not nm:
            continue
        body = []
        sib = nm_span.next_sibling
        while sib is not None:
            if isinstance(sib, Tag):
                if sib.name == "span" and "redfont" in (sib.get("class") or []):
                    break
                if sib.find("span", class_="redfont"):
                    break
                t = clean(sib.get_text(" ", strip=True))
            else:
                t = clean(str(sib))
            if t:
                body.append(t)
            sib = sib.next_sibling
        body_str = re.sub(r"^\s*:\s*", "", " ".join(body)).strip()
        if body_str:
            abilities.append({"name": nm, "body": body_str})

    # Unique actions on operative cards: <h2 class="h_actions_ds"> blocks
    unique_actions = []
    for h in frame.find_all("h2", class_=re.compile(r"h_actions_ds|h_actions")):
        title = text_of(h)
        ap = None
        m = re.search(r"\s+(\d+AP)$", title)
        if m:
            ap = m.group(1)
            title = title[: m.start()].strip()
        # body = following text up to the next h2 inside this frame
        body_parts = []
        for sib in h.find_all_next():
            if sib is h:
                continue
            if sib.find_parent("div", class_="dsOuterFrame") is not frame:
                break
            if sib.name == "h2":
                break
            if isinstance(sib, Tag) and not sib.find(["h2", "h3"]):
                t = text_of(sib)
                if t:
                    body_parts.append(t)
        body = "\n\n".join(dict.fromkeys([b for b in body_parts if b])).strip()
        unique_actions.append({"title": title, "ap": ap, "body": body})

    # Keywords come from <span class="dsKeywordData">; base size from
    # <td class="ShowBaseSize">.
    keywords, base = [], ""
    kw_span = frame.find("span", class_="dsKeywordData")
    if kw_span:
        kw_text = text_of(kw_span)
        keywords = [k.strip() for k in re.split(r",", kw_text) if k.strip()]
    base_td = frame.find(class_="ShowBaseSize")
    if base_td:
        base = text_of(base_td).lstrip("⌀").strip()

    return {
        "id": slug(name),
        "name": name,
        "lore": lore,
        "stats": stats,
        "weapons": weapons,
        "abilities": abilities,
        "uniqueActions": unique_actions,
        "keywords": keywords,
        "base": base,
    }


operatives = []
for frame in soup.find_all("div", class_="dsOuterFrame"):
    op = parse_operative(frame)
    if op and op["stats"]:
        operatives.append(op)


out = {
    "team": team_name,
    "id": team_id,
    "intro": intro,
    "composition": composition,
    "tokens": tokens,
    "factionRules": faction_rules,
    "strategyPloys": strategy_ploys,
    "firefightPloys": firefight_ploys,
    "factionEquipment": faction_equipment,
    "datacards": datacards,
    "operatives": operatives,
}

with open(DST, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

print(f"Wrote {DST}")
print(f"  Team: {out['team']}  ({out['id']})")
print(f"  Intro: {len(out['intro'])} chars; composition: {len(out['composition'])}; tokens: {len(out['tokens'])}")
print(f"  Faction rules: {len(out['factionRules'])}")
print(f"  Strategy ploys: {len(out['strategyPloys'])}")
print(f"  Firefight ploys: {len(out['firefightPloys'])}")
print(f"  Equipment: {len(out['factionEquipment'])}")
print(f"  Datacards: {len(out['datacards'])}")
print(f"  Operatives: {len(out['operatives'])}")
for op in out["operatives"]:
    print(
        f"    - {op['name']:30s}  stats={op['stats']}  weapons={len(op['weapons'])}  "
        f"abilities={len(op['abilities'])}  uniqueActions={len(op['uniqueActions'])}",
    )
