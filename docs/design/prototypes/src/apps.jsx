/* ================= App usage: where the time goes ================= */

// every app that was in front, minutes over the last 7 days, and over the 7 days before that.
// the chart draws the top 7 as bars and folds the rest into "Other" (Doc 08); the list shows all of them.
//   first: first day the app was ever opened (zero before it)    on: the only weekdays it is used
//   p: chance it is opened on a given day (small apps skip days)  trend: drift across the range
const APPS = [
  { name: 'VS Code', min: 940, prev: 812, trend: 0.5 },
  { name: 'Google Chrome', min: 845, prev: 901, trend: -0.2 },
  { name: 'Windows Terminal', min: 372, prev: 340 },
  { name: 'CLion', min: 290, prev: 155, trend: 0.3 },
  { name: 'Spotify', min: 205, prev: 236 },
  { name: 'Discord', min: 130, prev: 171, wk: 1.6 },
  { name: 'Figma', min: 95, prev: 60, p: 0.75 },
  { name: 'Steam', min: 75, prev: 0, first: new Date(2026, 9, 13), wk: 2.2 },
  { name: 'Zoom', min: 41, prev: 55, on: [1, 3, 5] },
  { name: 'Notion', min: 39, prev: 45 },
  { name: 'WhatsApp', min: 26, prev: 30 },
  { name: 'File Explorer', min: 14, prev: 15 },
  { name: 'Postman', min: 12, prev: 6, p: 0.6 },
  { name: 'Obsidian', min: 9, prev: 12, p: 0.7 },
  { name: 'Settings', min: 10, prev: 4, p: 0.5 },
  { name: 'Excel', min: 4, prev: 14, p: 0.4 },
  { name: 'Calculator', min: 6, prev: 7, p: 0.5 },
  { name: 'Snipping Tool', min: 5, prev: 5, p: 0.5 },
  { name: 'Task Manager', min: 4, prev: 3, p: 0.4 },
  { name: 'VLC media player', min: 4, prev: 12, p: 0.3 },
  { name: 'Paint', min: 3, prev: 2, p: 0.3 }
];
// used in the previous period, not opened in this one
const GONE = [{ name: 'Microsoft Teams', prev: 45 }];
const SITES7 = {
  'Google Chrome': [['leetcode.com', 365], ['youtube.com', 190], ['Google Search', 108], ['takeuforward.org', 80],
    ['github.com', 58], ['stackoverflow.com', 24], ['Other sites', 20]]
};
const SCALE = { today: 1.06 / 7, 7: 1, 30: 4.2, 90: 12.3, custom: 6.5 };
const RANGE_DAYS = { today: 1, 7: 7, 30: 30, 90: 90, custom: 47 };
const RANGE_WORD = { today: 'today', 7: 'last 7 days', 30: 'last 30 days', 90: 'last 90 days', custom: '1 Sep – 17 Oct' };
const PREV_WORD = { today: 'yesterday', 7: 'the 7 days before', 30: 'the 30 days before', 90: 'the 90 days before', custom: 'the 47 days before' };

// compare mode: four fixed categorical slots (dataviz reference order, validated light and dark),
// each with its own marker shape so identity never rests on colour alone
const SLOTS = [
  { color: 'var(--c1)', shape: 'circle' }, { color: 'var(--c2)', shape: 'square' },
  { color: 'var(--c3)', shape: 'triangle' }, { color: 'var(--c4)', shape: 'diamond' }
];

// daily minutes per app for a range; the days add up to the app's total for that range
const dailyFor = (app, idx, days, k) => {
  const rand = mulberry32(101 + idx * 13 + days);
  const pts = Array.from({ length: days }, (_, i) => {
    const date = daysAgo(days - 1 - i);
    const dow = date.getDay();
    const wk = dow === 0 || dow === 6;
    const r = rand(), skip = rand();
    if (app.first && date < app.first) return { date, v: 0 };
    if (app.on && !app.on.includes(dow)) return { date, v: 0 };
    if (app.p && skip > app.p) return { date, v: 0 };
    const trend = 1 + (i / Math.max(1, days) - 0.5) * (app.trend ?? 0);
    return { date, v: (wk ? app.wk ?? 0.55 : 1.12) * trend * (0.6 + r * 0.8) };
  });
  const sum = pts.reduce((a, p) => a + p.v, 0);
  if (!sum && !app.first && !app.on) pts[days - 1].v = 1;
  const s = pts.reduce((a, p) => a + p.v, 0);
  return s ? pts.map(p => ({ date: p.date, v: (p.v / s) * app.min * k })) : pts;
};

const pct = (v, total) => {
  const x = (v / total) * 100;
  return x >= 1 ? `${Math.round(x)}%` : x > 0 ? '<1%' : '0%';
};

/* ---- marker shapes (line ends, hover dots, legend) ---- */
function Mark({ shape, x, y, r = 4.5, fill, ring = 'var(--surface)' }) {
  const common = { fill, stroke: ring, strokeWidth: 2, strokeLinejoin: 'round' };
  if (shape === 'square') return <rect x={x - r + 0.5} y={y - r + 0.5} width={2 * r - 1} height={2 * r - 1} rx={1.5} {...common} />;
  if (shape === 'triangle') return <path d={`M${x},${y - r * 1.25}L${x + r * 1.2},${y + r * 0.85}L${x - r * 1.2},${y + r * 0.85}Z`} {...common} />;
  if (shape === 'diamond') return <path d={`M${x},${y - r * 1.3}L${x + r * 1.3},${y}L${x},${y + r * 1.3}L${x - r * 1.3},${y}Z`} {...common} />;
  return <circle cx={x} cy={y} r={r} {...common} />;
}
const Swatch = ({ slot }) => (
  <svg className="swatch" width="22" height="12" viewBox="0 0 22 12" aria-hidden="true">
    <path d="M1 6H21" stroke={SLOTS[slot].color} strokeWidth="2" strokeLinecap="round" />
    <Mark shape={SLOTS[slot].shape} x={11} y={6} r={3.6} fill={SLOTS[slot].color} />
  </svg>
);

/* horizontal bars: one hue (magnitude), value at the tip, the selected app in full accent.
   "Other" is a button: it opens the full list at the point where the bars stop. */
function HBars({ rows, selected, onSelect, onOther, unit = 'min', label }) {
  const max = Math.max(...rows.map(r => r.v));
  const [tip, setTip] = useState(null);
  const total = rows.reduce((a, r) => a + r.v, 0);
  return (
    <div className="hbars chart" onMouseLeave={() => setTip(null)}>
      <ul aria-label={label}>
        {rows.map(r => {
          const other = !!r.other;
          const sel = selected === r.name;
          const click = other ? onOther : onSelect ? () => onSelect(r.name) : null;
          const Tag = click ? 'button' : 'div';
          const inOther = other && r.selPart ? r.selPart : null;
          const name = other && r.count ? `Other · ${r.count} apps` : r.name;
          return (
            <li key={r.name}>
              <Tag className={`hbar${sel ? ' sel' : ''}${other ? ' other' : ''}${inOther ? ' has-sel' : ''}`}
                   {...(click ? { onClick: click, ...(other ? { 'aria-label': `Other: ${r.count} apps, ${fmtMin(r.v)}. Show them in the list` } : { 'aria-pressed': sel }) } : {})}
                   onMouseMove={e => { const b = e.currentTarget.closest('.hbars').getBoundingClientRect(); setTip({ x: e.clientX - b.left, y: e.clientY - b.top, body: <><b>{name}</b><br />{fmtMin(r.v)} · {pct(r.v, total)} of the time{other && r.count ? <><br />Select to list all {r.count}</> : null}</> }); }}>
                <span className="hb-name">{other && r.count ? <>Other <span className="hb-count">· {r.count} apps</span>{inOther ? <span className="hb-incl">incl. {inOther.name}</span> : null}</> : r.name}</span>
                <span className="hb-track">
                  {inOther ? (
                    <>
                      <span className="hb-fill hb-part" style={{ width: `${(inOther.v / max) * 100}%` }} />
                      <span className="hb-fill" style={{ width: `${((r.v - inOther.v) / max) * 100}%` }} />
                    </>
                  ) : <span className="hb-fill" style={{ width: `${(r.v / max) * 100}%` }} />}
                </span>
                <span className="hb-val num">{fmtMin(r.v)}</span>
              </Tag>
            </li>
          );
        })}
      </ul>
      <ChartTip tip={tip} />
    </div>
  );
}

/* y scale: minutes for small apps, hours otherwise */
const yScale = maxRaw => {
  if (maxRaw <= 90) {
    const m = [8, 12, 20, 40, 60, 80, 100].find(c => c >= maxRaw);
    return { max: m, ticks: ticks(m, 4), fmt: t => (t === 0 ? '0' : `${Math.round(t)} min`) };
  }
  const rawH = Math.ceil(maxRaw / 60);
  const maxH = rawH <= 6 ? rawH : Math.ceil(rawH / 2) * 2;
  return { max: maxH * 60, ticks: ticks(maxH * 60, maxH <= 6 ? maxH : maxH / 2), fmt: t => (t === 0 ? '0' : `${Math.round(t / 60)} h`) };
};

// split a series into solid runs and "not opened" runs (two zero days in a row, drawn dashed on the baseline)
const runs = (pts, x, y) => {
  let solid = '', zero = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const seg = `M${x(i).toFixed(1)},${y(a.v).toFixed(1)}L${x(i + 1).toFixed(1)},${y(b.v).toFixed(1)}`;
    if (a.v === 0 && b.v === 0) zero += seg; else solid += seg;
  }
  return { solid, zero };
};

// end labels: keep the two-line labels from overlapping, draw a leader when a label had to move
const placeLabels = (items, top, bottom, gap = 32) => {
  const s = [...items].sort((a, b) => a.y - b.y).map(it => ({ ...it, ly: Math.min(bottom, Math.max(top, it.y)) }));
  for (let i = 1; i < s.length; i++) if (s[i].ly < s[i - 1].ly + gap) s[i].ly = s[i - 1].ly + gap;
  if (s.length && s[s.length - 1].ly > bottom) s[s.length - 1].ly = bottom;
  for (let i = s.length - 2; i >= 0; i--) if (s[i].ly > s[i + 1].ly - gap) s[i].ly = s[i + 1].ly - gap;
  s.forEach(it => { it.ly = Math.max(top, it.ly); });
  return s;
};

/* line chart. Highlight mode: the chosen app in accent, other top apps grey (emphasis, not identity).
   Compare mode: up to four picks, each in its own fixed slot colour + marker shape, labelled at the line end. */
function TrendChart({ lines, mode, highlight }) {
  const ref = useRef(null);
  const [w, setW] = useState(1100);
  const [hover, setHover] = useState(null);
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const compare = mode === 'compare';
  const shown = lines;
  const H = 280, L = 58, R = 170, T = 18, B = 30;
  const days = shown[0].points.length;
  const ys = yScale(Math.max(1, ...shown.flatMap(s => s.points.map(p => p.v))));
  const x = i => L + (i / Math.max(1, days - 1)) * (w - L - R);
  const y = v => T + (1 - v / ys.max) * (H - T - B);
  const path = pts => pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
  const hi = compare ? null : shown.find(s => s.name === highlight);
  const grey = compare ? [] : shown.filter(s => s.name !== highlight);
  const front = compare ? shown : [hi];
  const step = Math.ceil(days / 8);
  const onMove = e => {
    const b = ref.current.getBoundingClientRect();
    const i = Math.round(((e.clientX - b.left - L) / (w - L - R)) * (days - 1));
    setHover(i >= 0 && i < days ? i : null);
  };
  const labels = placeLabels(front.map(s => ({ s, y: y(s.points[days - 1].v) })), T + 4, H - B - 14);
  const colorOf = s => (compare ? SLOTS[s.slot].color : 'var(--accent)');
  const shapeOf = s => (compare ? SLOTS[s.slot].shape : 'circle');
  const desc = compare
    ? `Daily time over ${days} days for ${front.map(s => s.name).join(', ')}`
    : `Daily time in ${highlight} over ${days} days; other top apps in grey`;
  const tipRows = hover == null ? [] : [...front].sort((a, b) => b.points[hover].v - a.points[hover].v);
  const tipY = hover == null ? 0 : Math.min(...front.map(s => y(s.points[hover].v)));
  return (
    <div className="chart trend" ref={ref} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg width={w} height={H} role="img" aria-label={desc}>
        {ys.ticks.map(t => (
          <g key={t}>
            <line x1={L} x2={w - R} y1={y(t)} y2={y(t)} stroke="var(--grid)" />
            <text className="ax num-t" x={L - 10} y={y(t) + 4} textAnchor="end">{ys.fmt(t)}</text>
          </g>
        ))}
        {front[0].points.map((p, i) => i % step === 0 && <text key={i} className="ax" x={x(i)} y={H - 8} textAnchor="middle">{fmtShort(p.date)}</text>)}
        {grey.map(s => <path key={s.name} d={path(s.points)} fill="none" stroke="var(--muted-line)" strokeWidth="1.5" strokeLinejoin="round" />)}
        {!compare && <path d={`${path(hi.points)}L${x(days - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill="var(--wash)" />}
        {front.map(s => {
          const r = runs(s.points, x, y);
          return (
            <g key={s.name}>
              {r.zero && <path d={r.zero} fill="none" stroke={colorOf(s)} strokeWidth="2" strokeDasharray="2 5" strokeLinecap="round" transform="translate(0,-2)" />}
              <path d={r.solid} fill="none" stroke={colorOf(s)} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          );
        })}
        {labels.map(({ s, y: py, ly }) => (
          <g key={s.name}>
            <Mark shape={shapeOf(s)} x={x(days - 1)} y={py} fill={colorOf(s)} />
            {Math.abs(ly - py) > 3 && <path d={`M${x(days - 1) + 7},${py}L${x(days - 1) + 14},${ly}`} stroke="var(--axis)" fill="none" />}
            <text x={x(days - 1) + 16} y={ly + 4} style={{ fill: 'var(--ink)', fontWeight: 600 }}>{s.name}</text>
            <text className="num-t" x={x(days - 1) + 16} y={ly + 19}>{s.points[days - 1].v ? fmtMin(s.points[days - 1].v) : 'not opened today'}</text>
          </g>
        ))}
        {hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="var(--axis)" />
            {front.map(s => <Mark key={s.name} shape={shapeOf(s)} x={x(hover)} y={y(s.points[hover].v)} r={5} fill={colorOf(s)} />)}
          </g>
        )}
      </svg>
      {hover != null && (
        <ChartTip tip={{
          x: x(hover), y: tipY, body: (
            <>
              {fmtDay(front[0].points[hover].date)}
              {tipRows.map(s => (
                <span key={s.name} className="tip-row">
                  {compare && <Swatch slot={s.slot} />}<span>{s.name}</span><b>{s.points[hover].v ? fmtMin(s.points[hover].v) : 'not opened'}</b>
                </span>
              ))}
            </>
          )
        }} />
      )}
    </div>
  );
}

/* the pen tray: four fixed colours. Filled slots are the legend and the remove buttons; empty slots add an app.
   A fifth pick waits in hand until a colour is free. */
function PenTray({ slots, apps, days, onRemove, onAdd, waiting, cancelWaiting, nudge }) {
  const pickedNames = slots.filter(Boolean);
  const free = apps.filter(a => !pickedNames.includes(a.name));
  const firstEmpty = slots.findIndex(s => !s);
  return (
    <div className="tray-wrap">
      <ul className={`tray${nudge ? ' nudge' : ''}`} aria-label="Apps being compared (legend)">
        {slots.map((name, i) => {
          if (name) {
            const a = apps.find(x => x.name === name);
            const zero = a ? days - a.daysUsed : 0;
            return (
              <li key={i} className="pen on">
                <Swatch slot={i} />
                <span className="pen-text">
                  <span className="pen-name">{name}</span>
                  <span className="pen-note">{!a ? 'not opened in this range' : zero ? `not opened ${zero} of ${days} days` : `${fmtMin(a.v)} in all`}</span>
                </span>
                <button className="icon-btn pen-x" onClick={() => onRemove(name)} aria-label={`Stop comparing ${name}`} title={`Stop comparing ${name}`}>{I.close}</button>
              </li>
            );
          }
          return (
            <li key={i} className="pen empty">
              <Swatch slot={i} />
              {i === firstEmpty ? (
                <label className="pen-add">
                  <span className="sr-only">Add an app to compare</span>
                  <select value="" onChange={e => e.target.value && onAdd(e.target.value)}>
                    <option value="">Add an app…</option>
                    {free.map(a => <option key={a.name} value={a.name}>{a.name} · {fmtMin(a.v)}</option>)}
                  </select>
                  {I.chevronDown}
                </label>
              ) : <span className="pen-free">Free colour</span>}
            </li>
          );
        })}
      </ul>
      {waiting && (
        <div className="msg wait" role="status">
          <span>{I.info}</span>
          <div><b>All four colours are in use.</b> Remove one and <b>{waiting}</b> takes its colour.</div>
          <button className="btn btn-ghost btn-sm" onClick={cancelWaiting}>Don’t add {waiting}</button>
        </div>
      )}
    </div>
  );
}

const Hit = ({ text, q }) => {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
};

const COLS = [
  { key: 'rank', label: '#', cls: 'c-rank r' },
  { key: 'name', label: 'App', cls: 'c-name' },
  { key: 'v', label: 'Time', cls: 'c-time r' },
  { key: 'share', label: 'Share of total', cls: 'c-share' },
  { key: 'change', label: 'vs previous', cls: 'c-chg r' },
  { key: 'daysUsed', label: 'Days used', cls: 'c-days r' }
];

/* every app for the range: searchable, sortable; selecting a row = clicking its bar.
   Sorted by time, a perforation marks where the bars stop and "Other" begins. */
function AllApps({ apps, gone, total, prevTotal, days, range, sel, onSelect, slots, onPick, nextSlot, query, setQuery, sort, setSort, flash, cardRef, bodyRef }) {
  const q = query.trim();
  const rows = apps.filter(a => !q || a.name.toLowerCase().includes(q.toLowerCase()));
  const dir = sort.dir === 'asc' ? 1 : -1;
  const val = (a, k) => (k === 'share' ? a.v : k === 'change' ? (a.prev ? (a.v - a.prev) / a.prev : Infinity) : a[k]);
  rows.sort((a, b) => {
    const A = val(a, sort.key), B = val(b, sort.key);
    if (typeof A === 'string') return A.localeCompare(B) * dir;
    return (A - B) * dir || a.rank - b.rank;
  });
  const showDays = days > 1;
  const perfAfter = !q && sort.key === 'v' && sort.dir === 'desc' && apps.length > 7 ? 7 : null;
  const other = apps.slice(7);
  const otherV = other.reduce((s, a) => s + a.v, 0);
  const sortBy = key => setSort(s => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' || key === 'rank' ? 'asc' : 'desc' }));
  const ariaSort = key => (sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined);
  const lit = key => sort.key === key || (key === 'share' && sort.key === 'v');
  const totalChg = prevTotal ? (total - prevTotal) / prevTotal : 0;
  const cols = COLS.filter(c => showDays || c.key !== 'daysUsed');
  return (
    <section className="card apps-all" ref={cardRef} aria-labelledby="all-title">
      <div className="card-head">
        <div>
          <h2 className="card-title" id="all-title">Every app</h2>
          <p className="card-sub">All {apps.length} apps that were in front, {RANGE_WORD[range]}. Select a row to look inside it; tick a box to compare its daily time below.</p>
        </div>
        <div className="all-tools">
          <label className="search">
            {I.search}
            <span className="sr-only">Search apps</span>
            <input className="input" type="search" placeholder="Search apps" value={query}
                   onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setQuery(''); }} />
          </label>
          <span className="all-count" aria-live="polite">{q ? `${rows.length} of ${apps.length}` : `${apps.length} apps`}</span>
        </div>
      </div>
      <div className="all-body" ref={bodyRef}>
        <table className="all-table">
          <caption className="sr-only">Every app, {RANGE_WORD[range]}, sorted by {COLS.find(c => c.key === sort.key)?.label} {sort.dir === 'asc' ? 'ascending' : 'descending'}</caption>
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c.key} className={c.cls} aria-sort={ariaSort(c.key)} scope="col">
                  <button className={`th-btn${lit(c.key) ? ' on' : ''}`} onClick={() => sortBy(c.key === 'share' ? 'v' : c.key)}>
                    {c.label}
                    <span className="th-ico" aria-hidden="true">{lit(c.key) ? (sort.dir === 'asc' ? I.up : I.down) : I.sort}</span>
                  </button>
                </th>
              ))}
              <th className="c-cmp" scope="col">Compare</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a, idx) => {
              const slot = slots.indexOf(a.name);
              const isSel = a.name === sel;
              const chg = a.prev ? (a.v - a.prev) / a.prev : null;
              const rowsOut = [];
              rowsOut.push(
                <tr key={a.name} className={`${isSel ? 'sel' : ''}${flash && a.rank > 7 ? ' flash' : ''}`} onClick={() => onSelect(a.name)}>
                  <td className="c-rank r num">{a.rank}</td>
                  <td className="c-name">
                    <button className="row-btn" aria-pressed={isSel} onClick={e => { e.stopPropagation(); onSelect(a.name); }}>
                      <Hit text={a.name} q={q} />
                    </button>
                    {a.first && a.prev === 0 && <span className="tag">New</span>}
                  </td>
                  <td className="c-time r num">{fmtMin(a.v)}</td>
                  <td className="c-share">
                    <span className="share">
                      <span className="share-track"><i style={{ width: `${Math.max(1.5, (a.v / apps[0].v) * 100)}%` }} /></span>
                      <span className="num share-n">{pct(a.v, total)}</span>
                    </span>
                  </td>
                  <td className="c-chg r">
                    {chg == null ? <span className="chg new">New</span> : (
                      <span className="chg" title={`${fmtMin(a.prev)} ${PREV_WORD[range]}`}>
                        {Math.abs(chg) < 0.005 ? <span className="flat">same</span> : (
                          <>{chg > 0 ? I.up : I.down}<span className="sr-only">{chg > 0 ? 'up' : 'down'}</span><span className="num">{Math.round(Math.abs(chg) * 100)}%</span></>
                        )}
                      </span>
                    )}
                  </td>
                  {showDays && (
                    <td className="c-days r">
                      <span className={`num${a.daysUsed < days ? ' part' : ''}`}>{a.daysUsed}</span><span className="of"> of {days}</span>
                    </td>
                  )}
                  <td className="c-cmp" onClick={e => e.stopPropagation()}>
                    <span className="cmp">
                      <SpringCheck label="" ariaLabel={`Compare ${a.name}`} checked={slot >= 0} onChange={() => onPick(a.name)}
                                   color="var(--ink-3)" fillColor={slot >= 0 ? SLOTS[slot].color : nextSlot >= 0 ? SLOTS[nextSlot].color : 'var(--ink-3)'}
                                   checkColor="#0B1118" boxSize={18} boxRadius={5} fontSize={13} strike="none" doneOpacity={1} />
                      {slot >= 0 && <Swatch slot={slot} />}
                    </span>
                  </td>
                </tr>
              );
              if (perfAfter && idx === perfAfter - 1) {
                rowsOut.push(
                  <tr key="perf" className="perf" tabIndex={-1} id="perf">
                    <td colSpan={cols.length + 1}>
                      <span className="perf-in">
                        <span className="perf-line" aria-hidden="true" />
                        <span className="perf-text">Above: the 7 bars. Below: “Other” on the chart, <b>{other.length} apps</b>, <b className="num">{fmtMin(otherV)}</b></span>
                        <span className="perf-line" aria-hidden="true" />
                      </span>
                    </td>
                  </tr>
                );
              }
              return rowsOut;
            })}
            {!rows.length && (
              <tr className="none"><td colSpan={cols.length + 1}>
                No app called “{q}” was in front {RANGE_WORD[range] === 'today' ? 'today' : `in the ${RANGE_WORD[range]}`}.
                <button className="btn btn-ghost btn-sm" onClick={() => setQuery('')}>Clear search</button>
              </td></tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="c-rank" />
              <td className="c-name">All {apps.length} apps</td>
              <td className="c-time r num">{fmtMin(total)}</td>
              <td className="c-share"><span className="num share-n">100%</span></td>
              <td className="c-chg r"><span className="chg" title={`${fmtMin(prevTotal)} ${PREV_WORD[range]}`}>{totalChg > 0 ? I.up : I.down}<span className="sr-only">{totalChg > 0 ? 'up' : 'down'}</span><span className="num">{Math.round(Math.abs(totalChg) * 100)}%</span></span></td>
              {showDays && <td className="c-days" />}
              <td className="c-cmp" />
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="all-foot">
        “vs previous” compares with {PREV_WORD[range]}; arrows show direction only, more time is not good or bad.
        {gone.length ? <> Not opened {range === 'today' ? 'today' : 'in this range'}: {gone.map((g, i) => <span key={g.name}>{i ? ', ' : ''}<b>{g.name}</b> ({fmtMin(g.prev)} {PREV_WORD[range]})</span>)}.</> : null}
      </p>
    </section>
  );
}

function AppsData({ ctx, range }) {
  const k = SCALE[range];
  const days = RANGE_DAYS[range];
  // every app's days for this range, its total, how many days it was opened; apps with no time drop to the footnote
  const apps = useMemo(() => APPS.map((a, i) => {
    const points = dailyFor(a, i, days, k);
    const v = points.reduce((s, p) => s + p.v, 0);
    return { ...a, points, v, prev: a.prev * k, daysUsed: points.filter(p => p.v > 0).length };
  }).filter(a => a.v > 0).sort((a, b) => b.v - a.v).map((a, i) => ({ ...a, rank: i + 1 })), [range]);
  const gone = useMemo(() => [...APPS.filter(a => !apps.some(x => x.name === a.name)), ...GONE].map(g => ({ name: g.name, prev: g.prev * k })), [range]);
  const total = apps.reduce((s, a) => s + a.v, 0);
  const prevTotal = APPS.reduce((s, a) => s + a.prev * k, 0) + GONE.reduce((s, g) => s + g.prev * k, 0);
  const [sel, setSel] = useState('Google Chrome');
  const [wheelKey, setWheelKey] = useState(0);
  const [table, setTable] = useState(false);
  // compare state in one object, updated from a ref so quick successive clicks never read a stale copy
  const [cmp, setCmp] = useState(() => {
    const s = (QS.get('compare') || '').split(',').slice(0, 4);
    return { mode: QS.get('compare') ? 'compare' : 'one', slots: [0, 1, 2, 3].map(i => s[i] || null), waiting: QS.get('waiting') || null };
  });
  const cmpRef = useRef(cmp);
  const put = next => { cmpRef.current = next; setCmp(next); };
  const { mode, slots, waiting } = cmp;
  const [nudge, setNudge] = useState(false);
  const [query, setQuery] = useState(QS.get('q') || '');
  const [sort, setSort] = useState({ key: 'v', dir: 'desc' });
  const [flash, setFlash] = useState(false);
  const cardRef = useRef(null), bodyRef = useRef(null);
  const known = n => apps.find(a => a.name === n);
  const pick = n => { setSel(n); setWheelKey(x => x + 1); };
  const wheelItems = apps.map(a => a.name);

  // compare picks: a pick keeps its colour for as long as it is picked; a new pick takes the lowest free colour
  const nextSlot = slots.findIndex(s => !s);
  const remove = n => {
    const c = cmpRef.current;
    const at = c.slots.indexOf(n);
    if (at < 0) return;
    const next = c.slots.map(s => (s === n ? null : s));
    if (c.waiting) { next[at] = c.waiting; ctx.say(`${c.waiting} added`, `It took ${n}’s colour.`, { icon: I.ok }); }
    put({ ...c, slots: next, waiting: null });
  };
  const add = n => {
    const c = cmpRef.current;
    if (c.slots.includes(n)) return;
    const free = c.slots.findIndex(s => !s);
    if (free < 0) {
      put({ ...c, waiting: n }); setNudge(true); setTimeout(() => setNudge(false), 700);
      return;
    }
    put({ ...c, slots: c.slots.map((s, i) => (i === free ? n : s)) });
  };
  const togglePick = n => {
    const c = cmpRef.current;
    if (c.slots.includes(n)) { remove(n); return; }
    if (c.mode !== 'compare') {
      // first tick from the list: compare it with the app you are looking at
      if (!c.slots.some(Boolean)) { put({ ...c, mode: 'compare', slots: n === sel ? [n, null, null, null] : [sel, n, null, null] }); return; }
      put({ ...c, mode: 'compare' });
    }
    add(n);
  };
  const setMode = m => put({ ...cmpRef.current, mode: m });
  const toCompare = () => {
    const c = cmpRef.current;
    put({ ...c, mode: 'compare', slots: c.slots.some(Boolean) ? c.slots : [sel, null, null, null] });
  };
  const cancelWaiting = () => put({ ...cmpRef.current, waiting: null });

  // "Other" opens the full list at the perforation
  const showOther = () => {
    setQuery(''); setSort({ key: 'v', dir: 'desc' });
    cardRef.current?.scrollIntoView({ behavior: ctx.reduced ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => {
      const perf = bodyRef.current?.querySelector('#perf');
      if (perf) { bodyRef.current.scrollTop = perf.offsetTop - 44; perf.focus({ preventScroll: true }); }
      setFlash(true); setTimeout(() => setFlash(false), 1600);
    }, ctx.reduced ? 0 : 450);
  };

  const top = apps.slice(0, 7);
  const rest = apps.slice(7);
  const selApp = known(sel);
  const selInOther = selApp && selApp.rank > 7 ? { name: sel, v: selApp.v } : null;
  const barRows = [...top.map(a => ({ name: a.name, v: a.v })),
    ...(rest.length ? [{ name: 'Other', v: rest.reduce((s, a) => s + a.v, 0), other: true, count: rest.length, selPart: selInOther }] : [])];
  const sites = SITES7[sel]?.map(([n, v]) => ({ name: n, v: v * k, other: n.startsWith('Other') }));
  const perDay = total / days;

  // trend lines: highlight = the selected app + the other top apps in grey; compare = the picks, in slot order
  const lineOf = a => ({ name: a.name, points: a.points });
  const empty = Array.from({ length: days }, (_, i) => ({ date: daysAgo(days - 1 - i), v: 0 }));
  const oneLines = [...(selApp ? [lineOf(selApp)] : []), ...top.filter(a => a.name !== sel).map(lineOf)];
  const cmpLines = slots.map((n, i) => (n ? { name: n, slot: i, points: known(n)?.points ?? empty } : null)).filter(Boolean);
  const comparing = mode === 'compare' && cmpLines.length > 0;
  const tableLines = comparing ? cmpLines : oneLines;

  return (
    <>
      <section className="apps-top">
        <div className="card apps-bars">
          <div className="card-head">
            <div>
              <h2 className="card-title">Time per app</h2>
              <p className="card-sub">Top 7 apps and the rest, {RANGE_WORD[range]}. Select an app to look inside it.</p>
            </div>
          </div>
          <div className="total" aria-label={`${fmtMin(total)} in total`}>
            <span className="total-n" aria-hidden="true">
              <Counter value={Math.floor(Math.round(total) / 60)} fontSize={44} fontWeight={600} intro={!ctx.reduced} />
              <span className="unit">h</span>
              <Counter value={Math.round(total) % 60} minDigits={2} fontSize={44} fontWeight={600} intro={!ctx.reduced} />
              <span className="unit">min</span>
            </span>
            <span className="total-sub">in front of you, {RANGE_WORD[range]}{days > 1 ? <> · {fmtMin(perDay)} a day</> : null}</span>
          </div>
          <HBars rows={barRows} selected={sel} onSelect={pick} onOther={showOther} label="Time per app" />
        </div>

        <div className="card apps-inside">
          <div className="card-head">
            <div>
              <h2 className="card-title">Inside {sel}</h2>
              <p className="card-sub">Scroll or drag the wheel to pick any of the {apps.length} apps</p>
            </div>
          </div>
          <div className="inside-grid">
            <div className="wheel" aria-label="Pick an app">
              <OptionWheel key={`${wheelKey}-${range}`} items={wheelItems} defaultSelected={Math.max(0, wheelItems.indexOf(sel))}
                           onChange={(i, label) => setSel(label)} textColor={ctx.dark ? '#5C6878' : '#A3AAB8'}
                           activeColor={ctx.dark ? '#E6EBF2' : '#1D2330'} fontSize={1.2} spacing={1.7} curve={1}
                           tilt={4} blur={ctx.reduced ? 0 : 1.2} fade={0.3} inset={18} />
            </div>
            <div className="inside-body">
              {sites ? (
                <HBars rows={sites} label={`Sites inside ${sel}`} />
              ) : (
                <div className="no-sites">
                  {selApp ? (
                    <p><b>{sel}</b> was in front for <b className="num">{fmtMin(selApp.v)}</b> {RANGE_WORD[range]}
                      {days > 1 ? <>, on <b className="num">{selApp.daysUsed}</b> of {days} days</> : null}. That is {pct(selApp.v, total)} of your time{selApp.rank > 7 ? <>, inside “Other” on the chart (rank {selApp.rank})</> : null}.</p>
                  ) : <p><b>{sel}</b> was not opened {RANGE_WORD[range]}.</p>}
                  <p className="dim">Time per site is recorded for browsers only, from the tab title. Pick Google Chrome to see its sites.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <AllApps apps={apps} gone={gone} total={total} prevTotal={prevTotal} days={days} range={range} sel={sel} onSelect={pick}
               slots={slots} onPick={togglePick} nextSlot={nextSlot} query={query} setQuery={setQuery} sort={sort} setSort={setSort}
               flash={flash} cardRef={cardRef} bodyRef={bodyRef} />

      <section className="card apps-trend">
        <div className="card-head">
          <div>
            <h2 className="card-title">{comparing ? `Comparing ${cmpLines.length} app${cmpLines.length > 1 ? 's' : ''}` : `Daily time in ${sel}`}</h2>
            <p className="card-sub">{comparing ? 'Daily time, each app in its own colour and marker. Up to four at once.' : 'How one app’s time changed; the other top apps are grey for comparison'}</p>
          </div>
          {days >= 7 && (
            <div className="trend-tools">
              <div className="seg seg-sm" role="group" aria-label="Lines">
                <button aria-pressed={mode === 'one'} onClick={() => setMode('one')}>Highlight one</button>
                <button aria-pressed={mode === 'compare'} onClick={toCompare}>Compare up to 4</button>
              </div>
              <ViewToggle table={table} setTable={setTable} />
            </div>
          )}
        </div>
        {days < 7 ? (
          <p className="trend-short">A trend needs at least a week. Pick 7 days or more above.</p>
        ) : (
          <>
            {mode === 'compare' ? (
              <PenTray slots={slots} apps={apps} days={days} onRemove={remove} onAdd={add} waiting={waiting}
                       cancelWaiting={cancelWaiting} nudge={nudge && !ctx.reduced} />
            ) : (
              <div className="legend trend-legend"><span><i className="line" style={{ background: 'var(--accent)' }} />{sel}</span><span><i className="line" style={{ background: 'var(--muted-line)' }} />Other top apps</span></div>
            )}
            {mode === 'compare' && !comparing ? (
              <p className="trend-short">Nothing to compare yet. Add an app above, or tick apps in the list.</p>
            ) : table ? (
              <div className="trend-table">
                <table className="dtable">
                  <thead><tr><th>Date</th>{tableLines.map(s => <th key={s.name} className="r">{s.name}</th>)}</tr></thead>
                  <tbody>{tableLines[0].points.map((p, i) => (
                    <tr key={i}><td>{fmtDay(p.date)}</td>{tableLines.map(s => <td key={s.name} className={`r num${!comparing && s.name === sel ? ' strong' : ''}${s.points[i].v ? '' : ' zero'}`}>{s.points[i].v ? fmtMin(s.points[i].v) : '–'}</td>)}</tr>
                  ))}</tbody>
                </table>
              </div>
            ) : (
              <TrendChart lines={comparing ? cmpLines : oneLines} mode={comparing ? 'compare' : 'one'} highlight={sel} />
            )}
            {!table && (comparing ? cmpLines : selApp ? [selApp] : []).some(s => s.points.some(p => p.v === 0)) && (
              <p className="trend-note"><svg width="26" height="6" aria-hidden="true"><path d="M2 3H24" stroke="var(--ink-3)" strokeWidth="2" strokeDasharray="2 5" strokeLinecap="round" /></svg>
                Dotted along the bottom = the app was not opened those days (0 min), not missing data.</p>
            )}
          </>
        )}
      </section>
    </>
  );
}

function AppsLoading({ ctx }) {
  return (
    <>
      <section className="apps-top">
        <div className="card apps-bars">
          <div className="card-head"><div><h2 className="card-title">Time per app</h2><LoadingNote what="app time" mode={ctx.mode} /></div></div>
          <div className="total"><Skel w={220} h={44} r={8} /></div>
          <ul className="skel-bars">{[92, 84, 40, 31, 22, 14, 10, 27].map((v, i) => <li key={i}><Skel w={110} /><Skel w={`${v * 0.6}%`} h={20} r={4} /></li>)}</ul>
        </div>
        <div className="card apps-inside">
          <div className="card-head"><div><h2 className="card-title">Inside an app</h2></div></div>
          <ul className="skel-bars">{[80, 44, 26, 20, 14].map((v, i) => <li key={i}><Skel w={110} /><Skel w={`${v * 0.6}%`} h={20} r={4} /></li>)}</ul>
        </div>
      </section>
      <section className="card apps-all">
        <div className="card-head"><div><h2 className="card-title">Every app</h2></div></div>
        <ul className="skel-rows">{[0, 1, 2, 3, 4].map(i => <li key={i}><Skel w={18} /><Skel w={140} /><Skel w={80} /><Skel w="60%" h={8} /><Skel w={50} /></li>)}</ul>
      </section>
    </>
  );
}

function Apps(ctx) {
  const { state, dark } = ctx;
  const [range, setRange] = useState(QS.get('range') || '7');
  return (
    <>
      <PageHead title="App usage" art={<h2 className="phead-h">App usage</h2>}
                sub="Which app was in front, for how long, and which sites you spent it on.">
        <DateRange value={range} onChange={setRange} dark={dark} disabled={state !== 'data'} />
      </PageHead>
      {state === 'data' && <AppsData ctx={ctx} range={range} />}
      {state === 'loading' && <AppsLoading ctx={ctx} />}
      {state === 'waking' && <WakingPanel ctx={ctx} since={ctx.review.since} what="Your app time" />}
      {state === 'error' && <ErrorPanel ctx={ctx} what="app usage" endpoint="GET /v1/analytics/apps?start=2026-10-11&end=2026-10-17" />}
      {state === 'empty' && (
        <EmptyPanel ctx={ctx} title="No app time recorded yet"
          body="Once the agent runs on your laptop, it notes which app is in front every few seconds and adds it up per day. The first numbers arrive with the first sync."
          action={<button className="btn btn-primary" onClick={() => goPage('devices', ctx.choice)}>{I.devices} Connect your laptop</button>}>
          <div className="ghost-bars" aria-hidden="true">
            {['VS Code', 'Google Chrome', 'Windows Terminal', 'Spotify'].map((n, i) => (
              <div key={n} className="ghost-bar"><span>{n}</span><i style={{ width: `${70 - i * 15}%` }} /></div>
            ))}
            <p className="ghost-note">Example of what you’ll see</p>
          </div>
        </EmptyPanel>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Shell page="apps" render={ctx => <Apps {...ctx} />} />);
