# [S2-09] Audio capture, VAD and microphone following

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | S2-08 (done, #69) |
| Labels | stage-2, agent |
| Spec | §4.1 (audio thread), §4.2 (pre-roll), §4.4 (microphone), §9.1 (no microphone) |
| Status | todo |

## Goal
A steady stream of 30 ms audio chunks from the Windows default microphone, plus a VAD that marks each
chunk speech or not speech and a 0.3 s pre-roll buffer, that keeps working when the default
microphone changes or is unplugged.

## Why
Everything voice-related stands on this. VAD (voice activity detection) is the cheap first gate:
the expensive wake word and Whisper only run when it says "speech" (spec §2, lightweight by gating).

## Scope
(updated 2026-11-04 before starting: VAD chosen, with the chunk-size and torch facts; who owns the 2 s
microphone check; bounded queue; real names and events; a way to run it by hand; a fixture question)

- `voice/__init__.py` (the folder has only a README; setuptools needs the file) and
  `voice/capture.py`: `AudioCapture(Worker)` (name `audio`): a `sounddevice.RawInputStream`, 16 kHz,
  mono, `int16`, `blocksize=480` (30 ms), whose callback only does `put_nowait(bytes)` into the
  **audio queue** (given in the constructor; it becomes the listener's inbox in S2-14). Raw bytes
  mean no numpy is needed. Audio does **not** go through the event bus: 33 chunks a second to every
  subscriber is not what the bus is for.
  - the queue is **bounded** (about 3 s = 100 chunks): if the consumer stalls, drop the oldest chunk
    and log one warning (never one per chunk); an unbounded queue grows without limit
  - the callback never raises or blocks; PortAudio status flags (overflow) are counted and logged
    at most once a minute
  - the PortAudio calls sit behind an injected `backend` (open stream, query default input) with a
    fake in tests, like `FakeClock`; CI never touches a real microphone
- `voice/vad.py`: `Vad.is_speech(chunk: bytes) -> bool` over **`webrtcvad-wheels`** (see Decisions);
  `voice/preroll.py`: a ring buffer holding the last **10 chunks (0.3 s)**
  (`collections.deque(maxlen=10)`) with `push(chunk)` and `take() -> bytes`. Both are pure classes
  used by the listener (S2-14); capture itself stays "nothing else" (§4.1).
- **microphone following lives in the capture worker's `idle()`**, gated to every 2 s with the
  injected clock, not in S2-16's housekeeping worker (see Decisions). It (a) reopens a dead stream
  (`stream.active` false, or the open fails: no microphone -> wait and retry every 2 s, §9.1) and
  (b) checks whether the default input changed; on a change it closes the stream, refreshes the
  device list, reopens and publishes `MicrophoneChanged(name: str | None)` (`None` = no
  microphone). The pop-up is S2-15's job.
  - `MicrophoneChanged` is defined in `core/events.py` here (S2-16 lists "the remaining events",
    this one is no longer among them)
  - **spike first, result written in the PR:** how to notice a change without breaking the open
    stream. `sounddevice` has no public "refresh the device list"; the known way is its private
    `sd._terminate()` then `sd._initialize()` (both exist in 0.5.6), which closes every open
    stream, so doing it every 2 s would cut the audio every 2 s. Order of preference: (1) a cheap
    check that does not touch PortAudio, and only on a change terminate + initialize + reopen;
    (2) if none works, reopen only when the stream dies. Also record which host API opens 16 kHz
    cleanly (the default MME resamples; WASAPI shared mode may refuse 16 kHz unless `auto_convert`
    is set).
- `listen mic-check [seconds]` (a small subcommand in `__main__.py`): runs capture + VAD + the 2 s
  check in the terminal, prints a line when speech starts or stops and when the microphone
  changes, and prints the CPU use at the end. It is how the manual "Done when" items are run; the
  real listener comes in S2-14.
- **no audio is ever written to disk** (§5.2): a test runs capture against the fake source with an
  empty temp directory as the working directory and asserts no file appears. Audio bytes are never
  logged either.
- new dependencies: `sounddevice` 0.5.6 and `webrtcvad-wheels` 2.0.14.post1 (`uv add`)
- tests with a fake audio source (silence and sine chunks built with `array`/`math`), never the
  real microphone in CI; files go in `agent/tests/voice/`

## Out of scope
Wake word (S2-10), recording test clips (S2-11), the listener state machine (S2-14), the pop-up
(S2-15). Command-file reload stays in S2-16's housekeeping worker.

## Done when
- [ ] VAD marks a short recorded **speech** fixture as speech and silence as silence (see the
      question on the fixture); pre-roll size and order, drop-oldest and retry timing are tested
      with a fake VAD and the fake clock
- [ ] unplugging the headset: the stream recovers when plugged back in; changing the Windows
      default microphone switches to it within a few seconds with one `MicrophoneChanged`
      (manual, with `listen mic-check`, noted in the PR; the pop-up itself is S2-15)
- [ ] CPU use of capture + VAD measured over 60 s with `time.process_time()` (no extra library) and
      recorded in the PR (target: a few percent of one core)
- [ ] the spike result (how a default-microphone change is noticed) is written in the PR
- [ ] the no-file-written test passes; `uv run ruff check .` and the full `uv run pytest` pass

## How to test
```
cd agent
uv run pytest -k "audio or vad" -v
uv run listen mic-check 30
```

## Decisions (made 2026-11-04)
- **VAD: `webrtcvad-wheels` first.** The original `webrtcvad` on PyPI is the 2017 release (2.0.10),
  source only, so it needs a C compiler on Windows; `webrtcvad-wheels` 2.0.14.post1 (PyPI, 2026-10)
  ships `cp311 win_amd64` wheels with the same API. It accepts 10, 20 or 30 ms frames at 16 kHz,
  exactly our chunk. Silero does not fit as the file assumed: the `silero-vad` package **requires
  `torch`** (the "onnxruntime comes anyway" idea only holds when running its ONNX file with our own
  wrapper), and its model takes **512 samples (32 ms)** per call at 16 kHz (`utils_vad.py`), so
  30 ms chunks would need re-chunking. Switch only if webrtcvad is too wrong on the owner's voice
  and room; `Vad` is one small class, so the swap stays local. Still measured: aggressiveness 0 to 3
  on the owner's voice, the choice recorded in the PR.
- **The 2 s microphone check moves from housekeeping to the capture worker.** Re-initialising
  PortAudio from a second thread while the capture thread opens or closes a stream is a race, and
  the reopen has to happen in the thread that owns the stream anyway. Spec §4.1 and §4.4 name the
  housekeeping thread: update those lines when this merges.
- **VAD and the pre-roll are not run inside capture**: §4.1 says the audio thread does nothing else
  and the Listener thread does VAD. This issue delivers them as pure classes and proves them with
  `mic-check`.
- **No numpy here**: raw 16-bit bytes need none. (numpy 2.5.x needs Python 3.12 and the agent is on
  3.11, so uv will pick 2.4.x when S2-10 or S2-12 bring it in.)

## Questions for the owner
- **Speech fixture for the VAD test.** Your own clips (S2-11) are git-ignored and come after this
  issue, so CI needs a tiny committed clip. Recommendation: 1 to 2 s with a CC0 licence (for example
  from Mozilla Common Voice), source and licence written next to it in `agent/tests/audio/`, and
  **not your voice**, because the repository is public. Say if you prefer your own.

## Learning
Sampling and chunks; ring buffers; bounded queues; gating cheap-to-expensive; detecting device
changes; why one thread owns a native library.
