/* ================= Devices & settings ================= */

const DEVICES0 = [
  { id: 'd2', name: 'SANIDHYA-LAPTOP', created: '2 Sep 2026', sync: '3 minutes ago', state: 'ok' },
  { id: 'd1', name: 'OLD-DESKTOP', created: '14 Mar 2026', sync: '11 Aug 2026', state: 'revoked', revoked: '12 Aug 2026' }
];
const TOKEN = 'lsn_dev_7Hq2xV9pK4mR8tW1zB6nC3yF5gJ0aL2e';

function DeviceRow({ d, ctx, onRevoke }) {
  const [confirm, setConfirm] = useState(false);
  const revoked = d.state === 'revoked';
  return (
    <li className={`dev${revoked ? ' revoked' : ''}`}>
      <span className="dev-ico" aria-hidden="true">{I.devices}</span>
      <div className="dev-main">
        <div className="dev-name"><code>{d.name}</code>
          {d.state === 'ok' && <span className="status good">{I.ok}Syncing</span>}
          {d.state === 'new' && <span className="status warn">{I.q}Waiting for first sync</span>}
          {revoked && <span className="status muted">{I.minus}Revoked {d.revoked}</span>}
        </div>
        <p className="dev-meta">Token created {d.created} · {d.state === 'new' ? 'has not synced yet' : `last synced ${d.sync}`}</p>
      </div>
      {!revoked && !confirm && <button className="btn" onClick={() => setConfirm(true)}>Revoke…</button>}
      {!revoked && confirm && (
        <div className="revoke-box">
          <p>Its token stops working immediately. The laptop keeps its data but cannot sync until you give it a new token.</p>
          <div className="revoke-actions">
            <button className="btn btn-ghost" onClick={() => setConfirm(false)}>Keep it</button>
            <HoldButton holdTime={1200} size="sm" radius={8} doneLabel="Revoked" glow={false}
                        backgroundColor={ctx.dark ? '#1F2935' : '#EEF0F3'} fillColor={ctx.dark ? '#F07A73' : '#C2362F'}
                        textColor={ctx.dark ? '#E6EBF2' : '#1D2330'} fillTextColor={ctx.dark ? '#0B1118' : '#FFFFFF'}
                        onHold={() => setTimeout(() => onRevoke(d), 500)}>Hold to revoke</HoldButton>
          </div>
        </div>
      )}
    </li>
  );
}

/* create a token: it is shown once, on a ticket you tear off when it's saved */
function NewToken({ ctx, onDone }) {
  const [step, setStep] = useState('name');
  const [name, setName] = useState('SANIDHYA-LAPTOP-2');
  const [copied, setCopied] = useState(false);
  if (step === 'name') {
    return (
      <form className="new-dev" onSubmit={e => { e.preventDefault(); setStep('ticket'); }}>
        <label className="field">Device name<input className="input mono" value={name} onChange={e => setName(e.target.value.toUpperCase())} /></label>
        <SpecularButton type="submit" size="sm" radius={8} tint={ctx.accent} tintOpacity={1} textColor={ctx.dark ? '#0B1118' : '#FFFFFF'}
                        lineColor="#FFFFFF" baseColor={ctx.accent} intensity={ctx.reduced ? 0 : 1} idleIntensity={ctx.reduced ? 0 : 0.3}>
          {I.key} Create token
        </SpecularButton>
      </form>
    );
  }
  return (
    <div className="ticket-wrap">
      <div className="msg warn" role="note"><span>{I.warn}</span><div><b>Copy it now. This token is shown only once.</b> Listen keeps only a hash of it, so nobody (you included) can see it again. Lost it? Revoke the device and create a new one.</div></div>
      <TearTicket width={640} height={190} stubSize={150} radius={ctx.dark ? 8 : 12} holes={10}
                  background={ctx.dark ? '#1F2935' : '#FFFFFF'} color={ctx.dark ? '#E6EBF2' : '#1D2330'}
                  borderColor={ctx.dark ? '#33404F' : '#C9CED8'} tilt={!ctx.reduced} rotate={ctx.reduced ? 0 : 4}
                  ariaLabel="Tear off: I have saved the token" onTear={() => setTimeout(() => onDone(name), 700)}
                  stub={<div className="stub"><span>Saved it?</span><b>Tear here</b><small>or press Enter</small></div>}>
        <div className="ticket">
          <span className="ticket-label">Device token for <code>{name}</code></span>
          <code className="token" aria-label={`Token: ${TOKEN}`}>
            <DecryptedText text={TOKEN} animateOn="view" sequential revealDirection="start" speed={24}
                           useOriginalCharsOnly={false} characters="abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ" />
          </code>
          <div className="ticket-actions">
            <button className="btn btn-primary" onClick={() => { setCopied(true); ctx.say('Token copied', 'Paste it into LISTEN_DEVICE_TOKEN in the agent’s .env, then start the agent.', { icon: I.copy }); }}>
              {copied ? I.ok : I.copy} {copied ? 'Copied' : 'Copy token'}
            </button>
            <span className="ticket-hint">Goes into <code>LISTEN_DEVICE_TOKEN</code> in the agent’s <code>.env</code></span>
          </div>
        </div>
      </TearTicket>
    </div>
  );
}

/* theme: the same choice as the header switch (one state in the shell), shown with what each look is */
const THEMES = [
  { value: 'system', label: 'Windows', icon: I.monitor },
  { value: 'light', label: 'Light', icon: I.sun },
  { value: 'dark', label: 'Dark', icon: I.moon }
];
function Appearance({ ctx }) {
  const winWord = ctx.systemDark ? 'dark' : 'light';
  const line = ctx.choice === 'system'
    ? <>Following Windows, which is set to <b>{winWord}</b> right now. Change it there and Listen follows.</>
    : <>Always {ctx.choice}, whatever Windows is set to.</>;
  return (
    <div className="card side appearance">
      <h2 className="card-title" id="theme-title">Appearance</h2>
      <JellyRadio items={THEMES.map(t => ({ ...t, icon: <span className="jr-ico">{t.icon}</span> }))} value={ctx.choice}
                  onChange={v => ctx.setChoice(v)} ariaLabel="Theme" size="md" gap={6} radius={10}
                  chipColor="var(--surface-2)" activeColor="var(--accent)" textColor="var(--ink-2)" activeTextColor="var(--on-accent)"
                  swell={ctx.reduced ? 0 : 0.12} barge={ctx.reduced ? 0 : 4} jelly={ctx.reduced ? 0 : 1} className="theme-radio" />
      <p className="fine theme-line" aria-live="polite">{line}</p>
      <div className="looks" aria-hidden="true">
        {[['light', 'Quiet Ledger', 'Instrument Sans'], ['dark', 'Signal Desk', 'IBM Plex']].map(([m, name, font]) => (
          <div key={m} className={`look look-${m}${ctx.mode === m ? ' on' : ''}`}>
            <div className="look-face"><span className="look-aa">Aa</span><span className="look-n">52 h</span><i /></div>
            <div className="look-cap"><b>{name}</b><span>{m === 'light' ? 'Light' : 'Dark'} · {font}</span>{ctx.mode === m && <em>On now</em>}</div>
          </div>
        ))}
      </div>
      <p className="sr-only">Showing {ctx.mode === 'dark' ? 'Signal Desk, the dark look' : 'Quiet Ledger, the light look'}.</p>
      <p className="fine">The switch at the top of every page is the same setting.</p>
    </div>
  );
}

function DevicesData({ ctx, first }) {
  const [devices, setDevices] = useState(first ? [] : DEVICES0);
  const [adding, setAdding] = useState(first);
  const [k, setK] = useState(0);
  const revoke = d => {
    setDevices(devices.map(x => (x.id === d.id ? { ...x, state: 'revoked', revoked: '17 Oct 2026' } : x)));
    ctx.say(`${d.name} revoked`, 'Its token no longer works. Create a new token to connect it again.', { icon: I.lock });
  };
  const done = name => {
    setDevices([{ id: `d${Date.now()}`, name, created: '17 Oct 2026', sync: '', state: 'new' }, ...devices]);
    setAdding(false); setK(k + 1);
    ctx.say('Device added', `${name} appears as “Syncing” after its first sync.`, { icon: I.ok });
  };
  return (
    <section className="dev-layout">
      <div className="dev-col">
        <div className="card">
          <div className="card-head">
            <div><h2 className="card-title">Your devices</h2><p className="card-sub">Each laptop syncs with its own token</p></div>
            {!adding && <button className="btn btn-primary" onClick={() => setAdding(true)}>{I.plus} Add a device</button>}
          </div>
          {devices.length ? (
            <ul className="dev-list">{devices.map(d => <DeviceRow key={d.id} d={d} ctx={ctx} onRevoke={revoke} />)}</ul>
          ) : (
            <p className="dev-none">No devices yet. Create a token below and paste it into the agent on your laptop.</p>
          )}
        </div>
        {adding && (
          <div className="card add-card">
            <div className="card-head">
              <div><h2 className="card-title">Add a device</h2><p className="card-sub">Name it, create its token, paste the token into the agent</p></div>
              {!first && <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>}
            </div>
            <ol className="how">
              <li><b>Create a token</b> for this laptop.</li>
              <li><b>Paste it</b> into <code>LISTEN_DEVICE_TOKEN</code> in the agent’s <code>.env</code>.</li>
              <li><b>Start the agent.</b> It syncs within a minute and shows up above.</li>
            </ol>
            <NewToken key={k} ctx={ctx} onDone={done} />
          </div>
        )}
      </div>
      <aside className="dev-col">
        <div className="card side">
          <h2 className="card-title">Your session</h2>
          <dl className="kv">
            <div><dt>Logged in as</dt><dd>sanidhya</dd></div>
            <div><dt>This browser</dt><dd>since today 09:12</dd></div>
            <div><dt>Data refresh</dt><dd>every 5 minutes, and when you come back to the tab</dd></div>
          </dl>
          <button className="btn wide-btn" onClick={() => goPage('login', ctx.choice)}>{I.logout} Log out</button>
          <p className="fine">Logging out ends this browser’s session only. Your laptop keeps syncing with its token.</p>
        </div>
        <Appearance ctx={ctx} />
      </aside>
    </section>
  );
}

function DevicesLoading({ ctx }) {
  return (
    <section className="dev-layout">
      <div className="card skel-block"><LoadingNote what="your devices" mode={ctx.mode} />{[0, 1].map(i => <div key={i} className="skel-dev"><Skel w={36} h={36} r={8} /><div><Skel w={200} /><Skel w={280} h={11} /></div></div>)}</div>
      <aside className="dev-col"><Appearance ctx={ctx} /></aside>
    </section>
  );
}

function Devices(ctx) {
  const { state } = ctx;
  return (
    <>
      <PageHead title="Devices & settings" art={<h2 className="phead-h">Devices &amp; settings</h2>}
                sub="Your laptop, the token that lets it sync, and this browser’s session." />
      {state === 'data' && <DevicesData ctx={ctx} />}
      {state === 'empty' && <DevicesData ctx={ctx} first />}
      {state === 'loading' && <DevicesLoading ctx={ctx} />}
      {state === 'waking' && <WakingPanel ctx={ctx} since={ctx.review.since} what="Your devices" />}
      {state === 'error' && <ErrorPanel ctx={ctx} what="your devices" endpoint="GET /v1/devices" />}
      {/* the theme lives in this browser, not on the server: it stays usable while the server sleeps or fails */}
      {(state === 'waking' || state === 'error') && <div className="dev-offline"><Appearance ctx={ctx} /></div>}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Shell page="devices" render={ctx => <Devices {...ctx} />} />);
