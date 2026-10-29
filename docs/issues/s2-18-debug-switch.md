# [S2-18] `listen debug on`: spoken words in the log until restart

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | S2-16 |
| Labels | stage-2, agent |
| Spec | §9.2 (logs) |
| Status | todo |

## Goal
When something goes wrong, the owner can temporarily see the heard sentences in the log; a restart
hides them again.

## Why
Debugging a misheard command is much easier with the words, but the default must stay private.
`words()` and its flag already exist (stage 1); this issue adds the switch.

## Scope
- a way to flip the flag in the **running** agent; the command `listen debug on` from a second
  terminal, or the voice command "debug on"
- a log line when debug is switched on, so it is visible in the log that words follow
- the privacy test from stage 1 still passes after a restart

## Done when
- [ ] after `listen debug on`, the next heard sentence appears in `listen.log`
- [ ] after a restart it is hidden again (test)

## How to test
`cd agent; uv run pytest -k debug -v`

## Open decisions
- Reaching a running process from a second terminal needs inter-process communication (a local
  socket or a named pipe). Simpler alternatives: a voice command only, or `listen run --debug`
  (still "until restart"). Choose the simplest that the owner is happy with.

## Learning
Inter-process communication; privacy by default with a deliberate, temporary opt-in.
