# [S2-09] Audio capture, VAD and microphone following

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | S2-08 |
| Labels | stage-2, agent |
| Spec | §4.1 (audio thread), §4.2 (pre-roll), §4.4 (microphone), §9.1 (no microphone) |
| Status | todo |

## Goal
A steady stream of 30 ms audio chunks from the Windows default microphone, each marked speech or
not speech, that keeps working when the default microphone changes or is unplugged.

## Why
Everything voice-related stands on this. VAD (voice activity detection) is the cheap first gate:
the expensive wake word and Whisper only run when it says "speech" (spec §2, lightweight by gating).

## Scope
- audio capture worker: 16 kHz mono, 30 ms chunks into the audio queue, nothing else (§4.1)
- VAD on each chunk; a 0.3 s **pre-roll** ring buffer for later recordings
- housekeeping check every 2 s: default input changed? refresh the device list (known caching
  quirk), reopen the stream, publish `MicrophoneChanged`; no microphone -> wait and retry
- **no audio is ever written to disk** (§5.2); a test asserts no file is created
- tests with a fake audio source (generated sine / silence arrays), never the real microphone in CI

## Out of scope
Wake word (S2-10), recording test clips (S2-11), the listener state machine (S2-14).

## Done when
- [ ] VAD marks a recorded "speech" fixture as speech and silence as silence
- [ ] unplugging the headset: pop-up later (S2-15); here, the stream recovers when plugged back in
      (manual check in the PR)
- [ ] CPU use of capture + VAD measured and recorded (target: a few percent of one core)

## How to test
```
cd agent
uv run pytest -k "audio or vad" -v
```

## Open decisions
- Audio library: `sounddevice` (PortAudio) is the usual choice.
- VAD: `webrtcvad` (tiny, fast) or Silero VAD (more accurate, needs onnxruntime, which openWakeWord
  brings anyway). Measure both on the owner's voice.

## Learning
Sampling and chunks; ring buffers; gating cheap-to-expensive; detecting device changes.
