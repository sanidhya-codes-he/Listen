/* ================= History: every command, a real table ================= */

const MODE_WORD = { wake: 'Wake word', push_to_talk: 'Push to talk', continuous: 'Continuous' };
const STAGES = [['silence', 'Waiting for silence', '--c1'], ['stt', 'Speech to text', '--c2'], ['action', 'Action', '--c3'], ['other', 'Matching + feedback', '--c4']];
const PER_PAGE = 50;
const pct = v => `${Math.round(v * 100)}%`;
const dayLabel = d => (d.toDateString() === TODAY.toDateString() ? 'Today' : d.toDateString() === daysAgo(1).toDateString() ? 'Yesterday' : `${WDAYS[d.getDay()]} ${fmtShort(d)}`);

const selectColors = dark => ({
  accentColor: dark ? '#5598E7' : '#2A78D6', surfaceColor: dark ? '#18212B' : '#FFFFFF',
  highlightColor: dark ? '#1F2935' : '#EEF0F3', textColor: dark ? '#E6EBF2' : '#1D2330'
});

function Filters({ ctx, f, setF, disabled }) {
  const c = selectColors(ctx.dark);
  const commands = [...new Set(HISTORY.map(r => r.cmd).filter(Boolean))].sort();
  return (
    <div className="filters" aria-disabled={disabled || undefined}>
      <label className="search">
        <span className="sr-only">Search what was heard</span>
        {I.search}
        <input className="input" type="search" placeholder="Search what was heard" value={f.q} disabled={disabled}
               onChange={e => setF({ ...f, q: e.target.value, page: 0 })} />
      </label>
      <GlideSelect {...c} size="lg" menuWidth={200} ariaLabel="Result" disabled={disabled} value={f.result}
                   onChange={v => setF({ ...f, result: v, page: 0 })}
                   options={[{ value: 'all', label: 'All results' }, ...Object.entries(RESULT).map(([v, r]) => ({ value: v, label: r.word }))]} />
      <GlideSelect {...c} size="lg" menuWidth={190} ariaLabel="Mode" disabled={disabled} value={f.mode}
                   onChange={v => setF({ ...f, mode: v, page: 0 })}
                   options={[{ value: 'all', label: 'All modes' }, ...Object.entries(MODE_WORD).map(([v, l]) => ({ value: v, label: l }))]} />
      <GlideSelect {...c} size="lg" menuWidth={230} ariaLabel="Command" disabled={disabled} value={f.cmd}
                   onChange={v => setF({ ...f, cmd: v, page: 0 })}
                   options={[{ value: 'all', label: 'All commands' }, ...commands.map(v => ({ value: v, label: v }))]} />
    </div>
  );
}

function LatencyBar({ ms }) {
  return (
    <div className="lat">
      <div className="lat-bar" role="img" aria-label={STAGES.map(([k, l]) => `${l} ${ms[k]} ms`).join(', ')}>
        {STAGES.map(([k, l, c]) => ms[k] > 0 && (
          <span key={k} style={{ flexGrow: ms[k], background: `var(${c})` }} title={`${l}: ${ms[k]} ms`} />
        ))}
      </div>
      <div className="legend">
        {STAGES.map(([k, l, c]) => <span key={k}><i style={{ background: `var(${c})` }} />{l} <b className="num">{ms[k]} ms</b></span>)}
      </div>
    </div>
  );
}

function RowDetail({ r, ctx, onDelete }) {
  return (
    <tr className="detail">
      <td colSpan={10}>
        <div className="detail-grid">
          <dl>
            <div><dt>Heard</dt><dd>“{r.heard}”</dd></div>
            <div><dt>Slots</dt><dd><code>{Object.keys(r.slots).length ? JSON.stringify(r.slots) : 'none'}</code></dd></div>
            <div><dt>Action</dt><dd><code>{r.action || 'none'}</code></dd></div>
            <div><dt>Speech model</dt><dd><code>{r.model}</code></dd></div>
            {r.error && <div><dt>What went wrong</dt><dd>{r.error}</dd></div>}
          </dl>
          <div>
            <p className="detail-h">Where the {(r.ms.total / 1000).toFixed(2)} s went <span>(budget 1.5 s)</span></p>
            <LatencyBar ms={r.ms} />
          </div>
          <div className="detail-del">
            <p className="detail-h">Delete from history</p>
            <p className="fine">Removes it here and from your laptop on its next sync. This cannot be undone.</p>
            <HoldButton holdTime={1200} size="sm" radius={8} icon={I.trash} doneLabel="Deleted"
                        backgroundColor={ctx.dark ? '#1F2935' : '#EEF0F3'} fillColor={ctx.dark ? '#F07A73' : '#C2362F'}
                        textColor={ctx.dark ? '#E6EBF2' : '#1D2330'} fillTextColor={ctx.dark ? '#0B1118' : '#FFFFFF'}
                        glow={false} onHold={() => setTimeout(onDelete, 500)}>Hold to delete</HoldButton>
          </div>
        </div>
      </td>
    </tr>
  );
}

function HistoryTable({ ctx, rows, setRows, f, setF }) {
  const [open, setOpen] = useState(rows[0]?.uuid);
  const filtered = rows.filter(r =>
    (!f.q || r.heard.includes(f.q.toLowerCase())) && (f.result === 'all' || r.result === f.result) &&
    (f.mode === 'all' || r.mode === f.mode) && (f.cmd === 'all' || r.cmd === f.cmd));
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const shown = filtered.slice(f.page * PER_PAGE, f.page * PER_PAGE + PER_PAGE);
  const setVerdict = (r, v) => {
    const next = r.verdict === v ? '' : v;
    setRows(rows.map(x => (x.uuid === r.uuid ? { ...x, verdict: next } : x)));
    ctx.say(next ? `Marked ${next}` : 'Verdict cleared', `“${r.heard}”. Your laptop gets this on its next sync.`, { icon: next === 'wrong' ? I.x : I.ok });
  };
  const del = r => {
    setRows(rows.filter(x => x.uuid !== r.uuid));
    ctx.say('Deleted from history', `“${r.heard}” at ${hhmm(r.ts)}. Removed from your laptop on its next sync.`, { icon: I.trash });
  };
  let lastDay = '';
  return (
    <>
      <div className="table-meta">
        <span><b className="num">{filtered.length ? f.page * PER_PAGE + 1 : 0}–{Math.min(filtered.length, (f.page + 1) * PER_PAGE)}</b> of <b className="num">{filtered.length}</b> commands, newest first</span>
        <Pager f={f} setF={setF} pages={pages} />
      </div>
      <div className="table-wrap">
        <table className="htable">
          <caption className="sr-only">Command history, newest first. Select a row to see details.</caption>
          <thead>
            <tr>
              <th scope="col" className="c-time">Time</th>
              <th scope="col">Heard</th>
              <th scope="col">Command</th>
              <th scope="col">Result</th>
              <th scope="col">Mode</th>
              <th scope="col" className="r" title="How sure speech-to-text was about the words">Hearing</th>
              <th scope="col" className="r" title="How well the words fit the command">Match</th>
              <th scope="col" className="r">Response</th>
              <th scope="col" className="c">Right or wrong</th>
              <th scope="col"><span className="sr-only">Details</span></th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr><td colSpan={10} className="no-match">
                No commands match {f.q ? <>“{f.q}”</> : 'these filters'} in the last 7 days.{' '}
                <button className="btn btn-ghost" onClick={() => setF({ q: '', result: 'all', mode: 'all', cmd: 'all', page: 0 })}>Clear filters</button>
              </td></tr>
            )}
            {shown.map(r => {
              const day = dayLabel(r.ts);
              const showDay = day !== lastDay; lastDay = day;
              const isOpen = open === r.uuid;
              return (
                <React.Fragment key={r.uuid}>
                  {showDay && <tr className="day-row"><th colSpan={10} scope="rowgroup">{day}</th></tr>}
                  <tr className={`row${isOpen ? ' open' : ''}`}>
                    <td className="num c-time">{hhmm(r.ts)}</td>
                    <td className="heard">“{r.heard}”</td>
                    <td>{r.cmd ? <code>{r.cmd}</code> : <span className="none">none</span>}</td>
                    <td><Status result={r.result} /></td>
                    <td className="dim">{MODE_WORD[r.mode]}</td>
                    <td className="num r">{pct(r.sttConf)}</td>
                    <td className="num r">{r.cmd ? pct(r.matchConf) : '–'}</td>
                    <td className={`num r${r.ms.total > 1500 ? ' over' : ''}`}>{(r.ms.total / 1000).toFixed(2)} s{r.ms.total > 1500 && <span className="sr-only"> (over budget)</span>}</td>
                    <td className="c">
                      <div className="verdict" role="group" aria-label={`Verdict for “${r.heard}”`}>
                        <button className={`vbtn right${r.verdict === 'right' ? ' on' : ''}`} aria-pressed={r.verdict === 'right'} onClick={() => setVerdict(r, 'right')}>{I.thumbUp}<span>Right</span></button>
                        <button className={`vbtn wrong${r.verdict === 'wrong' ? ' on' : ''}`} aria-pressed={r.verdict === 'wrong'} onClick={() => setVerdict(r, 'wrong')}>{I.thumbDown}<span>Wrong</span></button>
                      </div>
                    </td>
                    <td className="c">
                      <button className="icon-btn exp" aria-expanded={isOpen} aria-label={`Details for “${r.heard}” at ${hhmm(r.ts)}`}
                              onClick={() => setOpen(isOpen ? null : r.uuid)}>{I.chevronDown}</button>
                    </td>
                  </tr>
                  {isOpen && <RowDetail r={r} ctx={ctx} onDelete={() => del(r)} />}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="table-meta foot"><span /><Pager f={f} setF={setF} pages={pages} /></div>
    </>
  );
}

function Pager({ f, setF, pages }) {
  return (
    <nav className="pager" aria-label="Pages">
      <button className="btn" disabled={f.page === 0} onClick={() => setF({ ...f, page: f.page - 1 })}>Newer</button>
      <span className="num">Page {f.page + 1} of {pages}</span>
      <button className="btn" disabled={f.page >= pages - 1} onClick={() => setF({ ...f, page: f.page + 1 })}>Older</button>
    </nav>
  );
}

function TableSkeleton({ ctx }) {
  return (
    <>
      <div className="table-meta"><LoadingNote what="your history" mode={ctx.mode} /></div>
      <div className="table-wrap">
        <table className="htable">
          <thead><tr>{['Time', 'Heard', 'Command', 'Result', 'Mode', 'Hearing', 'Match', 'Response', 'Right or wrong', ''].map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {Array.from({ length: 10 }, (_, i) => (
              <tr key={i} className="row">
                <td><Skel w={38} /></td><td><Skel w={`${60 + (i * 17) % 35}%`} /></td><td><Skel w={110} /></td>
                <td><Skel w={70} /></td><td><Skel w={70} /></td><td><Skel w={34} /></td><td><Skel w={34} /></td>
                <td><Skel w={44} /></td><td><Skel w={120} h={26} r={8} /></td><td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function HistoryPage(ctx) {
  const { state, dark } = ctx;
  const [range, setRange] = useState('7');
  const [rows, setRows] = useState(HISTORY);
  const [f, setF] = useState({ q: '', result: 'all', mode: 'all', cmd: 'all', page: 0 });
  const busy = state !== 'data';
  const count = state === 'data' ? rows.length : 0;
  return (
    <>
      <PageHead title="History"
        art={<SplitFlapText words={['History']} loop={false} padTo={7} charset="abcdefghijklmnopqrstuvwxyzH" flipsPerChar={6}
                            fontSize={46} tileColor={dark ? '#1F2935' : '#FFFFFF'} textColor={dark ? '#E6EBF2' : '#1D2330'}
                            tileRadius={dark ? 6 : 8} gap={5} glare={dark ? 0.15 : 0.35} depth={0.4} tileStyle="board" />}
        sub={state === 'data'
          ? <>Every command, newest first. <Counter value={count} fontSize={15} fontWeight={600} intro={!ctx.reduced} /> in the last 7 days; mark any of them right or wrong.</>
          : state === 'empty' ? 'Every command you say will be listed here, newest first.' : 'Every command, newest first.'}>
        <DateRange value={range} onChange={setRange} dark={dark} disabled={busy} />
      </PageHead>

      <SpotlightCard className="card hist-card" theme={ctx.mode} spotlightColor={dark ? 'rgba(85,152,231,0.22)' : 'rgba(42,120,214,0.10)'}
                     intensity={0.5} spotlightSize={420} borderGlow={0.4} flare={false}>
        <Filters ctx={ctx} f={f} setF={setF} disabled={busy} />
        {state === 'loading' && <TableSkeleton ctx={ctx} />}
        {state === 'waking' && <WakingPanel ctx={ctx} since={ctx.review.since} what="Your history" />}
        {state === 'error' && <ErrorPanel ctx={ctx} what="your history" endpoint="GET /v1/analytics/commands?range=7d&limit=50" />}
        {state === 'empty' && (
          <EmptyPanel ctx={ctx} title="No commands yet"
            body="As soon as your laptop syncs, everything Listen heard shows up here: what you said, which command ran, whether it worked and how long it took."
            action={<button className="btn btn-primary" onClick={() => goPage('devices', ctx.choice)}>{I.devices} Connect your laptop</button>}>
            <div className="empty-table" aria-hidden="true">
              {['14:32', '14:27', '14:20'].map((t, i) => (
                <div key={t} className="ghost-row" style={{ opacity: 1 - i * 0.28 }}>
                  <span className="num">{t}</span><span className="gl" style={{ width: 160 - i * 30 }} /><span className="gl" style={{ width: 90 }} /><span className="gl" style={{ width: 60 }} />
                </div>
              ))}
            </div>
          </EmptyPanel>
        )}
        {state === 'data' && <HistoryTable ctx={ctx} rows={rows} setRows={setRows} f={f} setF={setF} />}
      </SpotlightCard>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Shell page="history" render={ctx => <HistoryPage {...ctx} />} />);
