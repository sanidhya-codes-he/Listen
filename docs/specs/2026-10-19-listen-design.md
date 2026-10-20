# Listen: design specification

**Date:** 2026-10-19
**Status:** draft for owner review
**Sources:** design sections 1 to 8, explained in `docs/learning/01` to `09` (PDFs). This spec is
the single source of truth for building. Where an older learning doc disagrees with this spec,
this spec wins (for example, Doc 01's first sketch put the command library's master copy in the
cloud; it is now the laptop, see §6).

---

## 1. What Listen is

A lightweight Windows voice assistant with usage analytics.

- **Agent (laptop):** listens through the microphone, turns speech into commands ("search what is
  an atom", "open vs code", "dsa"), runs them, and tracks which apps and sites you use.
- **Server (cloud):** receives synced data, serves analytics and a documented API.
- **Web app (browser):** shows analytics and lets you review history, manage commands and devices.

### 1.1 Requirements that drive the design

| Kind | Requirement |
|---|---|
| Functional | Three listening modes: wake word (default), continuous (toggle), push-to-talk (hotkey) |
| Functional | Commands: open, search, close, volume, play (default apps when none named), routines, undo |
| Functional | Add and edit commands without code: YAML files, an AI command builder, a web guided form |
| Functional | Track foreground app and, for browsers, the site; show analytics in a web app; public API |
| Non-functional | **Lightweight** on a 16 GB laptop with integrated graphics (agent only) |
| Non-functional | **Private**: raw transcripts, overheard speech and raw window titles never leave the laptop |
| Non-functional | **Offline**: commands work and nothing is lost without internet |
| Non-functional | **Fast**: under about 1.5 s from end of speech to action |
| Non-functional | **Learnable**: first project; debuggability beats cleverness |

### 1.2 Out of scope for v1

- Spoken replies (feedback is chimes and pop-ups only).
- Languages other than English.
- YouTube autoplay (`play` opens search results).
- Phone layouts for the web app (laptop only, 1280 px and up).
- Multi-user features (but every row carries `user_id` from day one).
- System tray shell (terminal first; tray later).
- Chrome profiles in routines (planned for the end; the format leaves room, §3.8).

---

## 2. Architecture

```
Laptop: one Python process (modular monolith)            Cloud
  mic -> voice -> event bus -> intent -> executor         FastAPI  <-> PostgreSQL
                     |            |                          ^
                  usage        storage (SQLite) <-> sync ----+  HTTPS, POST /v1/sync every 5 min
                                                          React SPA (browser) -> FastAPI only
```

- **Modular monolith on the laptop:** one process, modules with clean boundaries, one worker
  thread and one inbox queue per module, communicating through an in-memory event bus
  (publish/subscribe). Chosen over microservices (too heavy) and a thin cloud agent (breaks
  offline and privacy).
- **Local-first, selective sync:** everything is written to SQLite first; only syncable tables
  ever go to the cloud.
- **API-first:** the web app uses only the public API (`/v1/...`), like any third-party client.
- **Pluggable interfaces:** `AudioTrigger` (wake word / continuous / push-to-talk),
  `SpeechEngine` (faster-whisper offline default; cloud STT optional, not built in v1),
  `CommandBuilder` (AI builder on the laptop / guided form), `Shell` (terminal v1 / tray later).
- **Lightweight by gating:** cheap work always runs (VAD), expensive work (wake word, then
  speech-to-text) only when the cheaper stage says so.

### 2.1 Repository layout (monorepo)

```
Listen/
  agent/            Python package listen_agent: core, voice, intent, actions, usage, storage, sync, shell
  server/           FastAPI app: routes, services, models; Alembic migrations
  web/              React + TypeScript (Vite): src/api, pages, components, charts, styles
  commands/         YAML command and routine files (the master copy, versioned in git)
  shared/           recipe.schema.json: the one definition of a valid command
  docs/             learning/ (PDFs), specs/, design/prototypes/
  .github/workflows/ci.yml
```

Secrets live in git-ignored `.env` files (`agent/.env`, `server/.env`); `.env.example` files list
the names. Local data (`*.db`), logs, and voice test clips are git-ignored.

---

## 3. Commands and intent (Doc 03)

### 3.1 Command files

- Folder `commands/`, one YAML file per area (`core.yaml`, `browser.yaml`, `terminal.yaml`,
  `media.yaml`, `routines.yaml`), all loaded together.
- Three sections: `targets` (places with per-verb URLs), `defaults` (verb -> target, e.g.
  `search: google`, `play: youtube`), `commands` (id, patterns, action, params, optional
  `when_app`, `focus_first`, `risk`, `continuous`, `undo`).
- Validated against `shared/recipe.schema.json` on every load. **Invalid entries are skipped with
  a warning naming file and line; valid ones still load.** If a whole file cannot be parsed, the
  last good version of that file stays in use.
- **Hot reload:** the folder's modification times are checked every 2 s.
- Developer commands: `python -m listen_agent commands check` (validate all files) and
  `python -m listen_agent commands try "<sentence>" [--app "<app>"]` (dry run).

### 3.2 Slots

| Slot | Accepts |
|---|---|
| `{query}` | any text, at least one word |
| `{target}` | only names defined in `targets` |
| `{app}` | an app in the app index (fuzzy) or an alias; a target name opens its `home` URL |
| `{number}` | digits or number words |

### 3.3 Matching (a pure function)

1. **Normalise:** lowercase; strip STT punctuation (keep `+` and `'`); remove a leaked wake word;
   remove polite filler at start/end ("please", "can you", "could you", "for me"); collapse spaces.
2. Each pattern is compiled to an **anchored** regex (`^...$`).
3. Collect every full match whose slots pass type validation (a failed slot rejects that
   candidate only).
4. Pick the **most specific** candidate: most literal words; a `when_app` command that applies is
   more specific than one without; ties go to the earlier entry in file order.
5. Fill a missing `{target}` from `defaults`; if the target lacks a URL for that verb, return a
   clear error, never a guess.
6. No candidate -> `IntentNotMatched` (logged; listed as "sentences that didn't match").

URL values are URL-encoded. Matching must run in under 5 ms.

### 3.4 App index

Built at start-up from Start Menu shortcut folders (display name -> launch target), refreshed
daily and on "refresh apps". Aliases in the command files. `{app}` uses `difflib` similarity with
threshold **0.8** (tunable).

### 3.5 Action primitives (an allowlist)

`open_url`, `launch_app`, `close_app` (polite close, like clicking X), `set_volume`,
`change_volume`, `toggle_mute`, `press_keys`, `focus_app`.

- Primitives live one per file in `listen_agent/actions/primitives/`, registered with an
  `@primitive(name, params=...)` decorator; all files in the folder are imported at start-up.
- There is **no** "run any program" primitive.
- `press_keys` **requires** `when_app`, refuses system combinations (`win+r`, `win+x`,
  `ctrl+alt+del`), and cannot type free text. The AI builder's `press_keys` proposals are
  highlighted for approval.
- The agent reports its primitive list and app names in each command snapshot (§6.4).

### 3.6 Confidence thresholds and risk

- Two scores: **hearing confidence** (from Whisper) and **match confidence** (1.0 exact; lower for
  fuzzy app/target).
- Below either threshold -> do nothing, "didn't catch that".
- Each command has `risk: low` (default) or `high` (closing apps); high risk needs higher scores.
- Starting values are placeholders, **calibrated** from 1 to 2 weeks of marked right/wrong data
  (§5.4).

### 3.7 Continuous mode

Commands run **without the wake word**. Guardrails apply only in continuous mode:

1. Standalone sentence: surrounded by short silence and **at most 8 words**.
2. Stricter thresholds than wake-word mode.
3. Per-command `continuous: allow | confirm | block`. Default `allow`; **`close_app` commands
   default to `confirm`**; **routines run immediately** (`allow`).
4. Busy-room switch: off by hotkey or "continuous off"; automatic fallback to wake-word mode when
   speech fills more than about 60% of the last minute.

Continuous mode is **quiet**: no "listening" or "not caught" chimes or pop-ups and no ducking; only
the "done" chime and pop-up when a command runs (and the question chime for `confirm` commands).
Unmatched sentences in continuous mode go to the private `continuous_log`, not `commands`.

### 3.8 Routines

A command with `steps:` (a list of primitive calls) instead of one action. Steps run in order with
a short pause; a failed step does not stop the others ("Routine DSA: 2 of 3 steps done; CLion not
found"). Later: an `open_url` step may take `browser` and `profile` from a fixed list of defined
Chrome profiles (only the profile flag, never arbitrary arguments).

### 3.9 Undo (single level)

- After a **successful** action, store its inverse in one undo slot.
- "Undo" within **60 s** reverses it and empties the slot.
- The slot is replaced only by the next successfully executed command. Misheard/unmatched
  sentences and meta-commands ("undo", "that's wrong") never replace it.
- No reliable inverse -> "I can't undo that", nothing done.

| Action | Undo |
|---|---|
| volume / mute | restore previous state exactly |
| `launch_app` | close the instance Listen started, by process id |
| `press_keys` | only if the command declares `undo: { keys: ... }` |
| `close_app`, `open_url` | can't undo |
| routine | reverse undoable steps newest first; report the rest |

### 3.10 Command builder

- **AI builder on the laptop, using Google Gemini** (the `google-genai` Python SDK). It reads
  `GEMINI_API_KEY` from `agent/.env`, which the owner adds when it is first needed (never
  committed). The model name is a setting (`ai_builder.model` in `agent/settings.yaml`), chosen at
  build time, so it can change without code changes. The builder talks to Gemini through the
  `CommandBuilder` interface, so swapping providers later only means adding one implementation. It receives the request, current files, schema and primitive
  list, and returns a **proposed change** (not a rewritten file). The proposal is schema-checked and
  tried on example sentences; the owner sees a diff and approves. Nothing is saved before "yes".
  No key -> builder disabled with a message; API error -> nothing written.
- **Guided form:** offline fallback on the laptop, and the only editor in the web app.

---

## 4. Agent internals (Doc 04)

### 4.1 Threads (one inbox queue each)

| Thread | Job |
|---|---|
| Audio capture | 30 ms chunks from the mic into the audio queue; nothing else |
| Listener | VAD + wake word; the state machine (§4.2) |
| Transcriber | Whisper, one recording at a time |
| Intent | Matching and confirmations |
| Executor | Actions, routines, the undo slot |
| Feedback | Chimes, pop-ups, ducking |
| Usage | Foreground window every 2 s (§5.5) |
| Storage | The **only** SQLite writer; batches every second |
| Housekeeping | Every 2 s: default mic changed? command files changed? |
| Hotkeys | Push-to-talk and continuous on/off |
| Sync | §6 |

Every worker loop runs inside an error handler: an error is logged, published as `ModuleError`, and
the loop continues. Behind that, a **supervisor** thread checks every 5 s:

- **Dead thread** (`is_alive()` is false): a Python thread cannot be restarted, so the supervisor
  starts a **new thread running the same worker object with the same inbox queue**. Queued
  messages are kept; only the message being handled when it died is lost (and logged).
- **Restart limit:** at most **3 restarts per thread per minute**. Beyond that (a crash loop), the
  supervisor exits the agent with an error code and the launcher takes over (§9.1).
- **Hung thread (heartbeat):** every worker records a heartbeat timestamp on each loop pass;
  loops wait on their queue with a 1 s timeout, so an idle worker still beats every second. A
  worker silent for **30 s** is treated as hung. Python cannot safely kill a thread, so the
  supervisor exits the agent with an error code and the launcher restarts the process.
- Exception: the transcriber may legitimately run for a few seconds per recording; its heartbeat
  is also updated before and after each transcription, and 30 s is well above its worst case.

Escalation chain: thread error -> caught in the loop; thread dies -> new thread (max 3/min);
thread hangs or crash-loops -> process exits; process exits -> launcher restarts it (max 3 in
10 min, then stops with a pop-up).

### 4.2 Listener state machine

`Idle -> Capturing` on wake word (only on VAD-speech chunks) / hotkey pressed / speech in
continuous mode. `Capturing -> Transcribing` on **0.7 s silence** (to be tested 0.5 to 0.9 s) /
hotkey released / 8 s max. `Transcribing -> Idle` when done, or `-> Awaiting yes/no` (up to 8 s,
no wake word needed; "yes" runs, "no" or timeout cancels). A **0.3 s pre-roll buffer** is prepended
to every recording. While a chime plays, the listener ignores the mic.

### 4.3 Events (frozen dataclasses, each with a creation timestamp)

`WakeWordDetected`, `CaptureStarted`, `CaptureEnded`, `UtteranceCaptured`, `Transcribed`,
`HeardInContinuous`, `IntentMatched`, `IntentNotMatched`, `ConfirmationRequested`,
`CommandExecuted`, `CommandFailed`, `UndoPerformed`, `ForegroundChanged`, `ModeChanged`,
`MicrophoneChanged`, `ModuleError`.

### 4.4 Speech

- Wake word: openWakeWord ("Hey Jarvis"). VAD before it.
- STT: faster-whisper, `tiny.en` vs `base.en` in `int8`, chosen by benchmark (§9.4).
- Microphone: always the Windows default input. Housekeeping refreshes the audio library's device
  list (known caching quirk) and compares every 2 s; on change, reopen the stream, publish
  `MicrophoneChanged`, pop-up "Now listening on: ...". No mic -> wait and retry.

### 4.5 Feedback

- Four chimes via `winsound`: listening, done, question, not caught.
- Windows notifications (bottom right; kept in Action Center).
- **Ducking:** lower other apps' audio sessions (not master, not Listen's own) to 20% from capture
  start until transcription starts; original levels written to a restore file first, restored on
  next start after a crash. Not in continuous mode.

### 4.6 Latency budget (1.5 s)

| Stage | Budget |
|---|---|
| Silence wait | 700 ms |
| Speech-to-text | 500 ms |
| Matching | < 5 ms |
| Action start | 200 ms |
| Feedback | 50 ms |

Every command logs `silence | stt | match | action | total`; the terminal prints the breakdown.

### 4.7 Start-up and shut-down

Start-up: load settings -> load and validate commands -> app index -> restore ducked volumes ->
load models -> open mic -> start threads -> "Listen is ready". Shut-down (Ctrl+C or "quit
listening"): stop audio -> finish current command -> restore volumes -> flush storage -> exit.

### 4.8 Terminal shell (v1)

One line per bus event, e.g. `heard "search what is an atom" (0.93)`, `match search ...`,
`done open_url ...`, `timing silence 700 | stt 412 | match 1 | action 140 | total 1253 ms`.

---

## 5. Local data (Doc 05)

SQLite at `%APPDATA%\Listen\listen.db`, **WAL mode**, one writer (storage thread), small
transactions, plain SQL migrations in `listen_agent/storage/migrations/NNN_*.sql` applied on start
from `meta.schema_version`. All times in **UTC**. Syncable rows have a `uuid`.

### 5.1 Tables

| Table | Kind | Columns |
|---|---|---|
| `commands` | syncable | `id, uuid, user_id, ts, mode, heard, command_id, slots (JSON), action, result, error, stt_conf, match_conf, ms_silence, ms_stt, ms_action, ms_total, model, undone, verdict, verdict_source, synced_at, updated_at, deleted_at` |
| `usage_daily` | syncable | `id, uuid, user_id, date, app, site, seconds, synced_at, updated_at` |
| `continuous_log` | private, 30 days | `id, ts, heard, stt_conf` |
| `app_sessions` | private, 30 days | `id, started, ended, process, app, raw_title, site` |
| `meta` | local | key/value: `schema_version`, `last_purge`, `last_rollup`, `sync_cursor`, `last_snapshot_hash` |

`mode` in `wake | push_to_talk | continuous`. `result` in
`executed | failed | not_matched | low_confidence | cancelled`. `verdict` in empty/`right`/`wrong`;
`verdict_source` in `voice | review`. Indexes on `commands.ts`, `commands.synced_at` and the purge
time columns.

### 5.2 Privacy rules

- A table is either syncable or private, never mixed. Sync reads **only** syncable tables (enforced
  by a test).
- Wake-word/push-to-talk unmatched sentences -> `commands` as `not_matched`. Continuous-mode
  unmatched sentences -> private `continuous_log`.
- **No audio is ever written by the running assistant.** The single exception is the owner's
  deliberate voice test clips (§9.3), git-ignored and never synced.

### 5.3 Retention

- Roll-up every hour: `app_sessions` -> `usage_daily`.
- Purge at start-up and every 6 h: roll-up first, then delete `continuous_log` and `app_sessions`
  older than 30 days.
- `commands` and `usage_daily` are kept until the owner deletes rows (review list or web app; not by
  voice). Deletion uses tombstones (§6.3).

### 5.4 Marking mistakes

- Voice: "that's wrong" / "wrong" / "that was wrong" marks the most recent non-meta command within
  **60 s** (`verdict=wrong, verdict_source=voice`), "done" chime, pop-up naming the command. It does
  not undo.
- Review: `python -m listen_agent review --last 20` with `[r]ight / [w]rong / [d]elete / skip`; the
  web app History page offers the same.

### 5.5 Usage tracking

- Every 2 s, read the foreground window's process and title. A change closes the current
  `app_sessions` row and opens a new one; publishes `ForegroundChanged`.
- App display name from the process (with a small mapping, e.g. `Code.exe` -> "Visual Studio Code").
- **Site extraction (browsers only):** strip the browser suffix (" - Google Chrome", " - Microsoft
  Edge" ...) and map the remaining title to a known site with a rules table shipped in the agent
  (e.g. "... - YouTube" -> "youtube.com", "... - Google Search" -> "Google Search"); anything
  unrecognised is recorded as "Other sites". Raw titles stay in the private `app_sessions` only.
- Defaults: the usage history may **suggest** default targets (e.g. most-used search site); the
  owner confirms in settings.

---

## 6. Sync (Doc 06)

### 6.1 Protocol

- The laptop **polls**: one `POST /v1/sync` every **5 minutes**, plus immediately when Windows
  reports the network is back. Authenticated with the device token (`Authorization` header).
- Request: `cursor`, `rows` (new or changed syncable rows), `deletions` (uuids), optional
  `commands_snapshot` (files + hash, only when the hash changed; includes primitives and app
  names), `edit_results`.
- Reply: `accepted` uuids, `deletions` (made on the server), `pending_edits`, new `cursor`.
- 60 s timeout (the free server may be asleep).

### 6.2 Upload

- Outbox = rows where `synced_at` is empty or `updated_at > synced_at`. Rows never expire.
- Batches of **500**; continue immediately while a backlog remains.
- Server **upserts by uuid** (idempotent). Laptop sets `synced_at` only for `accepted` uuids.
- Failure back-off: 5, 10, 20, then 30 minutes max; one success resets to 5.

### 6.3 Deletion (tombstones)

- Laptop: delete sets `deleted_at` (hidden everywhere); the row is removed when the server confirms.
- Server: deletes content at once; keeps a **uuid-only tombstone forever** and refuses any upload of
  that uuid (prevents resurrection).
- Web deletions travel down through the change log; the laptop removes its copy.

### 6.4 Command files: laptop is master

- Laptop -> server: snapshot of all command files (with hash, primitives, app names) when changed.
- Server -> laptop: web edits are **pending edits** carrying the snapshot hash they were based on.
  For each: if the target command is unchanged since that snapshot, write it into the YAML with
  `ruamel.yaml` (comments and layout preserved), validate, and report `applied`; if invalid, revert
  and report `invalid` with the reason; if the command changed locally, report `overridden` (laptop
  wins). Statuses: waiting for laptop / applied / invalid / overridden.
- Ordering uses the server's change-log cursor, never laptop clocks.

### 6.5 Cursor

The server numbers every change (deletions, verdicts, pending edits) in `change_log`; the laptop
stores the last seen number in `meta.sync_cursor`. A lost laptop database restarts the cursor at 0.

---

## 7. Server (Doc 07)

- **FastAPI** + Pydantic validation; **SQLAlchemy 2.0** (`Mapped`, `mapped_column`) + **Alembic**;
  **PostgreSQL**. All endpoints under **`/v1`**. Interactive docs at `/docs`.
- **Free-tier hosting:** may sleep (20 to 50 s wake). No timed jobs; periodic clean-up happens
  during requests (e.g. expired sessions on login).

### 7.1 Endpoints

| Area | Endpoints |
|---|---|
| Auth | `POST /v1/auth/login`, `POST /v1/auth/logout`, `GET /v1/auth/me` (no sign-up endpoint) |
| Devices | `POST /v1/devices` (token shown once), `GET /v1/devices`, `DELETE /v1/devices/{id}` |
| Sync | `POST /v1/sync` (device token only) |
| Analytics | `GET /v1/analytics/summary`, `/apps`, `/commands` (paginated, 50 per page, filters), `/failed`, `/latency`, `/calibration`, `/calendar?year=` |
| History edits | `PATCH /v1/commands/{uuid}` (verdict), `DELETE /v1/commands/{uuid}` |
| Library | `GET /v1/library`, `POST /v1/library/edits`, `GET /v1/library/edits` |

`/analytics/apps` returns **every** app for the range (the top-7 limit is a web chart choice).
The web app may change only a command's verdict and deletion; everything else is laptop fact.

### 7.2 Tables

`users` (password hash), `sessions` (hashed id, expiry), `devices` (token hash, last sync, revoked),
`failed_logins`, `commands` (laptop columns + `device_id`, `received_at`), `usage_daily`,
`tombstones` (uuid + time), `change_log`, `command_snapshots` (`jsonb`), `pending_edits`. Every
data table has `user_id`; every query filters by the caller's `user_id`.

### 7.3 Security

- **Argon2** password hashing. Account created by `python -m app.cli create-user`.
- Session cookie: random id (hash stored), `HttpOnly`, `Secure`, `SameSite`, **30 days**.
- Lock-out: **5 failures in 15 minutes** per username -> refused for 15 minutes (counted in the DB).
- Device tokens: stored hashed, no expiry, revocable, valid **only** for `POST /v1/sync` (least
  privilege).
- CORS: only `WEB_APP_ORIGIN`. Secrets via environment variables (`DATABASE_URL`, `SESSION_SECRET`,
  `WEB_APP_ORIGIN`). The server holds no AI key.

### 7.4 Errors

One shape: `{ "error": "<code>", "message": "<text>", "request_id": "<id>" }`; the request id is also
logged. 500 -> generic message, traceback only in the log. Database unreachable -> 503.

---

## 8. Web app (Doc 08)

- **React + TypeScript**, **Vite**, **React Router**, **TanStack Query** (refresh every 5 minutes and
  on tab focus), API types generated from the server's OpenAPI description (`openapi-typescript`).
- **Recharts** for lines/bars; a custom SVG calendar heatmap.
- Laptop only, designed at 1440 px, works from 1280 px.
- A 401 anywhere redirects to `/login`.

### 8.1 Pages

| Page | Content |
|---|---|
| Login | username, password; one generic error; lock-out message; no Dock |
| Overview | "Listen" title + summary line; activity calendar; stat cards (commands today, success rate, top app, median response, top site, no-match count, streak) with change vs 7-day average; last 8 commands (click opens History); last-synced status |
| History | full table (time, heard, command, result, mode, hearing %, match %, response, right/wrong, details), 50 per page, search, filters (result, mode, command, date range), row details with the 4-stage timing bar, hold-to-delete |
| App usage | total time; top 7 + "Other" bars ("Other" clickable); sites inside the chosen app; **Every app** list (search, sort, all apps, share, change vs previous period, days used, row selects the app); trend: one app highlighted (default) or **compare up to 4** (each its own colour **and** marker shape, direct labels; 5th pick waits; removing keeps others' colours; zero-time days dotted at 0); trend is **zoomable** (drag to select days, reset) |
| Commands | command files as folders, a card per command; guided form (Where -> Say it like this -> What it does -> Check, with "try a sentence"); pending edits with statuses |
| Insights | activity calendar with year stats; commands per day; success rate; latency stacked bars (4 stages, 1.5 s line); calibration histograms (right vs wrong, threshold marked); failed sentences with "Make it a command"; each chart has a one-line takeaway and a Table view |
| Devices & settings | devices with last sync; create token (tear-off ticket, shown once); hold-to-revoke; session and log out; theme Windows / Light / Dark |

### 8.2 States (every page)

Loading (page-shaped skeletons), Waking up (server starting; elapsed timer; first request slow),
Error (what failed, "nothing is lost", Try again, request id), Empty (first day: example sentences,
"Connect your laptop").

### 8.3 Charts

One y-axis per chart; hover tooltips; never colour alone (legend for 2+ series, direct labels up to
4, a table view for every chart); text in ink colours; validated colour-blind-safe palette for light
and dark; status colours always with an icon and a word. Calendar: grey for zero days, 4 blue
quartile steps of the owner's active days; **light mode darker = more**; **dark mode brighter = more**
(zero `#2A3440`, steps `#1C5CAB`, `#2A78D6`, `#5598E7`, `#9EC5F4`).

### 8.4 Visual design

- Reference: clickable prototypes in `docs/design/prototypes/` (open `index.html`).
- Light = "Quiet Ledger" (Instrument Sans, `#F5F6F8` / `#FFFFFF`, accent `#2A78D6`, 12 px corners).
  Dark = "Signal Desk" (IBM Plex Sans, IBM Plex Mono for numbers and command ids, `#131A22` /
  `#18212B`, accent `#5598E7`, 8 px corners). Colours are **design tokens** (CSS variables).
- Theme follows Windows by default; the owner's choice (header switch and Devices page) is
  remembered in the browser (`localStorage`).
- **Dock** navigation at the bottom (React Bits), recoloured to the page tokens, labels on hover, no
  badges.
- Expressive React Bits components per page (TechText, InfiniteSpiral, FlowingMenu, SplitFlapText,
  MagicBento, TearTicket, HoldButton, and others listed in Doc 08 §9). Dense data (History, Every
  app) stays a plain table. All motion stops under `prefers-reduced-motion`.
- Deletes and revokes use **hold-to-confirm**, not dialogs.

---

## 9. Errors, logs, tests and CI (Doc 09)

### 9.1 Failure handling

Rules: contain, tell briefly, recover on its own.

| Failure | Behaviour |
|---|---|
| No microphone | pop-up; check every 2 s; resume automatically |
| Model will not load | pop-up naming the problem; stop at start-up |
| No match / low confidence | chime (not in continuous mode); saved; thresholds decide |
| Action fails or raises | pop-up "Couldn't open X"; `failed` with reason; undo slot untouched; traceback to log |
| Bad command file | skip invalid entries; keep last good file if unparseable; pop-up with file:line |
| Thread dies | supervisor starts a replacement (max 3 per minute, §4.1) |
| Thread hangs (no heartbeat for 30 s) or crash-loops | agent exits with an error code; the launcher restarts it |
| **Agent crashes** | a separate **launcher** process restarts it, **at most 3 times in 10 minutes**, pop-up each time; then stops with "Listen stopped, see the log" |
| Database busy / disk full | 5 s busy timeout / keep running commands, warn that saving paused |
| Database damaged | integrity check at start; rename the file (kept) and start fresh; pop-up |
| Offline / asleep / timeout | back-off (§6.2); nothing lost |
| Device token revoked (401) | stop syncing; pop-up asking for a new token |
| Server rejects a row (422) | log and set it aside; continue the batch |
| AI builder without key / API error | disabled / nothing written |

### 9.2 Logs

- Python `logging`, level `INFO`, format `time LEVEL module message`.
- `agent/logs/listen.log`, rotating at **1 MB, 5 files kept** (about 5 MB max). Git-ignored.
- **No spoken words in logs** by default (ids, timings, errors only). `listen debug on` adds words
  until the next restart. A test fails if a heard sentence appears in log output.
- Server logs to stdout; never transcripts, passwords or tokens.

### 9.3 Tests

- **TDD** (red, green, refactor) throughout; pytest for agent and server, Vitest + React Testing
  Library for the web app.
- Pyramid: many unit tests (matcher table incl. regressions, slots, thresholds, undo with a fake
  clock, routines, continuous guardrails, command-file validity), some integration tests (SQLite in
  a temp file: migrations, purge, damaged-file recovery; sync client vs a fake server incl. back-off,
  401 stop, batches, tombstones, the privacy test; every server endpoint for happy path / 401 / 422
  against a fresh PostgreSQL), very few end-to-end tests.
- Actions are tested against **fakes** (never open apps or change volume).
- **Speech tests use the owner's own voice:** `listen record-tests` records about 20 sentences to
  `agent/tests/audio/clips/` (git-ignored, never synced). Tests check words and the 500 ms STT
  budget, and are **skipped** when the clips are absent (e.g. on GitHub).
- Web: `tsc` type check, component tests with a mocked API, generated API types up to date.

### 9.4 Benchmark

`tiny.en` vs `base.en` (`int8`) on the same clips (the recorded test clips, or live in benchmark
mode); pick the smallest model that is accurate enough and within budget. Silence wait tested at
0.5 to 0.9 s.

### 9.5 CI

GitHub Actions, `.github/workflows/ci.yml`, on every push and pull request, three parallel jobs:

- `agent` on `windows-latest`: Python 3.11, install, `ruff check`, `pytest` (speech tests skip).
- `server` on `ubuntu-latest` with a `postgres:16` service container: install, `pytest`.
- `web` on `ubuntu-latest`: Node 20, `npm ci`, `npm run check` (types, tests, API types current).

No secrets needed. Checked locally with the editor's schema support and `actionlint`.

---

## 10. Build order

Each stage ends with something runnable.

1. **Foundations:** CI workflow, project scaffolding (`pyproject.toml`, package layout), event bus,
   logging, settings.
2. **Voice agent in the terminal:** commands + matcher (pure, fully tested), primitives, executor,
   undo, routines, then audio capture, VAD, wake word, transcriber, listener state machine,
   feedback, mic following, launcher. Benchmark and model choice.
3. **Usage agent + local SQLite:** storage thread, migrations, `commands` recording, usage tracking,
   roll-up, purge, review command, "that's wrong".
4. **Server + sync:** FastAPI, PostgreSQL, Alembic, auth, devices, sync endpoint, sync client,
   snapshots and pending edits, analytics endpoints.
5. **Web app:** pages in order Login, Overview, History, App usage, then Commands, Insights,
   Devices; AI command builder on the laptop.
6. **Later:** tray shell, Chrome profiles, deployment.

---

## 11. Defaults this spec chooses (owner to confirm or change)

These were not fixed during design. They are reasonable starting values, easy to change later:

| Item | Default chosen |
|---|---|
| Push-to-talk hotkey | hold `Ctrl+Alt+Space` (configurable in settings) |
| Continuous mode toggle | `Ctrl+Alt+C` (configurable) |
| Settings file | `agent/settings.yaml` (non-secret settings: hotkeys, thresholds, mode); secrets stay in `agent/.env` |
| Starting thresholds | hearing 0.60, match 0.75; high risk 0.75 / 0.90; continuous mode +0.10 on each (until calibrated) |
| Site rules | a small built-in table of common sites, extended by editing a YAML file in `agent/` |
| CLI name | `python -m listen_agent <subcommand>`, also installed as the `listen` command |
