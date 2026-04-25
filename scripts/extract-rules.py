#!/usr/bin/env python3
"""Extract Kill Team V3 rules from a Wahapedia HTML dump into clean JSON."""
import json, re, sys
from bs4 import BeautifulSoup, NavigableString, Tag

SRC = sys.argv[1] if len(sys.argv) > 1 else "/tmp/kt_core.html"
DST = sys.argv[2] if len(sys.argv) > 2 else "/tmp/kt_core.json"

html = open(SRC, encoding="utf-8").read()
soup = BeautifulSoup(html, "lxml")

for sel in [
    "script", "style", "noscript", "iframe",
    "[id^=ezoic-]", "[id^=tooltip_content]",
    ".page_breaker_ads", ".noprint", ".sidebar", ".menu",
    ".bottom_navi", ".top_navi", ".navi", ".ad", ".ads",
    ".armylist_header", ".contents_header",
    ".NavColumns3", ".NavColumns2", ".NavColumns",
    "form", "header", "footer", "nav", "img",
]:
    for el in soup.select(sel):
        el.decompose()

# Remove the "Books" metadata block that appears at the top of every
# Wahapedia rules page — it's a table of book editions, not rules content.
for h2 in soup.find_all("h2"):
    if h2.get_text(strip=True).lower() == "books":
        # walk forward sibling-by-sibling until we hit the next h2/h3
        sib = h2.next_sibling
        kill = [h2]
        while sib is not None:
            if isinstance(sib, Tag) and sib.name in ("h2", "h3"):
                break
            kill.append(sib)
            sib = sib.next_sibling
        for k in kill:
            if isinstance(k, Tag):
                k.decompose()
            elif isinstance(k, NavigableString):
                k.extract()

main = soup.find("div", id="content") or soup.body
LEVEL = {"h1": 1, "h2": 2, "h3": 3, "h4": 4, "h5": 5}

def clean_text(s):
    return re.sub(r"\s+", " ", s).strip()

def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

def is_heading(node):
    return isinstance(node, Tag) and node.name in LEVEL

# Flatten all headings + the text/tags between them into sections.
# We do that by walking the document linearly via .descendants,
# but we need to avoid re-processing nested headings. Approach:
# walk top-level *paragraph-ish* descendants only (those whose text is
# not inside a heading or another emitted block).

# Simpler approach: linearise the body as a sequence of "events":
# each Tag we encounter that is either a heading or a "leaf-ish" content
# carrier (list, table, or a tag whose descendants contain no further
# headings).

# We'll iterate over all elements; for each heading we record a marker; for
# everything else we'll collect its text only if no ancestor is also being
# processed in the same pass. To do that we work block-by-block from a
# linearised list of "candidates".

# Build the candidates list: every direct or nested descendant that is
# either a heading, or a content tag that has no heading descendants
# AND whose nearest content-tag ancestor is the document root.

def heading_inside(tag):
    return tag.find(list(LEVEL.keys())) is not None

# Walk DOM in document order. When we see a heading, finalize current section
# and start new. When we see text content that doesn't contain headings and
# isn't already covered, add it to the current section.
sections = []
current = {"level": 0, "title": "Preamble", "id": "preamble", "blocks": []}
covered = set()  # ids of tags whose text we've taken

def covered_by_ancestor(tag):
    p = tag.parent
    while p is not None:
        if id(p) in covered:
            return True
        p = p.parent
    return False

def render(tag):
    if isinstance(tag, NavigableString):
        return clean_text(str(tag))
    name = tag.name
    if name == "ul":
        return "\n".join("- " + clean_text(li.get_text(" ", strip=True))
                         for li in tag.find_all("li", recursive=False))
    if name == "ol":
        items = tag.find_all("li", recursive=False)
        return "\n".join(f"{i+1}. " + clean_text(li.get_text(" ", strip=True))
                         for i, li in enumerate(items))
    if name == "table":
        rows = []
        for tr in tag.find_all("tr"):
            cells = [clean_text(td.get_text(" ", strip=True)) for td in tr.find_all(["th","td"])]
            if cells:
                rows.append(" | ".join(cells))
        return "\n".join(rows)
    return clean_text(tag.get_text(" ", strip=True))

# Iterate in document order over all nodes (including text)
for el in main.descendants:
    if isinstance(el, Tag):
        if is_heading(el):
            title = clean_text(el.get_text(" ", strip=True))
            if not title or title.lower() in ("books", "kill team"):
                continue
            # finalize current
            if current["blocks"]:
                sections.append(current)
            current = {
                "level": LEVEL[el.name],
                "title": title,
                "id": slug(title),
                "blocks": [],
            }
            covered.add(id(el))
            continue
        # treat lists/tables as atomic blocks
        if el.name in ("ul", "ol", "table"):
            if covered_by_ancestor(el) or heading_inside(el):
                continue
            txt = render(el)
            if txt:
                current["blocks"].append(txt)
                covered.add(id(el))
            continue
        # for any other tag, we don't emit it directly; we let the
        # navigablestring loop pick up text. But we need to mark
        # as covered tags whose `string` we'll never see (e.g., decorative).
    elif isinstance(el, NavigableString):
        if covered_by_ancestor(el):
            continue
        # skip inside headings / scripts already-removed
        # Find the closest tag ancestor and check if it's inside a heading
        anc = el.parent
        in_heading = False
        while anc is not None and anc is not main:
            if isinstance(anc, Tag) and anc.name in LEVEL:
                in_heading = True
                break
            anc = anc.parent
        if in_heading:
            continue
        txt = clean_text(str(el))
        if txt and txt not in ("|", "•", "·", "-", "—", "/noindex--"):
            # Drop the html comment leftover and lone bullets
            if txt.startswith("/noindex"):
                continue
            current["blocks"].append(txt)

if current["blocks"]:
    sections.append(current)

# Merge consecutive blocks separated by single newlines into paragraphs;
# if the block is short and the next is short, glue them.
def assemble(blocks):
    body = ""
    for b in blocks:
        if not b.strip():
            continue
        if not body:
            body = b
            continue
        # If previous body ended with no terminal punctuation and current
        # starts with a lowercase letter, join with a space.
        if body[-1:].isalnum() and b[:1].islower():
            body += " " + b
        else:
            body += "\n\n" + b
    body = re.sub(r"[ \t]+", " ", body)
    body = re.sub(r"\n{3,}", "\n\n", body)
    return body.strip()

out = []
seen_ids = {}
for s in sections:
    body = assemble(s["blocks"])
    if not body:
        continue
    base = s["id"] or "section"
    n = seen_ids.get(base, 0)
    seen_ids[base] = n + 1
    uid = base if n == 0 else f"{base}-{n+1}"
    out.append({
        "level": s["level"],
        "title": s["title"],
        "id": uid,
        "body": body,
    })

# Final scrub: drop login/cookie/ad junk
NOISE = ("subscribe to wahapedia", "patreon", "disable ads",
         "support wahapedia", "sign in to your account",
         "send me an e-mail with my pin", "captcha", "consent")
clean = []
for s in out:
    bl = s["body"].lower()
    if any(n in bl for n in NOISE) and len(s["body"]) < 800:
        continue
    if s["title"].lower() in ("preamble",) and len(s["body"]) < 200:
        continue
    clean.append(s)

with open(DST, "w", encoding="utf-8") as f:
    json.dump(clean, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(clean)} sections, {sum(len(s['body']) for s in clean)} chars total -> {DST}")
print()
for s in clean:
    print(f"  [h{s['level']:1d}] {s['title'][:64]:64s}  ({len(s['body'])})")
