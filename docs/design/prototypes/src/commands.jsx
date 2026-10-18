/* ================= Commands: what you can say ================= */

const LIB = {
  core: [
    { id: 'search', patterns: ['search {query} on {target}', 'search {query}', 'look up {query}', 'google {query}'], action: 'open_url', params: 'target’s search URL', uses: 412 },
    { id: 'play', patterns: ['play {query} on {target}', 'play {query}'], action: 'open_url', params: 'target’s play URL', uses: 168 },
    { id: 'open', patterns: ['open {app}', 'launch {app}', 'start {app}'], action: 'launch_app', params: 'app from your app names', uses: 530 },
    { id: 'close', patterns: ['close {app}', 'quit {app}', 'exit {app}'], action: 'close_app', params: '', risk: 'high', uses: 61 },
    { id: 'volume', patterns: ['volume {level}', 'set volume to {level}'], action: 'set_volume', params: 'level 0–100', uses: 44 }
  ],
  browser: [
    { id: 'new_tab', patterns: ['new tab', 'open a new tab'], action: 'press_keys', params: 'ctrl+t', when: 'Google Chrome', uses: 96 },
    { id: 'close_tab', patterns: ['close tab', 'close this tab'], action: 'press_keys', params: 'ctrl+w', when: 'Google Chrome', uses: 73 },
    { id: 'reopen_tab', patterns: ['reopen tab', 'bring that tab back'], action: 'press_keys', params: 'ctrl+shift+t', when: 'Google Chrome', uses: 39 },
    { id: 'next_tab', patterns: ['next tab'], action: 'press_keys', params: 'ctrl+tab', when: 'Google Chrome', uses: 88 },
    { id: 'refresh', patterns: ['refresh', 'reload'], action: 'press_keys', params: 'f5', when: 'Google Chrome', uses: 52 }
  ],
  terminal: [
    { id: 'new_tab', patterns: ['new tab', 'open a new tab'], action: 'press_keys', params: 'ctrl+shift+t', when: 'Windows Terminal', uses: 41 },
    { id: 'close_tab', patterns: ['close tab', 'close this tab'], action: 'press_keys', params: 'ctrl+shift+w', when: 'Windows Terminal', uses: 30 },
    { id: 'split_pane', patterns: ['split pane', 'split the screen'], action: 'press_keys', params: 'alt+shift+d', when: 'Windows Terminal', uses: 18 }
  ],
  media: [
    { id: 'pause', patterns: ['pause', 'stop the music'], action: 'press_keys', params: 'media play/pause', uses: 64 },
    { id: 'next', patterns: ['next song', 'skip'], action: 'press_keys', params: 'media next', uses: 57 },
    { id: 'volume_up', patterns: ['volume up', 'louder'], action: 'press_keys', params: 'volume up ×5', uses: 80 },
    { id: 'volume_down', patterns: ['volume down', 'quieter'], action: 'press_keys', params: 'volume down ×5', uses: 49 }
  ],
  routines: [
    { id: 'dsa', patterns: ['dsa', 'start dsa', 'dsa mode'], action: 'routine', steps: ['launch_app CLion', 'open_url takeuforward.org', 'open_url leetcode.com'], uses: 47 },
    { id: 'gym', patterns: ['gym', 'workout time'], action: 'routine', steps: ['launch_app Spotify', 'open_url spotify: workout'], uses: 12 }
  ]
};
const FILES = Object.keys(LIB);
const PRIMITIVES = ['open_url', 'launch_app', 'close_app', 'press_keys', 'set_volume', 'routine'];
const EDIT_STATUS = {
  waiting: { mark: 'running', word: 'Waiting for laptop', note: 'Applied on the next sync' },
  applied: { mark: 'done', word: 'Applied', note: 'Now in the command file' },
  invalid: { mark: 'failed', word: 'Invalid', note: '' },
  overridden: { mark: 'overridden', word: 'Overridden', note: 'The file changed on the laptop first' }
};
const EDITS0 = [
  { id: 'e4', what: 'Add', cmd: 'browser.duplicate_tab', when: '10:42', status: 'waiting' },
  { id: 'e3', what: 'Edit', cmd: 'core.search', when: 'Yesterday 21:10', status: 'applied' },
  { id: 'e2', what: 'Add', cmd: 'media.mute', when: 'Yesterday 20:55', status: 'invalid', reason: 'press_keys has no key called “mute”; did you mean “volume_mute”?' },
  { id: 'e1', what: 'Edit', cmd: 'routines.dsa', when: 'Thu 18:02', status: 'overridden' }
];

const Pattern = ({ p }) => (
  <span className="pat">{p.split(/(\{\w+\})/).map((part, i) => (part.startsWith('{') ? <em key={i}>{part}</em> : part))}</span>
);

function CommandCard({ file, c, ctx, onEdit }) {
  return (
    <SpotlightCard className="card cmd-card" theme={ctx.mode} spotlightColor={ctx.dark ? 'rgba(85,152,231,0.25)' : 'rgba(42,120,214,0.12)'}
                   intensity={0.6} spotlightSize={260} borderGlow={0.5} flare={false}>
      <div className="cmd-head">
        <code className="cmd-id">{file}.{c.id}</code>
        {c.risk === 'high' && <span className="risk">{I.warn} High risk</span>}
        <button className="icon-btn" aria-label={`Edit ${file}.${c.id}`} onClick={() => onEdit(file, c)}>{I.edit}</button>
      </div>
      <div className="pats" aria-label="Say it like this">{c.patterns.map(p => <Pattern key={p} p={p} />)}</div>
      <dl className="cmd-meta">
        <div><dt>Does</dt><dd><code>{c.action}</code>{c.params && <> · {c.params}</>}</dd></div>
        {c.when && <div><dt>Only in</dt><dd>{c.when}</dd></div>}
        {c.steps && <div><dt>Steps</dt><dd><ol className="steps">{c.steps.map(s => <li key={s}><code>{s}</code></li>)}</ol></dd></div>}
      </dl>
      <p className="cmd-uses"><span className="num">{c.uses}</span> uses in the last 90 days</p>
    </SpotlightCard>
  );
}

function EditStatus({ s, ctx }) {
  const st = EDIT_STATUS[s];
  return (
    <span className={`edit-st st-${s}`}>
      {st.mark === 'overridden'
        ? <span className="ovr" aria-hidden="true">{I.minus}</span>
        : <StatusMark status={st.mark} size={16} color={ctx.accent} doneColor={ctx.dark ? '#4CC38A' : '#1E8A4C'} errorColor={ctx.dark ? '#F07A73' : '#C2362F'} />}
      {st.word}
    </span>
  );
}

function PendingEdits({ edits, ctx }) {
  return (
    <div className="card pending">
      <div className="card-head">
        <div>
          <h2 className="card-title">Edits from the web</h2>
          <p className="card-sub">Your laptop’s files are the master copy; it applies these on its next sync</p>
        </div>
      </div>
      <AnimatedList items={edits} theme={ctx.mode} accentColor={ctx.accent} frame={false} showGradients={false}
                    width="100%" maxHeight={560} gap={8} radius={10} selectOnHover={false} animation="pop"
                    renderItem={e => (
                      <div className="edit-row">
                        <div className="edit-top"><span className="edit-what">{e.what}</span><code>{e.cmd}</code></div>
                        <div className="edit-bottom"><EditStatus s={e.status} ctx={ctx} /><span className="dim">{e.when}</span></div>
                        {(e.reason || EDIT_STATUS[e.status].note) && <p className="edit-note">{e.reason || EDIT_STATUS[e.status].note}</p>}
                      </div>
                    )} />
    </div>
  );
}

/* the guided form (Doc 07): React Bits Stepper in a dialog */
function GuidedForm({ ctx, init, onClose, onSubmit }) {
  const [file, setFile] = useState(init?.file ?? 'browser');
  const [id, setId] = useState(init?.c.id ?? 'duplicate_tab');
  const [pats, setPats] = useState(init?.c.patterns.join('\n') ?? 'duplicate tab\ncopy this tab');
  const [action, setAction] = useState(init?.c.action ?? 'press_keys');
  const [params, setParams] = useState(init?.c.params ?? 'alt+d, alt+enter');
  const [test, setTest] = useState('duplicate tab');
  const list = pats.split('\n').map(s => s.trim()).filter(Boolean);
  const matches = list.some(p => new RegExp(`^${p.replace(/\{\w+\}/g, '.+')}$`, 'i').test(test.trim()));
  const ref = useRef(null);
  useEffect(() => { ref.current?.querySelector('input, select, textarea')?.focus(); const k = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="gf-title" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" ref={ref}>
        <div className="modal-head">
          <h2 id="gf-title">{init ? `Edit ${init.file}.${init.c.id}` : 'Add a command'}</h2>
          <button className="icon-btn" aria-label="Close" onClick={onClose}>{I.thumbDown}</button>
        </div>
        <Stepper theme={ctx.mode} accentColor={ctx.accent} frame={false} width="100%" radius={12}
                 nextButtonText="Continue" completeButtonText="Send to laptop"
                 onFinalStepCompleted={() => onSubmit({ what: init ? 'Edit' : 'Add', cmd: `${file}.${id}` })}>
          <Step title="Where">
            <div className="gf">
              <label className="field">File<select className="input" value={file} onChange={e => setFile(e.target.value)}>{FILES.map(f => <option key={f}>{f}</option>)}</select></label>
              <label className="field">Command id<input className="input mono" value={id} onChange={e => setId(e.target.value.replace(/[^a-z0-9_]/g, ''))} /></label>
              <p className="hint">Lowercase letters, digits and _ only. It becomes <code>{file}.{id || '…'}</code>.</p>
            </div>
          </Step>
          <Step title="Say it like this">
            <div className="gf">
              <label className="field">One sentence per line<textarea className="input ta" rows={4} value={pats} onChange={e => setPats(e.target.value)} /></label>
              <p className="hint">Put a changing part in braces, like <code>{'{query}'}</code> or <code>{'{app}'}</code>.</p>
            </div>
          </Step>
          <Step title="What it does">
            <div className="gf">
              <label className="field">Action<select className="input" value={action} onChange={e => setAction(e.target.value)}>{PRIMITIVES.map(p => <option key={p}>{p}</option>)}</select></label>
              <label className="field">Details<input className="input mono" value={params} onChange={e => setParams(e.target.value)} /></label>
              <p className="hint">Only actions your laptop already has are offered, so the edit cannot run anything new.</p>
            </div>
          </Step>
          <Step title="Check">
            <div className="gf">
              <dl className="review-dl">
                <div><dt>Command</dt><dd><code>{file}.{id}</code></dd></div>
                <div><dt>Sentences</dt><dd>{list.map(p => <Pattern key={p} p={p} />)}</dd></div>
                <div><dt>Does</dt><dd><code>{action}</code> · {params}</dd></div>
              </dl>
              <label className="field">Try a sentence<input className="input" value={test} onChange={e => setTest(e.target.value)} /></label>
              <p className={`test ${matches ? 'ok' : 'no'}`}>{matches ? <>{I.ok} Matches this command</> : <>{I.q} Doesn’t match any of its sentences</>}</p>
            </div>
          </Step>
        </Stepper>
      </div>
    </div>
  );
}

function CommandsData({ ctx }) {
  const [file, setFile] = useState('core');
  const [edits, setEdits] = useState(EDITS0);
  const [form, setForm] = useState(null);
  const submit = e => {
    setForm(null);
    setEdits([{ id: `e${Date.now()}`, ...e, when: 'Just now', status: 'waiting' }, ...edits]);
    ctx.say('Sent to your laptop', `${e.what === 'Add' ? 'Adding' : 'Changing'} ${e.cmd}. It is applied and checked on the laptop’s next sync.`, { icon: I.ok });
  };
  return (
    <>
      <section className="card shelf" aria-label="Command files">
        <div className="card-head">
          <div><h2 className="card-title">Command files</h2><p className="card-sub">One file per area, read from the latest snapshot. Open one to see its commands.</p></div>
        </div>
        <div className="folders">
          {FILES.map(f => (
            <div key={f} className={`folder-slot${f === file ? ' on' : ''}`}>
              <Folder label={`${f}.yaml`} theme={ctx.mode} color={ctx.dark ? '#2A78D6' : '#5598E7'} paperColor={ctx.dark ? '#E6EBF2' : '#FFFFFF'}
                      size={0.62} open={f === file} onOpenChange={o => o && setFile(f)} intro={false} draggable={false}
                      zoomOnClick={false} peek={!ctx.reduced} tilt={ctx.reduced ? 0 : 0.5} closeOnOutsideClick={false}
                      items={LIB[f].slice(0, 3).map(c => ({ title: c.id }))} />
              <button className="folder-name" aria-pressed={f === file} onClick={() => setFile(f)}>
                <b>{f}</b><span className="num">{LIB[f].length} commands</span>
              </button>
            </div>
          ))}
        </div>
      </section>
      <section className="cmd-layout">
        <div>
          <div className="cmd-list-head">
            <h2 className="card-title"><code>{file}.yaml</code></h2>
            <span className="dim">{LIB[file].length} commands · {file === 'routines' ? 'each runs several steps' : 'in file order (earlier wins a tie)'}</span>
            <button className="btn btn-primary add-btn" onClick={() => setForm({})}>{I.plus} Add a command</button>
          </div>
          <div className="cmd-grid">
            {LIB[file].map(c => <CommandCard key={c.id} file={file} c={c} ctx={ctx} onEdit={(f, cc) => setForm({ file: f, c: cc })} />)}
          </div>
        </div>
        <PendingEdits edits={edits} ctx={ctx} />
      </section>
      {form && <GuidedForm ctx={ctx} init={form.c ? form : null} onClose={() => setForm(null)} onSubmit={submit} />}
    </>
  );
}

function CommandsLoading({ ctx }) {
  return (
    <>
      <section className="card shelf"><div className="card-head"><div><h2 className="card-title">Command files</h2><LoadingNote what="your command files" mode={ctx.mode} /></div></div>
        <div className="folders">{FILES.map(f => <div key={f} className="folder-slot"><Skel w={139} h={110} r={10} /><Skel w={90} /></div>)}</div>
      </section>
      <section className="cmd-layout"><div className="cmd-grid">{[0, 1, 2, 3].map(i => <div key={i} className="card cmd-card skel-card"><Skel w={120} /><Skel w="80%" h={24} /><Skel w="60%" h={24} /><Skel w="50%" /></div>)}</div>
        <div className="card pending skel-card"><Skel w={160} /><Skel w="90%" h={50} /><Skel w="90%" h={50} /></div></section>
    </>
  );
}

function Commands(ctx) {
  const { state } = ctx;
  return (
    <>
      <PageHead title="Commands" art={<h2 className="phead-h">Commands</h2>}
                sub={state === 'data' ? 'Everything you can say, from the laptop’s command files (snapshot from 3 minutes ago).' : 'Everything you can say, from the laptop’s command files.'} />
      {state === 'data' && <CommandsData ctx={ctx} />}
      {state === 'loading' && <CommandsLoading ctx={ctx} />}
      {state === 'waking' && <WakingPanel ctx={ctx} since={ctx.review.since} what="Your commands" />}
      {state === 'error' && <ErrorPanel ctx={ctx} what="your command files" endpoint="GET /v1/library" />}
      {state === 'empty' && (
        <EmptyPanel ctx={ctx} title="No command files yet"
          body="The laptop uploads a snapshot of its command files on its first sync. Until then there is nothing to show or edit here; the commands themselves already work on the laptop."
          action={<button className="btn btn-primary" onClick={() => goPage('devices', ctx.choice)}>{I.devices} Connect your laptop</button>}>
          <div className="empty-folders" aria-hidden="true">
            <Folder label="core.yaml" theme={ctx.mode} color={ctx.dark ? '#33404F' : '#C9CED8'} size={0.9} intro={!ctx.reduced}
                    draggable={false} zoomOnClick={false} items={[]} />
          </div>
        </EmptyPanel>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Shell page="commands" render={ctx => <Commands {...ctx} />} />);
