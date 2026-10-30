# draw_flowchart.py: draw docs/roadmap-flowchart.svg from the issue files and the roadmap table
#
# a swimlane chart: one horizontal band per stage, columns left to right in build order,
# one box per issue, an arrow for each "Depends on" (minus arrows a longer path already implies).
# arrows take the colour of the stage they start in; arrows into another stage are dashed.
# opened in a browser, hovering a box highlights its own arrows and neighbours.
# done issues get a tick, issues ready to start get a thick border.
#
# run from the repo folder:  agent/.venv/Scripts/python docs/issues/draw_flowchart.py
import pathlib
import re
import textwrap
from xml.sax.saxutils import escape

ISSUES = pathlib.Path("docs/issues")
ROADMAP = pathlib.Path("docs/roadmap.md")
OUTPUT = pathlib.Path("docs/roadmap-flowchart.svg")

LANES = ["S1", "M", "S2", "S3", "S4", "S5", "S6"]
COLOURS = {  # (box fill, border and arrow colour, lane background)
    "S1": ("#C8E6C9", "#2E7D32", "#F3FAF3"), "M": ("#FFF3C4", "#B8860B", "#FFFCEF"),
    "S2": ("#DCEBFB", "#1565C0", "#F4F8FE"), "S3": ("#D5F0EC", "#00796B", "#F2FAF9"),
    "S4": ("#E8DDF5", "#6A1B9A", "#F8F4FC"), "S5": ("#FDE3CC", "#E65100", "#FFF8F2"),
    "S6": ("#E3E7EB", "#455A64", "#F6F7F8"),
}
NAMES = {
    "S1": "Stage 1\nfoundations", "M": "Follow-ups\nfrom review", "S2": "Stage 2\nvoice agent",
    "S3": "Stage 3\nusage + data", "S4": "Stage 4\nserver + sync", "S5": "Stage 5\nweb app",
    "S6": "Stage 6\nrelease",
}
BOX_W, BOX_H = 190, 58      # one issue box
COL_W, ROW_H = 250, 74      # spacing between columns / between boxes in a lane
LANE_PAD = 14               # space above and below the boxes inside a lane
LABEL_W, LEFT, TOP = 130, 30, 150


def lane_of(ident):
    return "M" if ident.startswith("M") else ident[:2]


def css_id(ident):
    return ident.replace("-", "_")


def read_issues():
    # stage issues S2..S6 are containers: they become lanes, not boxes
    deps, titles = {}, {}
    for f in sorted(ISSUES.glob("*.md")):
        if f.name == "README.md":
            continue
        text = f.read_text(encoding="utf-8")
        head = re.match(r"# \[([A-Z0-9-]+)\] (.+)", text)
        ident = head.group(1)
        if re.fullmatch(r"S[2-6]", ident):
            continue
        line = re.search(r"\| Depends on \| (.+) \|", text).group(1)
        found = re.findall(r"\b(S\d(?:-\d\d)?|M\d)\b", line)
        deps[ident] = [d for d in found if not re.fullmatch(r"S[2-6]", d)]
        titles[ident] = head.group(2).replace("`", "").replace('"', "")
    return deps, titles


def read_roadmap(deps):
    # GitHub number and status from the roadmap's table
    number, status = {}, {}
    for line in ROADMAP.read_text(encoding="utf-8").splitlines():
        cells = [c.strip() for c in line.split("|")[1:-1]] if line.startswith("| ") else []
        if len(cells) == 6 and cells[0] in deps:
            number[cells[0]], status[cells[0]] = cells[4], cells[5]
    return number, status


def layout(deps):
    # column = one to the right of the latest dependency
    depth = {}

    def column(n):
        if n not in depth:
            depth[n] = 0 if not deps[n] else 1 + max(column(p) for p in deps[n])
        return depth[n]

    for n in deps:
        column(n)
    cells = {}  # (lane, column) -> issues in that cell
    for n in sorted(deps):
        cells.setdefault((lane_of(n), depth[n]), []).append(n)

    # lane height = the most issues any one column has in that lane
    lane_rows = {lane: max((len(v) for (ln, _), v in cells.items() if ln == lane), default=1)
                 for lane in LANES}
    lane_top, y = {}, TOP
    for lane in LANES:
        lane_top[lane] = y
        y += lane_rows[lane] * ROW_H + 2 * LANE_PAD - (ROW_H - BOX_H)

    # fill columns left to right; inside a cell, issues whose parents sit higher go higher
    xy = {}
    for k in range(max(depth.values()) + 1):
        for lane in LANES:
            group = cells.get((lane, k), [])

            def key(n):
                parents = [xy[p][1] for p in deps[n] if p in xy]
                return (sum(parents) / len(parents) if parents else 0, n)

            for slot, n in enumerate(sorted(group, key=key)):
                xy[n] = (LEFT + LABEL_W + COL_W * k, lane_top[lane] + LANE_PAD + slot * ROW_H)
    width = LEFT + LABEL_W + COL_W * (max(depth.values()) + 1) - (COL_W - BOX_W) + LEFT
    return xy, lane_top, lane_rows, width, y + 30


def reduce_arrows(deps):
    # drop arrows a longer path already implies (A->B->C makes A->C redundant)
    def reaches(a, b):
        return any(p == b or reaches(p, b) for p in deps[a])

    return [(p, n) for n in deps for p in deps[n]
            if not any(q != p and reaches(q, p) for q in deps[n])]


def ports(arrows, xy):
    # spread arrow ends along each box's side, ordered by where the other end is,
    # so arrows do not all leave from (or arrive at) the same point
    out_y, in_y = {}, {}
    for side, own, other in (("out", 0, 1), ("in", 1, 0)):
        by_box = {}
        for a in arrows:
            by_box.setdefault(a[own], []).append(a)
        for box, group in by_box.items():
            group.sort(key=lambda a: xy[a[other]][1])
            for i, a in enumerate(group):
                y = xy[box][1] + BOX_H * (i + 1) / (len(group) + 1)
                (out_y if side == "out" else in_y)[a] = y
    return out_y, in_y


def main():
    deps, titles = read_issues()
    number, status = read_roadmap(deps)
    done = {n for n in deps if status.get(n, "").startswith("done")}
    ready = {n for n in deps if n not in done and all(p in done for p in deps[n])}
    xy, lane_top, lane_rows, width, height = layout(deps)
    arrows = reduce_arrows(deps)
    out_y, in_y = ports(arrows, xy)
    neighbours = {n: set() for n in deps}
    for p, n in arrows:
        neighbours[p].add(n)
        neighbours[n].add(p)

    # hover highlighting (works when the SVG is opened directly in a browser)
    style = [
        # opacity (not stroke-opacity) so the arrowheads fade together with their lines
        ".edge { opacity: 0.6; transition: opacity .15s; }",
        ".node { transition: opacity .15s; }",
        "svg:has(.node:hover) .edge { opacity: 0.07; }",
        "svg:has(.node:hover) .node { opacity: 0.3; }",
    ]
    for n in deps:
        i = css_id(n)
        style.append(f"svg:has(#n_{i}:hover) .e_{i} {{ opacity: 1; stroke-width: 3; }}")
        style.append(f"svg:has(#n_{i}:hover) #n_{i}, "
                     f"svg:has(#n_{i}:hover) .nb_{i} {{ opacity: 1; }}")

    svg = [
        (f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
         f'viewBox="0 0 {width} {height}" font-family="Segoe UI, Helvetica, Arial, sans-serif">'),
        "<style>\n" + "\n".join(style) + "\n</style>",
        "<defs>",
    ]
    for lane in LANES:
        colour = COLOURS[lane][1]
        svg.append(f'<marker id="a_{lane}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" '
                   f'markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" '
                   f'fill="{colour}"/></marker>')
    svg += [
        "</defs>",
        f'<rect width="{width}" height="{height}" fill="#FFFFFF"/>',
        (f'<text x="{LEFT}" y="42" font-size="26" font-weight="700" fill="#1F2933">'
         "Listen: how the project gets built</text>"),
        (f'<text x="{LEFT}" y="70" font-size="14" fill="#52606D">One box = one GitHub issue, '
         "one band = one stage. Read left to right: an arrow means “must be finished "
         "before”; boxes in the same column can be done in any order.</text>"),
        (f'<text x="{LEFT}" y="94" font-size="14" fill="#52606D">Arrows take the colour of the '
         "stage they start in; dashed arrows cross into another stage. Thick border = ready to "
         "start now. ✓ = done. Open this file in a browser and hover a box to highlight "
         "its links.</text>"),
    ]
    # lanes: background band and label
    for lane in LANES:
        top = lane_top[lane]
        band = lane_rows[lane] * ROW_H + 2 * LANE_PAD - (ROW_H - BOX_H)
        fill, border, back = COLOURS[lane]
        svg.append(f'<rect x="{LEFT}" y="{top}" width="{width - 2 * LEFT}" height="{band}" '
                   f'fill="{back}" stroke="#E4E7EB"/>')
        svg.append(f'<rect x="{LEFT}" y="{top}" width="6" height="{band}" fill="{border}"/>')
        for i, part in enumerate(NAMES[lane].split("\n")):
            weight = 700 if i == 0 else 400
            svg.append(f'<text x="{LEFT + 16}" y="{top + 24 + 17 * i}" font-size="14" '
                       f'font-weight="{weight}" fill="{border}">{escape(part)}</text>')
    # arrows (under the boxes)
    for p, n in arrows:
        x1, y1 = xy[p][0] + BOX_W, out_y[(p, n)]
        x2, y2 = xy[n][0] - 2, in_y[(p, n)]
        bend = max(40, (x2 - x1) / 2)
        colour = COLOURS[lane_of(p)][1]
        dash = ' stroke-dasharray="6 4"' if lane_of(p) != lane_of(n) else ""
        svg.append(f'<path class="edge e_{css_id(p)} e_{css_id(n)}" '
                   f'd="M{x1},{y1:.1f} C{x1 + bend},{y1:.1f} {x2 - bend},{y2:.1f} {x2},{y2:.1f}" '
                   f'fill="none" stroke="{colour}" stroke-width="1.6"{dash} '
                   f'marker-end="url(#a_{lane_of(p)})"/>')
    # boxes
    for n, (bx, by) in xy.items():
        fill, border, _ = COLOURS[lane_of(n)]
        classes = " ".join(["node"] + [f"nb_{css_id(m)}" for m in sorted(neighbours[n])])
        thickness = 3.2 if n in ready else 1.2
        svg.append(f'<g id="n_{css_id(n)}" class="{classes}">')
        svg.append(f"<title>{escape(n)} {escape(number.get(n, ''))}: {escape(titles[n])}</title>")
        svg.append(f'<rect x="{bx}" y="{by}" width="{BOX_W}" height="{BOX_H}" rx="8" '
                   f'fill="{fill}" stroke="{border}" stroke-width="{thickness}"/>')
        head = f"{n}  {number.get(n, '')}" + ("  ✓" if n in done else "")
        svg.append(f'<text x="{bx + 10}" y="{by + 18}" font-size="13" font-weight="700" '
                   f'fill="{border}">{escape(head)}</text>')
        lines = textwrap.wrap(titles[n], 29)
        shown = lines[:2]
        if len(lines) > 2:
            shown[1] = shown[1][:26] + "..."
        for i, text in enumerate(shown):
            svg.append(f'<text x="{bx + 10}" y="{by + 35 + 14 * i}" font-size="11.5" '
                       f'fill="#323F4B">{escape(text)}</text>')
        svg.append("</g>")
    svg.append("</svg>")
    OUTPUT.write_text("\n".join(svg), encoding="utf-8")
    print(f"wrote {OUTPUT}: {len(deps)} boxes, {len(arrows)} arrows, {width}x{height:.0f}px, "
          f"ready now: {', '.join(sorted(ready))}")


if __name__ == "__main__":
    main()
