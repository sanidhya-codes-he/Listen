/* ================= Listen phase 2: shared shell (every page) ================= */

/* ---- icons (thin stroke, 24 grid, Hugeicons-like) ---- */
const Ico = ({ children, size = '1em', sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I = {
  home: <Ico><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M10 20v-5h4v5" /></Ico>,
  history: <Ico><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" /><path d="M3 4v4h4" /><path d="M12 8v4l3 2" /></Ico>,
  apps: <Ico><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></Ico>,
  commands: <Ico><rect x="3" y="4.5" width="18" height="15" rx="2.5" /><path d="m7 10 3 2.5L7 15" /><path d="M12.5 15H17" /></Ico>,
  insights: <Ico><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M21 20H3" /></Ico>,
  devices: <Ico><rect x="4" y="4.5" width="16" height="11" rx="1.5" /><path d="M2 19.5h20" /><path d="M9.5 15.5h5" /></Ico>,
  logout: <Ico><path d="M14 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H14" /><path d="M10 12h10" /><path d="m17 8.5 3.5 3.5-3.5 3.5" /></Ico>,
  ok: <Ico sw={2}><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.7 2.7L16 9.8" /></Ico>,
  q: <Ico sw={2}><circle cx="12" cy="12" r="9" /><path d="M9.6 9.4a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.1-2.4 3.4" /><path d="M12 17h.01" /></Ico>,
  x: <Ico sw={2}><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></Ico>,
  warn: <Ico sw={2}><path d="M12 4 2.8 19.5h18.4L12 4Z" /><path d="M12 10v4" /><path d="M12 17h.01" /></Ico>,
  minus: <Ico sw={2}><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></Ico>,
  search: <Ico><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></Ico>,
  thumbUp: <Ico><path d="m5 12.5 4.5 4.5L19 7" /></Ico>,
  thumbDown: <Ico><path d="M6 6l12 12M18 6 6 18" /></Ico>,
  trash: <Ico><path d="M4.5 7h15" /><path d="M9.5 7V4.5h5V7" /><path d="M6.5 7l1 13h9l1-13" /></Ico>,
  chevron: <Ico sw={2}><path d="m9 6 6 6-6 6" /></Ico>,
  chevronDown: <Ico sw={2}><path d="m6 9 6 6 6-6" /></Ico>,
  plus: <Ico sw={2}><path d="M12 5v14M5 12h14" /></Ico>,
  edit: <Ico><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></Ico>,
  copy: <Ico><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" /></Ico>,
  key: <Ico><circle cx="8" cy="15" r="4" /><path d="m11 12 8.5-8.5" /><path d="m16 7 2.5 2.5" /></Ico>,
  refresh: <Ico><path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M20 4v4.5h-4.5" /></Ico>,
  cloud: <Ico><path d="M7 18.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.6 1.6A3.8 3.8 0 0 1 17.5 18.5Z" /></Ico>,
  cloudOff: <Ico><path d="M7 18.5a4.5 4.5 0 0 1-.6-9" /><path d="M9 6.2a6 6 0 0 1 9 4.9 3.8 3.8 0 0 1 1.6 6.3" /><path d="M3 3l18 18" /></Ico>,
  eye: <Ico><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></Ico>,
  eyeOff: <Ico><path d="M4 4l16 16" /><path d="M10 6a9 9 0 0 1 2-.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.7 3.4" /><path d="M6.6 7.6A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.3-1.1" /></Ico>,
  lock: <Ico><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></Ico>,
  mic: <Ico><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0" /><path d="M12 17.5V21" /></Ico>,
  table: <Ico><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><path d="M3.5 9.5h17M3.5 14.5h17M10 9.5v10" /></Ico>,
  chart: <Ico><path d="M4 19h16" /><path d="m5 15 4-4 3 3 6-7" /></Ico>,
  info: <Ico sw={2}><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></Ico>,
  sun: <Ico><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></Ico>,
  moon: <Ico><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></Ico>,
  monitor: <Ico><rect x="3" y="4" width="18" height="12.5" rx="2" /><path d="M12 4v12.5" /><path d="M12 4h7a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-7Z" fill="currentColor" stroke="none" opacity="0.35" /><path d="M8.5 20.5h7M12 16.5v4" /></Ico>,
  up: <Ico sw={2}><path d="M12 19V5" /><path d="m6 11 6-6 6 6" /></Ico>,
  down: <Ico sw={2}><path d="M12 5v14" /><path d="m6 13 6 6 6-6" /></Ico>,
  sort: <Ico sw={2}><path d="m8 9 4-4 4 4" /><path d="m8 15 4 4 4-4" /></Ico>,
  close: <Ico sw={2}><path d="M7 7l10 10M17 7 7 17" /></Ico>
};

/* ---- seeded random, dates ---- */
const mulberry32 = seed => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const TODAY = new Date(2026, 9, 17); // Sat 17 Oct 2026
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fmtDay = d => `${WDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const fmtShort = d => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
const fmtMin = m => (m >= 60 ? `${Math.floor(m / 60)} h ${String(Math.round(m % 60)).padStart(2, '0')} min` : `${Math.round(m)} min`);
const daysAgo = n => new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - n);

/* ---- the year of activity (same seed and fixes as the Overview, so numbers agree) ---- */
const makeYear = () => {
  const rand = mulberry32(1707);
  const days = [];
  const total = 371;
  for (let i = total - 1; i >= 0; i--) {
    const date = daysAgo(i);
    const dow = date.getDay();
    const weekend = dow === 0 || dow === 6;
    const holiday = date.getMonth() === 7 && date.getDate() >= 10 && date.getDate() <= 18;
    let count = 0;
    if (!holiday && rand() > (weekend ? 0.38 : 0.12)) {
      const g = (rand() + rand() + rand() - 1.5) * 0.9;
      count = Math.max(1, Math.round(Math.exp(3.25 + g) * (weekend ? 0.55 : 1)));
    }
    days.push({ date, count });
  }
  const n = days.length;
  // a 41-day streak in spring, so "Longest this year: 41" on the Overview is true
  for (let k = 0; k < 41; k++) if (days[n - 230 + k].count === 0) days[n - 230 + k].count = 4 + Math.floor(rand() * 18);
  days[n - 231].count = 0; days[n - 189].count = 0;
  for (let k = 1; k <= 23; k++) if (days[n - k].count === 0) days[n - k].count = 6 + Math.floor(rand() * 20);
  days[n - 24].count = 0;
  days[n - 1].count = 47;
  days[n - 12].count = 38;
  return days;
};
const YEAR = makeYear();
const EMPTY_YEAR = YEAR.map(d => ({ date: d.date, count: 0 }));

/* ---- theme: follow Windows by default; ?theme=light|dark for review and screenshots ---- */
const QS = new URLSearchParams(location.search);
const useTheme = () => {
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  const [choice, setChoice] = useState(['light', 'dark'].includes(QS.get('theme')) ? QS.get('theme') : 'system');
  const [systemDark, setSystemDark] = useState(query.matches);
  useEffect(() => {
    const on = e => setSystemDark(e.matches);
    query.addEventListener('change', on);
    return () => query.removeEventListener('change', on);
  }, []);
  useEffect(() => {
    if (choice === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = choice;
  }, [choice]);
  const mode = choice === 'system' ? (systemDark ? 'dark' : 'light') : choice;
  return { choice, setChoice, mode, systemDark };
};

const usePrefersReduced = () => {
  const q = window.matchMedia('(prefers-reduced-motion: reduce)');
  const [r, setR] = useState(q.matches);
  useEffect(() => {
    const on = e => setR(e.matches);
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, []);
  return r;
};

/* ---- review-only state switcher: data / loading / waking / error / empty, plus a real cold start ---- */
const STATES = [['data', 'Data'], ['loading', 'Loading'], ['waking', 'Waking up'], ['error', 'Error'], ['empty', 'Empty']];
const useReview = () => {
  const start = STATES.some(s => s[0] === QS.get('state')) ? QS.get('state') : 'data';
  const [state, setState] = useState(start);
  const [since, setSince] = useState(() => Date.now() - (start === 'waking' ? 14000 : 0));
  const timers = useRef([]);
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const go = s => { clear(); setState(s); setSince(Date.now() - (s === 'waking' ? 14000 : 0)); };
  const later = (ms, fn) => timers.current.push(setTimeout(fn, ms));
  // the decided rule (Doc 08): a first request slower than 3 s turns "loading" into "waking up"
  const cold = () => { go('loading'); setSince(Date.now()); later(3000, () => setState('waking')); later(16000, () => setState('data')); };
  const retry = () => { go('loading'); later(1200, () => setState('data')); };
  useEffect(() => clear, []);
  return { state, since, go, cold, retry };
};

/* ---- toasts: React Bits SwipeToast, one at a time ---- */
const useToasts = () => {
  const [t, setT] = useState(null);
  const say = (title, description = '', extra = {}) => setT({ key: Date.now(), title, description, ...extra });
  const node = t && (
    <SwipeToast key={t.key} title={t.title} description={t.description} icon={t.icon ?? I.info}
                actionLabel={t.actionLabel} onAction={t.onAction}
                background="var(--ink)" color="var(--bg)" fuseColor="var(--accent)"
                width={380} radius={10} duration={t.duration ?? 4200} closeButton
                onClose={() => setT(cur => (cur && cur.key === t.key ? null : cur))} />
  );
  return { say, node };
};

/* ---- navigation: the approved Dock, linking the seven prototype files ---- */
const NAV = [
  ['overview', 'Overview', I.home], ['history', 'History', I.history], ['apps', 'App usage', I.apps],
  ['commands', 'Commands', I.commands], ['insights', 'Insights', I.insights], ['devices', 'Devices & settings', I.devices]
];
const goPage = (file, choice) => { location.href = `${file}.html${choice && choice !== 'system' ? `?theme=${choice}` : ''}`; };

function DockNav({ page, mode, choice }) {
  const dark = mode === 'dark';
  const items = [
    ...NAV.map(([id, label, icon]) => ({
      icon, label, active: id === page,
      onClick: () => (id === page ? window.scrollTo({ top: 0, behavior: 'smooth' }) : goPage(id, choice))
    })),
    { separator: true },
    { icon: I.logout, label: 'Log out', onClick: () => goPage('login', choice) }
  ];
  return (
    <div className="dock-strip">
      <Dock items={items} theme={mode} baseItemSize={50} magnification={70} panelHeight={68}
            accentColor={dark ? '#5598E7' : '#2A78D6'} badgeColor={dark ? '#F07A73' : '#C2362F'}
            position="bottom" distance={200} gap={10} roundness={0.5} bounce autoHide={false}
            tiles showLabels showIndicators showBadges={false} />
    </div>
  );
}

/* ---- top bar: date, laptop sync status, review controls ---- */
function SyncPill({ state }) {
  if (state === 'waking') return <span className="pill pill-wait">{I.cloud} Waking the server…</span>;
  if (state === 'error') return <span className="pill pill-bad">{I.cloudOff} Server not reachable</span>;
  if (state === 'loading') return <span className="pill pill-wait">{I.refresh} Checking sync…</span>;
  if (state === 'empty') return <span className="pill pill-wait">{I.devices} No laptop has synced yet</span>;
  return <span className="pill">{I.ok} Last synced 3 minutes ago</span>;
}

function ReviewBar({ review, theme }) {
  return (
    <div className="review" role="group" aria-label="Review controls (prototype only)">
      <span className="review-label">Review</span>
      <div className="seg" role="group" aria-label="Page state">
        {STATES.map(([v, l]) => (
          <button key={v} aria-pressed={review.state === v} onClick={() => review.go(v)}>{l}</button>
        ))}
        <button onClick={review.cold} title="Loading, then Waking up after 3 seconds, then data">Cold start</button>
      </div>
      <div className="seg" role="group" aria-label="Theme">
        {['system', 'light', 'dark'].map(c => (
          <button key={c} aria-pressed={theme.choice === c} onClick={() => theme.setChoice(c)}>
            {c === 'system' ? 'Windows' : c[0].toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Shell({ page, render, bare = false }) {
  const theme = useTheme();
  const review = useReview();
  const toasts = useToasts();
  const reduced = usePrefersReduced();
  const dark = theme.mode === 'dark';
  const ctx = {
    state: review.state, review, mode: theme.mode, dark, reduced, say: toasts.say, choice: theme.choice,
    setChoice: theme.setChoice, systemDark: theme.systemDark,
    accent: dark ? '#5598E7' : '#2A78D6', ink: dark ? '#E6EBF2' : '#1D2330', surface: dark ? '#18212B' : '#FFFFFF'
  };
  return (
    <>
      <a className="skip" href="#content">Skip to content</a>
      <main className={`page page-${page}`}>
        <header className="topbar">
          {bare ? <span /> : <span className="date">Saturday 17 October</span>}
          <div className="topbar-right">
            {!bare && <SyncPill state={review.state} />}
            <ReviewBar review={review} theme={theme} />
          </div>
        </header>
        <div id="content">{render(ctx)}</div>
      </main>
      {!bare && <DockNav page={page} mode={theme.mode} choice={theme.choice} />}
      {toasts.node}
    </>
  );
}

/* ---- page header used by the six non-Overview pages: title, one line, controls ---- */
function PageHead({ title, art, sub, children }) {
  return (
    <section className="phead">
      <div className="phead-title">
        <h1 className="sr-only">{title}</h1>
        <div className="phead-art" aria-hidden="true">{art}</div>
        <p className="phead-sub">{sub}</p>
      </div>
      {children && <div className="phead-tools">{children}</div>}
    </section>
  );
}

/* ---- the one date range that drives every chart on an analytics page (React Bits RubberSegment) ---- */
const RANGES = [{ value: 'today', label: 'Today' }, { value: '7', label: '7 days' }, { value: '30', label: '30 days' },
  { value: '90', label: '90 days' }, { value: 'custom', label: 'Custom' }];
function DateRange({ value, onChange, dark, disabled }) {
  const [custom, setCustom] = useState(false);
  return (
    <div className="range">
      <RubberSegment items={RANGES} value={value} disabled={disabled}
                     onChange={v => { onChange(v); setCustom(v === 'custom'); }}
                     trackColor={dark ? '#1F2935' : '#EEF0F3'} thumbColor={dark ? '#5598E7' : '#FFFFFF'}
                     textColor={dark ? '#A9B4C3' : '#4E5668'} activeTextColor={dark ? '#0B1118' : '#1D2330'}
                     size="md" radius={999} aria-label="Date range" />
      {custom && (
        <div className="range-pop card" role="dialog" aria-label="Custom range">
          <label>From <input type="date" defaultValue="2026-09-01" /></label>
          <label>To <input type="date" defaultValue="2026-10-17" /></label>
          <button className="btn btn-primary" onClick={() => setCustom(false)}>Apply</button>
        </div>
      )}
    </div>
  );
}

/* ---- loading skeleton pieces ---- */
const Skel = ({ w = '100%', h = 14, r = 6, style }) => <span className="skel" style={{ width: w, height: h, borderRadius: r, ...style }} aria-hidden="true" />;
function LoadingNote({ what, mode }) {
  return (
    <div className="loading-note" role="status">
      <LatticeLoader label={`Loading ${what}`} pattern="orbit" grid={3} cellSize={5} gap={2} fontSize={13}
                     color={mode === 'dark' ? '#5598E7' : '#2A78D6'} showTimer={false} />
    </div>
  );
}

/* ---- waking up the server: shown when the first request takes longer than 3 s ---- */
function WakingPanel({ since, ctx, what }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 100); return () => clearInterval(t); }, []);
  const secs = Math.max(0, (now - since) / 1000);
  return (
    <section className="state-panel waking card" aria-live="polite">
      <div className="waking-radar" aria-hidden="true">
        <Radar color={ctx.accent} lightMode={!ctx.dark} speed={0.6} ringCount={5} spokeCount={8} targets={1}
               clutter={0.1} grain={0} glow={0.7} brightness={ctx.dark ? 0.9 : 1} mouseInteraction={false}
               scale={0.95} paused={ctx.reduced} />
      </div>
      <div className="state-copy">
        <LatticeLoader label="Waking up the server" pattern="orbit" grid={3} cellSize={7} gap={3} fontSize={15}
                       color={ctx.accent} elapsed={secs} />
        <h2 className="state-title">Waking up the server…</h2>
        <p>This can take up to a minute on the free tier. {what} appears here by itself as soon as it answers; you do not need to reload.</p>
        <p className="state-fine">The free server sleeps when nobody has used it for a while. Your laptop keeps
          listening and recording in the meantime, so nothing is lost.</p>
      </div>
    </section>
  );
}

/* ---- error: the request failed. Says what failed, that nothing is lost, and how to retry ---- */
function ErrorPanel({ ctx, what, endpoint, code = '503 Service Unavailable', size = 96 }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="state-panel error card" role="alert">
      <div className="error-art" aria-hidden="true">
        <FuzzyText fontSize={size} fontWeight={600} fontFamily={ctx.dark ? 'IBM Plex Sans' : 'Instrument Sans'}
                   color={ctx.ink} baseIntensity={ctx.reduced ? 0 : 0.12} hoverIntensity={ctx.reduced ? 0 : 0.35}
                   enableHover={!ctx.reduced}>No reply</FuzzyText>
      </div>
      <div className="state-copy">
        <h2 className="state-title"><span className="st-ico bad">{I.x}</span> Couldn’t load {what}</h2>
        <p>The server answered with an error ({code}). Your laptop keeps every command and uploads it on its
          next sync, so nothing is lost.</p>
        <div className="state-actions">
          <button className="btn btn-primary" onClick={ctx.review.retry}>{I.refresh} Try again</button>
          <button className="btn btn-ghost" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? 'Hide details' : 'Show details'}
          </button>
        </div>
        {open && <pre className="err-details">{`${endpoint}\n${code} at 14:32:07\nRetried automatically 2 times`}</pre>}
      </div>
    </section>
  );
}

/* ---- empty: first day, no data yet. An invitation to act, with real example sentences ---- */
const EXAMPLES = ['open vs code', 'search what is an atom', 'play lofi', 'volume up', 'dsa'];
function EmptyPanel({ ctx, title, body, action, children }) {
  return (
    <section className="state-panel empty card">
      <div className="state-copy">
        <h2 className="state-title">{title}</h2>
        <p>{body}</p>
        <p className="try" aria-label={`Try saying: ${EXAMPLES.join(', ')}`}>
          <span className="try-mic" aria-hidden="true">{I.mic}</span>
          <span aria-hidden="true">Try saying</span>
          <span className="try-phrase" aria-hidden="true">
            “<RotatingText texts={EXAMPLES} auto={!ctx.reduced} rotationInterval={2200} staggerDuration={0.02}
                          splitBy="characters" mainClassName="try-rot" />”
          </span>
        </p>
        {action && <div className="state-actions">{action}</div>}
      </div>
      {children}
    </section>
  );
}

/* ---- status word + icon (status colours never alone) ---- */
const RESULT = {
  executed: { cls: 'good', icon: I.ok, word: 'Success' },
  failed: { cls: 'bad', icon: I.x, word: 'Failed' },
  not_matched: { cls: 'warn', icon: I.q, word: 'No match' },
  low_confidence: { cls: 'warn', icon: I.q, word: 'Unsure' },
  cancelled: { cls: 'muted', icon: I.minus, word: 'Cancelled' }
};
const Status = ({ result }) => {
  const r = RESULT[result];
  return <span className={`status ${r.cls}`}>{r.icon}{r.word}</span>;
};

/* ---- calendar heatmap (custom SVG, Doc 08; identical to the Overview's) ---- */
const RAMPS = {
  light: ['#EDEDEA', '#86B6EF', '#3987E5', '#256ABF', '#104281'],
  dark: ['#2A3440', '#1C5CAB', '#2A78D6', '#5598E7', '#9EC5F4']
};
const quartiles = values => {
  const s = values.filter(v => v > 0).sort((a, b) => a - b);
  if (!s.length) return [0, 0, 0];
  const at = p => s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))];
  return [at(0.25), at(0.5), at(0.75)];
};
function CalendarHeatmap({ days, mode, cell = 12 }) {
  const CELL = cell, GAP = 3, STEP = CELL + GAP, LEFT = 30, TOP = 18;
  const ramp = RAMPS[mode];
  const [q1, q2, q3] = useMemo(() => quartiles(days.map(d => d.count)), [days]);
  const level = c => (c === 0 ? 0 : c <= q1 ? 1 : c <= q2 ? 2 : c <= q3 ? 3 : 4);
  const [tip, setTip] = useState(null);
  const first = days[0].date;
  const lead = (first.getDay() + 6) % 7;
  const cells = days.map((d, i) => ({ ...d, col: Math.floor((i + lead) / 7), row: (i + lead) % 7 }));
  const cols = cells[cells.length - 1].col + 1;
  const months = [];
  cells.forEach(c => { if (c.date.getDate() === 1) months.push({ col: c.row === 0 ? c.col : c.col + 1, name: MONTHS[c.date.getMonth()] }); });
  const width = LEFT + cols * STEP - GAP;
  const height = TOP + 7 * STEP - GAP;
  const total = days.reduce((a, d) => a + d.count, 0);
  const active = days.filter(d => d.count > 0).length;
  return (
    <>
      <div className="cal-body">
        <svg className="cal-svg" width={width} height={height} role="img"
             aria-label={`Activity calendar: ${total.toLocaleString()} commands on ${active} days over the last year`}
             onMouseLeave={() => setTip(null)}>
          {months.map(m => <text key={`${m.name}${m.col}`} x={LEFT + m.col * STEP} y={11}>{m.name}</text>)}
          {['Mon', '', 'Wed', '', 'Fri', '', ''].map((d, r) => d && <text key={d} x={0} y={TOP + r * STEP + 10}>{d}</text>)}
          {cells.map((c, i) => (
            <rect key={i} className={`day${tip && tip.i === i ? ' hot' : ''}`}
                  x={LEFT + c.col * STEP} y={TOP + c.row * STEP} width={CELL} height={CELL} rx={2.5}
                  fill={ramp[level(c.count)]}
                  onMouseEnter={() => setTip({ i, x: LEFT + c.col * STEP + CELL / 2 + 24, y: TOP + c.row * STEP + 14, c })} />
          ))}
        </svg>
        {tip && (
          <div className="cal-tip" style={{ left: tip.x, top: tip.y }}>
            {fmtDay(tip.c.date)} · <b>{tip.c.count}</b> {tip.c.count === 1 ? 'command' : 'commands'}
          </div>
        )}
      </div>
      <div className="cal-key">
        <span>Grey = no commands. Blue steps = quartiles of your active days.</span>
        <span className="ramp">Less {ramp.map(c => <span key={c} className="sw" style={{ background: c }} />)} More</span>
      </div>
    </>
  );
}

/* ---- the command history (seeded) used by Overview and History ---- */
const SAYINGS = [
  ['search what is an atom', 'core.search', 'open_url', 'executed', { query: 'what is an atom' }],
  ['open vs code', 'core.open', 'launch_app', 'executed', { app: 'Visual Studio Code' }],
  ['play lofi', 'core.play', 'open_url', 'executed', { query: 'lofi' }],
  ['dsa', 'routines.dsa', 'routine', 'executed', {}],
  ['volume up', 'media.volume_up', 'press_keys', 'executed', {}],
  ['open the notes thing', '', '', 'not_matched', {}],
  ['next tab', 'browser.next_tab', 'press_keys', 'executed', {}],
  ['open spotfy', 'core.open', 'launch_app', 'executed', { app: 'Spotify' }],
  ['new tab', 'terminal.new_tab', 'press_keys', 'executed', {}],
  ['search binary search tree on youtube', 'core.search', 'open_url', 'executed', { query: 'binary search tree', target: 'youtube' }],
  ['close chrome', 'core.close', 'close_app', 'low_confidence', { app: 'Google Chrome' }],
  ['pause', 'media.pause', 'press_keys', 'executed', {}],
  ['open leetcode', 'core.open', 'open_url', 'executed', { app: 'leetcode' }],
  ['reopen tab', 'browser.reopen_tab', 'press_keys', 'executed', {}],
  ['open figma', 'core.open', 'launch_app', 'failed', { app: 'Figma' }],
  ['split pane', 'terminal.split_pane', 'press_keys', 'executed', {}],
  ['what time is it', '', '', 'not_matched', {}],
  ['next song', 'media.next', 'press_keys', 'executed', {}],
  ['cancel', '', '', 'cancelled', {}],
  ['refresh', 'browser.refresh', 'press_keys', 'executed', {}]
];
const makeHistory = (count = 320) => {
  const rand = mulberry32(42);
  const rows = [];
  let t = new Date(2026, 9, 17, 14, 32).getTime();
  const fixed = [0, 1, 2, 3, 4, 5, 6, 7];
  for (let i = 0; i < count; i++) {
    const k = i < fixed.length ? fixed[i] : Math.floor(rand() * SAYINGS.length);
    const [heard, cmd, action, result, slots] = SAYINGS[k];
    const mode = rand() < 0.72 ? 'wake' : rand() < 0.8 ? 'push_to_talk' : 'continuous';
    const silence = mode === 'push_to_talk' ? 0 : 640 + Math.round(rand() * 110);
    const stt = 240 + Math.round(rand() * 230);
    const act = action ? 60 + Math.round(rand() * 150) : 0;
    const other = 40 + Math.round(rand() * 30);
    const sttConf = result === 'not_matched' ? 0.62 + rand() * 0.3 : 0.78 + rand() * 0.21;
    const matchConf = result === 'not_matched' ? 0.2 + rand() * 0.35 : result === 'low_confidence' ? 0.66 + rand() * 0.1 : heard.includes('spotfy') ? 0.84 : 0.88 + rand() * 0.12;
    rows.push({
      uuid: `c-${i}`, ts: new Date(t), heard, cmd, action, result, slots, mode,
      ms: { silence, stt, action: act, other, total: silence + stt + act + other },
      sttConf, matchConf, model: rand() < 0.85 ? 'base.en' : 'tiny.en',
      verdict: heard === 'open spotfy' ? 'wrong' : i % 9 === 3 ? 'right' : '',
      error: result === 'failed' ? 'App not found: "Figma" is not installed' : ''
    });
    t -= (2 + rand() * (i % 30 === 29 ? 600 : 18)) * 60000;
  }
  return rows;
};
const HISTORY = makeHistory();

const hhmm = d => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/* ---- small chart helpers (custom SVG standing in for Recharts) ---- */
const niceMax = v => { const p = 10 ** Math.floor(Math.log10(v || 1)); const f = v / p; return ([1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10].find(s => f <= s)) * p; };
const ticks = (max, n = 4) => Array.from({ length: n + 1 }, (_, i) => (max / n) * i);

function ChartTip({ tip }) {
  if (!tip) return null;
  return <div className="chart-tip" style={{ left: tip.x, top: tip.y }}>{tip.body}</div>;
}

function ViewToggle({ table, setTable }) {
  return (
    <div className="seg seg-sm" role="group" aria-label="View">
      <button aria-pressed={!table} onClick={() => setTable(false)}>{I.chart}<span>Chart</span></button>
      <button aria-pressed={table} onClick={() => setTable(true)}>{I.table}<span>Table</span></button>
    </div>
  );
}
