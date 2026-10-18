/* ================= Overview: the approved v2 design + its missing states ================= */

const RECENT = [
  { said: 'search what is an atom', cmd: 'core.search', status: 'good', word: 'Success', t: '14:32', ms: 0.98 },
  { said: 'open vs code', cmd: 'core.open', status: 'good', word: 'Success', t: '14:27', ms: 0.74 },
  { said: 'play lofi', cmd: 'core.play', status: 'good', word: 'Success', t: '14:20', ms: 1.21 },
  { said: 'dsa', cmd: 'routines.dsa', status: 'good', word: 'Success', t: '14:05', ms: 1.44 },
  { said: 'volume up', cmd: 'media.volume_up', status: 'good', word: 'Success', t: '13:58', ms: 0.62 },
  { said: 'open the notes thing', cmd: 'no command matched', status: 'warn', word: 'No match', t: '13:41', ms: 1.8 },
  { said: 'next tab', cmd: 'browser.next_tab', status: 'good', word: 'Success', t: '13:33', ms: 0.66 },
  { said: 'open spotfy', cmd: 'core.open', status: 'bad', word: 'Marked wrong', t: '12:47', ms: 0.91 }
];
const STATUS_ICON = { good: I.ok, warn: I.q, bad: I.x };

const STATS = [
  { id: 'cmds', label: 'Commands today', value: '47', delta: 'up', note: '12% above 7-day avg' },
  { id: 'rate', label: 'Success rate today', value: '91.5', unit: '%', delta: 'up', note: '2.1 pts above avg' },
  { id: 'app', label: 'Top app today', value: 'VS Code', delta: 'up', note: '2 h 14 min, 18 min over avg' },
  { id: 'lat', label: 'Median response', value: '1.12', unit: 's', delta: 'down', note: '0.08 s faster than avg' },
  { id: 'most', label: 'Most-used command', value: 'search', note: '14 times, 30% of today' },
  { id: 'streak', label: 'Current streak', value: '23', unit: 'days', note: 'Longest this year: 41' },
  { id: 'wrong', label: 'Marked wrong today', value: '1', note: '"open spotfy" at 12:47' },
  { id: 'site', label: 'Top site today', value: 'leetcode', delta: 'up', note: '1 h 05 min, 22 min over avg' },
  { id: 'nomatch', label: 'No match today', value: '2', note: 'Review them in History' }
];

const StatCard = ({ s }) => (
  <div className="stat">
    <div className="stat-label">{s.label}</div>
    <div className="stat-value">{s.value}{s.unit && <small>{s.unit}</small>}</div>
    <div className="stat-delta">
      {s.delta && <span className="arrow" aria-hidden="true">{s.delta === 'up' ? '▲' : '▼'}</span>}
      <span>{s.note}</span>
    </div>
  </div>
);

function Hero({ ctx, caption, children }) {
  return (
    <section className="hero">
      <div>
        <div className="tech-wrap">
          <TechText text="Listen" fontWeight={600} fontSize={150} reveal="letter" dashLength={4} dashGap={2}
                    specks={15} intro="none" introDuration={2} clickKick guides={false} fontFamily=""
                    letterSpacing={-0.05} accentColor={ctx.accent} reach={200} softness={0.7} lineStyle="dashed"
                    strokeWidth={1.5} speed={1} bounce={0.4} selection labels color="currentColor" align="center"
                    draggable sweep />
        </div>
        <p className="tech-caption">{caption}</p>
      </div>
      {children}
    </section>
  );
}

function CalendarCard({ ctx, days, sub = 'Commands per day, last 53 weeks', loading }) {
  return (
    <div className={`card cal-card${loading ? ' is-loading' : ''}`}>
      <div className="card-head">
        <div>
          <h2 className="card-title">Activity calendar</h2>
          <p className="card-sub">{loading ? <Skel w={200} h={12} /> : sub}</p>
        </div>
        <button className="link" onClick={() => goPage('insights', ctx.choice)}>Open Insights</button>
      </div>
      <CalendarHeatmap days={days} mode={ctx.mode} />
    </div>
  );
}

function OverviewData({ ctx }) {
  const { dark, accent, say } = ctx;
  const spiralItems = useMemo(() => STATS.map(s => ({
    id: s.id, label: `${s.label}: ${s.value}${s.unit ? ' ' + s.unit : ''}. ${s.note}`, content: <StatCard s={s} />
  })), []);
  const menuItems = useMemo(() => RECENT.map(r => ({
    text: (<>“{r.said}”<span className="sr-only">, {r.cmd}, {r.word}, {r.ms} seconds, at {r.t}</span></>),
    meta: (
      <span className="rc-meta">
        <span className={`status ${r.status}`}>{STATUS_ICON[r.status]} {r.word}</span>
        <span className="num">{r.ms.toFixed(2)} s</span>
        <span className="num">{r.t}</span>
      </span>
    ),
    marquee: (
      <span className="mq">
        <code>{r.cmd}</code><span className="sep">/</span>
        <span className="st">{STATUS_ICON[r.status]} {r.word}</span><span className="sep">/</span>
        <code>{r.ms.toFixed(2)} s</code><span className="sep">/</span>
        <code>{r.t}</code><span className="sep">✦</span>
      </span>
    )
  })), []);
  return (
    <>
      <Hero ctx={ctx} caption="47 commands today · 91.5% understood">
        <CalendarCard ctx={ctx} days={YEAR} />
      </Hero>
      <section className="lower">
        <div className="card spiral-card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Today at a glance</h2>
              <p className="card-sub">Hover to pause, drag to scroll</p>
            </div>
          </div>
          <div className="spiral-box">
            {/* only change from v2: speed 0 when Windows asks for reduced motion */}
            <InfiniteSpiral items={spiralItems} speed={ctx.reduced ? 0 : 0.35} animationMode="all" radius={140}
                            cardWidth={185} cardHeight={104} verticalSpacing={100} cardsPerTurn={7}
                            cardRadius={dark ? 8 : 12} centerScale={1.12} edgeFade={0.3} edgeBlur={4} pauseOnHover />
          </div>
        </div>
        <div className="card recent-card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Recent commands</h2>
              <p className="card-sub">Last 8 · hover a row for details</p>
            </div>
            <button className="link" onClick={() => goPage('history', ctx.choice)}>Open History</button>
          </div>
          <div className="recent-box">
            <FlowingMenu items={menuItems} speed={60} stretch={0.6} magnet={0.25} followCursor={0.4}
                         textColor={dark ? '#E6EBF2' : '#1D2330'} bgColor={dark ? '#18212B' : '#FFFFFF'}
                         marqueeBgColor={accent} marqueeTextColor={dark ? '#0B1118' : '#FFFFFF'}
                         borderColor={dark ? 'rgba(230,235,242,0.10)' : 'rgba(29,35,48,0.09)'}
                         direction="left" duration={0.5} bandInset={0} bandRadius={0} carryContent={false}
                         dividers dimInactive={false} align="left" showIndex={false} showArrow={false}
                         imageShape="pill" intro ariaLabel="Recent commands"
                         onItemClick={(item, i) => goPage('history', ctx.choice)} />
          </div>
        </div>
      </section>
    </>
  );
}

/* loading: same layout, real shapes, nothing invented */
function OverviewLoading({ ctx, heroRight, caption }) {
  return (
    <>
      <Hero ctx={ctx} caption={caption ?? <Skel w={220} h={12} />}>
        {heroRight ?? <CalendarCard ctx={ctx} days={EMPTY_YEAR} loading />}
      </Hero>
      <section className="lower">
        <div className="card spiral-card">
          <div className="card-head"><div><h2 className="card-title">Today at a glance</h2><p className="card-sub"><LoadingNote what="today’s numbers" mode={ctx.mode} /></p></div></div>
          <div className="spiral-skel">
            {[0, 1, 2].map(i => (
              <div key={i} className="skel-stat" style={{ marginLeft: 40 + i * 90 }}>
                <Skel w={110} h={11} /><Skel w={70} h={24} /><Skel w={150} h={11} />
              </div>
            ))}
          </div>
        </div>
        <div className="card recent-card">
          <div className="card-head"><div><h2 className="card-title">Recent commands</h2><p className="card-sub">Last 8</p></div></div>
          <div className="recent-box recent-skel">
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="skel-row"><Skel w={`${46 - (i % 3) * 9}%`} h={20} /><Skel w={150} h={12} /></div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function OverviewEmpty({ ctx }) {
  return (
    <>
      <Hero ctx={ctx} caption="No commands yet today">
        <CalendarCard ctx={ctx} days={EMPTY_YEAR} sub="Your first command will light up today’s square" />
      </Hero>
      <section className="lower-full">
        <EmptyPanel ctx={ctx} title="Your first command shows up here"
                    body="Today’s numbers and your recent commands appear within 5 minutes of the laptop’s first sync. Nothing has synced yet."
                    action={<>
                      <button className="btn btn-primary" onClick={() => goPage('devices', ctx.choice)}>{I.devices} Connect your laptop</button>
                      <button className="btn btn-ghost" onClick={() => goPage('commands', ctx.choice)}>See what you can say</button>
                    </>}>
          <div className="empty-ghost" aria-hidden="true">
            {['Commands today', 'Success rate today', 'Top app today'].map((l, i) => (
              <div key={l} className="ghost-stat" style={{ transform: `translate(${i * 70}px, ${i * 54}px) rotate(${(i - 1) * 3}deg)` }}>
                <div className="stat-label">{l}</div><div className="stat-value">–</div><div className="stat-delta">Waiting for the first sync</div>
              </div>
            ))}
          </div>
        </EmptyPanel>
      </section>
    </>
  );
}

function Overview(ctx) {
  const { state } = ctx;
  if (state === 'loading') return <OverviewLoading ctx={ctx} />;
  if (state === 'empty') return <OverviewEmpty ctx={ctx} />;
  if (state === 'waking') {
    return <OverviewLoading ctx={ctx} caption="Waiting for the server"
                            heroRight={<WakingPanel ctx={ctx} since={ctx.review.since} what="Today’s overview" />} />;
  }
  if (state === 'error') {
    return (
      <Hero ctx={ctx} caption="Today’s numbers could not be loaded">
        <ErrorPanel ctx={ctx} size={64} what="today’s overview" endpoint="GET /v1/analytics/summary?range=today" />
      </Hero>
    );
  }
  return <OverviewData ctx={ctx} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<Shell page="overview" render={ctx => <Overview {...ctx} />} />);
