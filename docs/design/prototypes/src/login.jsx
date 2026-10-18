/* ================= Login: the welcome ================= */

const ERR_KINDS = [['wrong', 'Wrong password'], ['locked', 'Locked out'], ['server', 'Server error']];

function LockCountdown({ ctx }) {
  const [left, setLeft] = useState(15 * 60 - 1);
  useEffect(() => { const t = setInterval(() => setLeft(l => Math.max(0, l - 1)), 1000); return () => clearInterval(t); }, []);
  const m = Math.floor(left / 60), s = left % 60;
  return (
    <div className="lock" role="timer" aria-label={`Try again in ${m} minutes ${s} seconds`}>
      <span aria-hidden="true" className="lock-digits">
        <Counter value={m} minDigits={2} fontSize={40} fontWeight={600} intro={false} motionBlur={!ctx.reduced} />
        <span className="lock-colon">:</span>
        <Counter value={s} minDigits={2} fontSize={40} fontWeight={600} intro={false} motionBlur={!ctx.reduced} />
      </span>
    </div>
  );
}

function LoginCard({ ctx }) {
  const { state, review } = ctx;
  const [user, setUser] = useState('sanidhya');
  const [pw, setPw] = useState(state === 'error' ? 'hunter22' : '');
  const [show, setShow] = useState(false);
  const [kind, setKind] = useState('wrong');
  const [missing, setMissing] = useState(false);
  const submit = e => {
    e.preventDefault();
    if (!pw) { setMissing(true); return; }
    setMissing(false);
    review.go('loading');
    setTimeout(() => goPage('overview', ctx.choice), 1100);
  };

  if (state === 'empty') {
    return (
      <div className="login-card card">
        <h1 className="login-h">No account yet</h1>
        <p className="login-p">Listen has no sign-up page: it is a one-person app, and an open sign-up form would only be an open door.
          Create your account once, on the server:</p>
        <div className="cmdline"><code>python -m app.cli create-user</code>
          <button className="icon-btn" aria-label="Copy the command" onClick={() => ctx.say('Command copied', 'Run it in the server’s shell, then come back and log in.', { icon: I.copy })}>{I.copy}</button>
        </div>
        <p className="login-fine">It asks for a username and a password and stores only a hash of the password.</p>
        <button className="btn btn-primary wide" onClick={() => review.go('data')}>I’ve created it, log in</button>
      </div>
    );
  }

  const busy = state === 'loading' || state === 'waking';
  const locked = state === 'error' && kind === 'locked';
  return (
    <form className="login-card card" onSubmit={submit} noValidate>
      <h1 className="login-h">Log in</h1>
      <p className="login-p">Your commands, apps and insights from the laptop.</p>

      {state === 'error' && (
        <div className="review-sub" role="group" aria-label="Error kind (review only)">
          {ERR_KINDS.map(([k, l]) => <button type="button" key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>{l}</button>)}
        </div>
      )}
      {state === 'error' && kind === 'wrong' && (
        <div className="msg bad" role="alert"><span>{I.x}</span><div><b>Username or password is incorrect.</b> Check both and try again.</div></div>
      )}
      {state === 'error' && kind === 'server' && (
        <div className="msg bad" role="alert"><span>{I.cloudOff}</span><div><b>The server didn’t answer.</b> Your details were not checked. Try again in a moment.</div></div>
      )}
      {locked && (
        <div className="msg warn" role="alert">
          <span>{I.lock}</span>
          <div><b>Too many attempts. Try again in 15 minutes.</b> This protects your account; waiting is the only way to unlock it.</div>
        </div>
      )}
      {locked && <LockCountdown ctx={ctx} />}

      <label className="field">Username
        <input className="input" autoComplete="username" value={user} onChange={e => setUser(e.target.value)} disabled={busy || locked} />
      </label>
      <label className="field">Password
        <span className="pw">
          <input className="input" type={show ? 'text' : 'password'} autoComplete="current-password" value={pw}
                 aria-invalid={missing || (state === 'error' && kind === 'wrong') || undefined}
                 onChange={e => { setPw(e.target.value); setMissing(false); }} disabled={busy || locked} />
          <button type="button" className="icon-btn" aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}
                  onClick={() => setShow(!show)} disabled={busy || locked}>{show ? I.eyeOff : I.eye}</button>
        </span>
        {missing && <span className="field-err">{I.warn} Enter your password.</span>}
      </label>

      {state === 'waking' ? (
        <div className="login-wait" aria-live="polite">
          <WakeLine ctx={ctx} />
          <p>Waking up the server… This can take up to a minute on the free tier. You are logged in as soon as it answers.</p>
        </div>
      ) : state === 'loading' ? (
        <div className="login-wait" aria-live="polite">
          <LatticeLoader label="Logging in" pattern="orbit" grid={3} cellSize={6} gap={2} fontSize={14} color={ctx.accent} showTimer={false} />
        </div>
      ) : (
        <SpecularButton type="submit" size="md" radius={ctx.dark ? 8 : 10} className="login-btn" disabled={locked}
                        tint={ctx.accent} tintOpacity={1} textColor={ctx.dark ? '#0B1118' : '#FFFFFF'}
                        lineColor="#FFFFFF" baseColor={ctx.accent} intensity={ctx.reduced ? 0 : 1}
                        idleIntensity={ctx.reduced ? 0 : 0.35} autoAnimate={false}>Log in</SpecularButton>
      )}
      <p className="login-fine">Accounts are created on the server, so there is no sign-up or password reset here.</p>
    </form>
  );
}

function WakeLine({ ctx }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 100); return () => clearInterval(t); }, []);
  return <LatticeLoader label="Waking up the server" pattern="orbit" grid={3} cellSize={6} gap={2} fontSize={14}
                        color={ctx.accent} elapsed={Math.max(0, (now - ctx.review.since) / 1000)} />;
}

function Login(ctx) {
  const { dark, accent } = ctx;
  return (
    <div className="login">
      <div className="login-bg" aria-hidden="true">
        <LineWaves color1={accent} color2={dark ? '#9EC5F4' : '#86B6EF'} color3={dark ? '#2A78D6' : '#104281'}
                   lightMode={!dark} speed={ctx.reduced ? 0 : 0.18} lineCount={46} lineWidth={1.1} glow={dark ? 0.5 : 0.2}
                   brightness={dark ? 0.75 : 0.9} warpIntensity={0.8} rotation={-24} edgeFade={0.35}
                   opacity={dark ? 0.55 : 0.45} enableMouseInteraction={!ctx.reduced} clickRipple={false} intro={!ctx.reduced} />
      </div>
      <section className="login-brand">
        <div className="login-tech">
          <TechText text="Listen" fontWeight={600} fontSize={132} reveal="letter" dashLength={4} dashGap={2}
                    specks={15} intro="none" introDuration={2} clickKick guides={false} fontFamily=""
                    letterSpacing={-0.05} accentColor={accent} reach={200} softness={0.7} lineStyle="dashed"
                    strokeWidth={1.5} speed={1} bounce={0.4} selection labels color="currentColor" align="left"
                    draggable sweep />
        </div>
        <p className="login-tag">What you said to your laptop, what it did, and how well it understood you.</p>
      </section>
      <LoginCard key={ctx.state} ctx={ctx} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Shell page="login" bare render={ctx => <Login {...ctx} />} />);
