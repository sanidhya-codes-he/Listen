/* ================= index: all seven pages, plus the Dock to move between them ================= */

const PAGE_LIST = [
  ['login', 'Login', 'LineWaves background, TechText brand, SpecularButton, Counter lock-out countdown'],
  ['overview', 'Overview', 'Approved v2 (TechText, InfiniteSpiral, FlowingMenu) plus loading, waking, error and empty'],
  ['history', 'History', 'A real table: SplitFlapText title, GlideSelect filters, SpotlightCard, HoldButton delete'],
  ['apps', 'App usage', 'Counter odometer total, OptionWheel app picker, one-hue bars, highlighted trend line'],
  ['commands', 'Commands', 'Folder per command file, SpotlightCard commands, Stepper guided form, AnimatedList edits'],
  ['insights', 'Insights', 'MagicBento tiles, BlurText takeaways, calendar, trends, latency stages, calibration'],
  ['devices', 'Devices & settings', 'TearTicket one-time token with DecryptedText, HoldButton revoke, session']
];
const STATE_LIST = 'Every page: Review → Data, Loading, Waking up, Error, Empty, Cold start (loading turns into waking after 3 s).';

function Index() {
  const theme = useTheme();
  const dark = theme.mode === 'dark';
  const go = id => goPage(id, theme.choice);
  const items = [
    ...NAV.map(([id, label, icon]) => ({ icon, label, onClick: () => go(id) })),
    { separator: true },
    { icon: I.lock, label: 'Login', onClick: () => go('login') }
  ];
  return (
    <>
      <main className="page page-index">
        <header className="topbar">
          <span className="date">Listen web app · phase 2 prototypes · 17 October 2026</span>
          <div className="seg" role="group" aria-label="Theme">
            {['system', 'light', 'dark'].map(c => (
              <button key={c} aria-pressed={theme.choice === c} onClick={() => theme.setChoice(c)}>
                {c === 'system' ? 'Windows' : c[0].toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </header>
        <section className="phead">
          <div className="phead-title">
            <h1 className="phead-h">Seven pages</h1>
            <p className="phead-sub">Open any page, or use the Dock at the bottom. {STATE_LIST}</p>
          </div>
        </section>
        <ul className="gallery">
          {PAGE_LIST.map(([id, name, what]) => (
            <li key={id} className="card g-card">
              <a href={`${id}.html${theme.choice !== 'system' ? `?theme=${theme.choice}` : ''}`} className="g-link">
                <span className="g-shot"><img src={`${id}-${dark ? 'dark' : 'light'}.png`} alt="" loading="lazy" /></span>
                <span className="g-name">{name}</span>
                <span className="g-what">{what}</span>
              </a>
            </li>
          ))}
        </ul>
      </main>
      <div className="dock-strip">
        <Dock items={items} theme={theme.mode} baseItemSize={50} magnification={70} panelHeight={68}
              accentColor={dark ? '#5598E7' : '#2A78D6'} position="bottom" distance={200} gap={10} roundness={0.5}
              bounce autoHide={false} tiles showLabels showIndicators showBadges={false} />
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Index />);
