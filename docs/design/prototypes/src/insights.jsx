/* ================= Insights: the long view ================= */

const RANGE_N = { today: 1, 7: 7, 30: 30, 90: 90, custom: 47 };
const LAT_STAGES = [['silence', 'Waiting for silence', '--c1'], ['stt', 'Speech to text', '--c2'], ['action', 'Action', '--c3'], ['other', 'Matching + feedback', '--c4']];

const makeDaily = n => {
  const rand = mulberry32(77);
  return YEAR.slice(-n).map((d, i) => ({
    date: d.date, count: d.count,
    rate: d.count ? Math.min(99, 84 + i * (8 / n) + rand() * 6) : null,
    silence: 690 + rand() * 40, stt: 420 - i * (90 / n) + rand() * 60, action: 120 + rand() * 70, other: 48 + rand() * 12
  }));
};
const yearStats = () => {
  const active = YEAR.filter(d => d.count > 0).length;
  let best = 0, run = 0;
  YEAR.forEach(d => { run = d.count ? run + 1 : 0; best = Math.max(best, run); });
  const busiest = YEAR.reduce((a, d) => (d.count > a.count ? d : a));
  return { active, best, busiest, total: YEAR.reduce((a, d) => a + d.count, 0) };
};
const FAILED = [
  { said: 'open the notes thing', n: 9, last: 'Today 13:41', near: 'core.open', conf: 0.52 },
  { said: 'what time is it', n: 7, last: 'Today 12:26', near: 'none', conf: 0 },
  { said: 'mute', n: 5, last: 'Yesterday 22:04', near: 'media.pause', conf: 0.41 },
  { said: 'go back', n: 4, last: 'Thu 16:30', near: 'browser.close_tab', conf: 0.38 },
  { said: 'scroll down', n: 3, last: 'Wed 11:12', near: 'none', conf: 0 },
  { said: 'open my calendar', n: 2, last: 'Tue 09:05', near: 'core.open', conf: 0.66 }
];

/* one-series line: one hue, area wash, crosshair + tooltip */
function MiniLine({ data, get, fmt, yMax, yMin = 0, unit, label, height = 230, nt = 4 }) {
  const ref = useRef(null);
  const [w, setW] = useState(560);
  const [hover, setHover] = useState(null);
  useEffect(() => { const ro = new ResizeObserver(([e]) => setW(e.contentRect.width)); ro.observe(ref.current); return () => ro.disconnect(); }, []);
  const L = 40, R = 14, T = 10, B = 26, H = height;
  const pts = data.map((d, i) => ({ i, d, v: get(d) })).filter(p => p.v != null);
  const x = i => L + (i / Math.max(1, data.length - 1)) * (w - L - R);
  const y = v => T + (1 - (v - yMin) / (yMax - yMin)) * (H - T - B);
  const line = pts.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
  const step = Math.ceil(data.length / 6);
  const last = pts[pts.length - 1];
  return (
    <div className="chart" ref={ref} onMouseLeave={() => setHover(null)}
         onMouseMove={e => { const b = ref.current.getBoundingClientRect(); const i = Math.round(((e.clientX - b.left - L) / (w - L - R)) * (data.length - 1)); setHover(pts.find(p => p.i === i) || null); }}>
      <svg width={w} height={H} role="img" aria-label={label}>
        {ticks(yMax - yMin, nt).map(t => (
          <g key={t}><line x1={L} x2={w - R} y1={y(yMin + t)} y2={y(yMin + t)} stroke="var(--grid)" />
            <text className="ax num-t" x={L - 8} y={y(yMin + t) + 4} textAnchor="end">{Math.round(yMin + t)}{unit}</text></g>
        ))}
        {data.map((d, i) => i % step === 0 && <text key={i} className="ax" x={x(i)} y={H - 6} textAnchor="middle">{fmtShort(d.date)}</text>)}
        <path d={`${line}L${x(last.i)},${y(yMin)}L${x(pts[0].i)},${y(yMin)}Z`} fill="var(--wash)" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(last.i)} cy={y(last.v)} r="4.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
        {hover && <><line x1={x(hover.i)} x2={x(hover.i)} y1={T} y2={H - B} stroke="var(--axis)" />
          <circle cx={x(hover.i)} cy={y(hover.v)} r="5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" /></>}
      </svg>
      {hover && <ChartTip tip={{ x: x(hover.i), y: y(hover.v), body: <>{fmtDay(hover.d.date)}<br /><b>{fmt(hover.v)}</b></> }} />}
    </div>
  );
}

/* latency: stacked bars per day, 4 categorical stages, 2px gaps, 1.5 s budget line, legend + direct labels on the last bar */
function LatencyBars({ data }) {
  const ref = useRef(null);
  const [w, setW] = useState(560);
  const [hover, setHover] = useState(null);
  useEffect(() => { const ro = new ResizeObserver(([e]) => setW(e.contentRect.width)); ro.observe(ref.current); return () => ro.disconnect(); }, []);
  const days = data.slice(-14);
  const L = 40, R = 120, T = 12, B = 26, H = 210, max = 2000;
  const slot = (w - L - R) / days.length;
  const bw = Math.min(24, slot * 0.62);
  const y = v => T + (1 - v / max) * (H - T - B);
  const lastX = L + (days.length - 1) * slot + slot / 2;
  let acc = 0;
  const lastSegs = LAT_STAGES.map(([k, l]) => { const v = days[days.length - 1][k]; const mid = acc + v / 2; acc += v; return { l, v, mid }; }).filter(sg => (sg.v / max) * (H - T - B) >= 16);
  return (
    <div className="chart" ref={ref} onMouseLeave={() => setHover(null)}>
      <svg width={w} height={H} role="img" aria-label="Response time per day, split into four stages, against the 1.5 second budget">
        {[0, 500, 1000, 1500, 2000].map(t => (
          <g key={t}><line x1={L} x2={w - R} y1={y(t)} y2={y(t)} stroke="var(--grid)" />
            <text className="ax num-t" x={L - 8} y={y(t) + 4} textAnchor="end">{(t / 1000).toFixed(1)} s</text></g>
        ))}
        {days.map((d, i) => {
          let base = 0;
          const cx = L + i * slot + slot / 2;
          return (
            <g key={i} onMouseEnter={() => setHover({ i, d, x: cx })}>
              <rect x={cx - slot / 2} y={T} width={slot} height={H - T - B} fill="transparent" />
              {LAT_STAGES.map(([k, , c], si) => {
                const v = d[k]; const y0 = y(base); const y1 = y(base + v); base += v;
                const top = si === LAT_STAGES.length - 1;
                return <rect key={k} x={cx - bw / 2} y={y1 + (top ? 0 : 1)} width={bw} height={Math.max(1, y0 - y1 - (si === 0 ? 0 : 1) - (top ? 0 : 1))} rx={top ? 4 : 0} style={{ fill: `var(${c})` }} opacity={hover && hover.i !== i ? 0.55 : 1} />;
              })}
              {i % 3 === 1 && <text className="ax" x={cx} y={H - 6} textAnchor="middle">{fmtShort(d.date)}</text>}
            </g>
          );
        })}
        <line x1={L} x2={w - R + 8} y1={y(1500)} y2={y(1500)} stroke="var(--ink-2)" strokeWidth="1.5" />
        <text x={w - R + 12} y={y(1500) + 4} style={{ fill: 'var(--ink)', fontWeight: 600 }}>1.5 s budget</text>
        {lastSegs.map(s => <text key={s.l} x={lastX + bw / 2 + 8} y={y(s.mid) + 4} className="num-t" style={{ fontSize: 11 }}>{Math.round(s.v)} ms</text>)}
      </svg>
      {hover && <ChartTip tip={{ x: hover.x, y: y(LAT_STAGES.reduce((a, [k]) => a + hover.d[k], 0)), body: <>{fmtDay(hover.d.date)}<br />{LAT_STAGES.map(([k, l]) => <span key={k}>{l} <b>{Math.round(hover.d[k])} ms</b><br /></span>)}Total <b>{(LAT_STAGES.reduce((a, [k]) => a + hover.d[k], 0) / 1000).toFixed(2)} s</b></> }} />}
    </div>
  );
}

/* calibration: two small histograms (right / wrong) of match confidence, threshold marked */
const binsFor = (seed, n, mean, sd) => {
  const rand = mulberry32(seed); const b = Array(10).fill(0);
  for (let i = 0; i < n; i++) { const v = Math.min(0.999, Math.max(0.5, mean + (rand() + rand() + rand() - 1.5) * sd)); b[Math.floor((v - 0.5) / 0.05)]++; }
  return b;
};
const CAL = { right: binsFor(5, 520, 0.92, 0.09), wrong: binsFor(6, 46, 0.71, 0.14) };
function Histo({ bins, color, title, n }) {
  const W = 262, H = 176, L = 18, B = 22, T = 26, RP = 14;
  const max = Math.max(...bins);
  const bw = (W - L - RP) / bins.length;
  const [hover, setHover] = useState(null);
  const tx = L + ((0.8 - 0.5) / 0.5) * (W - L - RP);
  return (
    <figure className="histo chart" onMouseLeave={() => setHover(null)}>
      <figcaption><i style={{ background: `var(${color})` }} />{title} <span className="num">({n})</span></figcaption>
      <svg width={W} height={H} role="img" aria-label={`${title}: match confidence spread, threshold 0.80`}>
        <line x1={L} x2={W - RP} y1={H - B} y2={H - B} stroke="var(--axis)" />
        {bins.map((v, i) => {
          const h = (v / max) * (H - B - T);
          return <rect key={i} x={L + i * bw + 1} y={H - B - h} width={bw - 2} height={h} rx="3" style={{ fill: `var(${color})` }}
                       opacity={hover != null && hover !== i ? 0.55 : 1} onMouseEnter={() => setHover(i)} />;
        })}
        <line x1={tx} x2={tx} y1={T - 8} y2={H - B} stroke="var(--ink)" strokeWidth="1.5" />
        <text x={tx} y={11} textAnchor="middle" className="num-t" style={{ fill: 'var(--ink)', fontSize: 11 }}>threshold 0.80</text>
        {[0.5, 0.75, 1].map(t => <text key={t} className="ax num-t" x={L + ((t - 0.5) / 0.5) * (W - L - RP)} y={H - 6} textAnchor="middle">{t.toFixed(2)}</text>)}
      </svg>
      {hover != null && <ChartTip tip={{ x: L + hover * bw + bw / 2, y: H - B - (bins[hover] / max) * (H - B - T), body: <>Confidence {(0.5 + hover * 0.05).toFixed(2)}–{(0.55 + hover * 0.05).toFixed(2)}<br /><b>{bins[hover]}</b> guesses</> }} />}
    </figure>
  );
}

/* a one-line takeaway per tile: React Bits BlurText, plays once when the tile scrolls into view */
const Takeaway = ({ text, reduced }) => (
  <p className="takeaway" aria-label={text}>
    {reduced ? text : <BlurText text={text} delay={60} animateBy="words" direction="top" stepDuration={0.3} blur={8} distance={10} />}
  </p>
);

function Tile({ title, sub, takeaway, reduced, tools, children }) {
  return (
    <div className="tile">
      <div className="tile-head">
        <div><h2 className="card-title">{title}</h2>{sub && <p className="card-sub">{sub}</p>}</div>
        {tools}
      </div>
      {takeaway && <Takeaway text={takeaway} reduced={reduced} />}
      <div className="tile-body">{children}</div>
    </div>
  );
}

function TableOr({ table, rows, cols, children }) {
  if (!table) return children;
  return (
    <div className="tile-table"><table className="dtable"><thead><tr>{cols.map(c => <th key={c} className={c === cols[0] ? '' : 'r'}>{c}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j} className={j ? 'r num' : ''}>{v}</td>)}</tr>)}</tbody></table></div>
  );
}

function InsightsData({ ctx, range }) {
  const n = Math.max(7, RANGE_N[range]);
  const data = useMemo(() => makeDaily(n), [n]);
  const ys = useMemo(yearStats, []);
  const [tables, setTables] = useState({});
  const tog = k => <ViewToggle table={!!tables[k]} setTable={v => setTables({ ...tables, [k]: v })} />;
  const half = Math.floor(n / 2);
  const a = data.slice(0, half).reduce((s, d) => s + d.count, 0), b = data.slice(half).reduce((s, d) => s + d.count, 0);
  const change = Math.round(((b - a) / Math.max(1, a)) * 100);
  const rates = data.filter(d => d.rate != null);
  const avgRate = rates.reduce((s, d) => s + d.rate, 0) / rates.length;
  const cmdMax = niceMax(Math.max(...data.map(d => d.count)));
  const items = [
    { id: 'cal', colSpan: 4, rowSpan: 2, content: (
      <Tile title="Activity calendar" sub="Commands per day, last 53 weeks" reduced={ctx.reduced}
            takeaway={`You talked to your laptop on ${ys.active} of the last 371 days.`}>
        <div className="cal-row">
          <div className="cal-wrap"><CalendarHeatmap days={YEAR} mode={ctx.mode} /></div>
          <dl className="cal-stats">
            <div><dt>Commands this year</dt><dd className="num">{ys.total.toLocaleString()}</dd></div>
            <div><dt>Longest streak</dt><dd className="num">{ys.best} days</dd></div>
            <div><dt>Current streak</dt><dd className="num">23 days</dd></div>
            <div><dt>Busiest day</dt><dd>{fmtShort(ys.busiest.date)} · <span className="num">{ys.busiest.count}</span></dd></div>
          </dl>
        </div>
      </Tile>) },
    { id: 'use', colSpan: 2, rowSpan: 2, content: (
      <Tile title="Commands per day" sub={`Last ${n} days`} tools={tog('use')} reduced={ctx.reduced}
            takeaway={`${Math.abs(change)}% ${change >= 0 ? 'more' : 'fewer'} commands in the second half of this range than the first.`}>
        <TableOr table={tables.use} cols={['Date', 'Commands']} rows={data.map(d => [fmtDay(d.date), d.count])}>
          <MiniLine data={data} get={d => d.count} yMax={cmdMax} fmt={v => `${v} commands`} unit="" label={`Commands per day over the last ${n} days`} />
        </TableOr>
      </Tile>) },
    { id: 'rate', colSpan: 2, rowSpan: 2, content: (
      <Tile title="Understood correctly" sub="Share of commands that ran without a mistake, per day" tools={tog('rate')} reduced={ctx.reduced}
            takeaway={`On average ${avgRate.toFixed(1)}% understood, and it is climbing.`}>
        <TableOr table={tables.rate} cols={['Date', 'Success rate']} rows={rates.map(d => [fmtDay(d.date), `${d.rate.toFixed(1)}%`])}>
          <MiniLine data={data} get={d => d.rate} yMin={70} yMax={100} nt={3} fmt={v => `${v.toFixed(1)}% understood`} unit="%" label="Success rate per day" />
        </TableOr>
      </Tile>) },
    { id: 'lat', colSpan: 2, rowSpan: 2, content: (
      <Tile title="Where the 1.5 s goes" sub="Median time per stage, last 14 days" tools={tog('lat')} reduced={ctx.reduced}
            takeaway="Waiting for silence is now the biggest stage.">
        <div className="legend tile-legend">{LAT_STAGES.map(([k, l, c]) => <span key={k}><i style={{ background: `var(${c})` }} />{l}</span>)}</div>
        <TableOr table={tables.lat} cols={['Date', ...LAT_STAGES.map(s => s[1])]} rows={data.slice(-14).map(d => [fmtDay(d.date), ...LAT_STAGES.map(([k]) => `${Math.round(d[k])} ms`)])}>
          <LatencyBars data={data} />
        </TableOr>
      </Tile>) },
    { id: 'cal2', colSpan: 2, rowSpan: 2, content: (
      <Tile title="Are low scores the wrong guesses?" sub="Match confidence of guesses you marked right or wrong" tools={tog('cal2')} reduced={ctx.reduced}
            takeaway="Most wrong guesses score below 0.80: the threshold holds.">
        <TableOr table={tables.cal2} cols={['Confidence', 'Right', 'Wrong']} rows={CAL.right.map((v, i) => [`${(0.5 + i * 0.05).toFixed(2)}–${(0.55 + i * 0.05).toFixed(2)}`, v, CAL.wrong[i]])}>
          <div className="histos">
            <Histo bins={CAL.right} color="--c1" title="Marked right" n={520} />
            <Histo bins={CAL.wrong} color="--c2" title="Marked wrong" n={46} />
          </div>
        </TableOr>
      </Tile>) },
    { id: 'failed', colSpan: 4, rowSpan: 2, content: (
      <Tile title="Sentences that didn’t match" sub={`Last ${n} days, most frequent first. These are your best ideas for new commands.`} reduced={ctx.reduced}
            takeaway="“open the notes thing” failed 9 times: worth a command of its own.">
        <table className="dtable failed">
          <thead><tr><th>You said</th><th className="r">Times</th><th>Last heard</th><th>Closest command</th><th><span className="sr-only">Action</span></th></tr></thead>
          <tbody>{FAILED.slice(0, 5).map(f => (
            <tr key={f.said}>
              <td className="said">“{f.said}”</td><td className="r num">{f.n}</td><td>{f.last}</td>
              <td>{f.near === 'none' ? <span className="dim">none close</span> : <><code>{f.near}</code> <span className="dim num">{Math.round(f.conf * 100)}%</span></>}</td>
              <td className="r"><button className="btn btn-ghost" onClick={() => goPage('commands', ctx.choice)}>{I.plus} Make it a command</button></td>
            </tr>
          ))}</tbody>
        </table>
      </Tile>) }
  ];
  return (
    <MagicBento items={items} columns={4} rowHeight={190} gap={20} radius={ctx.dark ? 8 : 12} theme={ctx.mode}
                glowColor={ctx.accent} enableBorderGlow enableSpotlight={!ctx.reduced} spotlightRadius={360} enableStars={false}
                enableTilt={false} enableMagnetism={false} clickEffect={false} intro={!ctx.reduced} textAutoHide={false} />
  );
}

function InsightsLoading({ ctx }) {
  return (
    <div className="ins-skel">
      <div className="card wide"><LoadingNote what="insights" mode={ctx.mode} /><Skel w="62%" h={110} r={8} /></div>
      {[0, 1, 2, 3].map(i => <div key={i} className="card"><Skel w={160} /><Skel w="70%" h={12} /><Skel w="100%" h={170} r={8} /></div>)}
    </div>
  );
}

function Insights(ctx) {
  const { state, dark } = ctx;
  const [range, setRange] = useState('30');
  return (
    <>
      <PageHead title="Insights" art={<h2 className="phead-h">Insights</h2>}
                sub="The long view: how much you use Listen, how well it understands you, and what to teach it next.">
        <DateRange value={range} onChange={setRange} dark={dark} disabled={state !== 'data'} />
      </PageHead>
      {state === 'data' && <InsightsData ctx={ctx} range={range} />}
      {state === 'loading' && <InsightsLoading ctx={ctx} />}
      {state === 'waking' && <WakingPanel ctx={ctx} since={ctx.review.since} what="Your insights" />}
      {state === 'error' && <ErrorPanel ctx={ctx} what="your insights" endpoint="GET /v1/analytics/calendar?year=2026" />}
      {state === 'empty' && (
        <EmptyPanel ctx={ctx} title="Insights need a few days of data"
          body="Trends, the response-time breakdown and the calibration charts appear after about a week of use. Day 0 of 7 so far."
          action={<button className="btn btn-primary" onClick={() => goPage('devices', ctx.choice)}>{I.devices} Connect your laptop</button>}>
          <div className="empty-week" aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => <span key={i} className={i === 0 ? 'today' : ''}>{['S', 'S', 'M', 'T', 'W', 'T', 'F'][i]}</span>)}
          </div>
        </EmptyPanel>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Shell page="insights" render={ctx => <Insights {...ctx} />} />);
