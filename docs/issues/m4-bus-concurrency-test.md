# [M4] Make the bus concurrency test able to fail

| | |
|---|---|
| Stage | S2 (follow-up from the stage 1 review) |
| Depends on | S1 |
| Labels | stage-2, agent, follow-up |
| Spec | §2 (event bus) |
| Status | in progress |

## Goal
A bus test that fails if the bus's lock is removed.

## Why
The reviewer showed `test_subscribing_while_others_publish_is_safe` still passes without the lock:
its final assertion is satisfied by the event published after the threads finish. A test that
cannot fail protects nothing.

## What the lock really protects (found 2026-11-02 before starting)
An experiment (8 threads subscribing at the same moment, 20 trials) showed the real race: when
several threads subscribe to a **brand-new** event type at once, each sees "no list for this type
yet" and creates its own new list; each overwrites the previous one, so only the last survives.
With the lock: 8 of 8 inboxes got the event in every trial. Without it: 1 of 8 in every trial.
The old test never created a new list (its event type already had subscribers), so it could not
see this.

## Scope
- replace the old test with one that recreates that race on purpose: 8 threads start together
  (a `threading.Barrier`) and subscribe 8 inboxes to a new event type; one publish must reach all 8
- to make a rare timing deterministic, the test slows down the creation of a new subscriber list
  (the bus's `defaultdict` gets a factory that sleeps 10 ms); the test says so in a comment, since
  it touches a private attribute
- prove it: remove `with self._lock:` locally, watch the test fail, put it back (never committed)

## Out of scope
Changing `EventBus` itself (it is correct).

## Done when
- [x] the test fails with the lock removed (output in the PR description)
- [x] the test passes with the lock, 20 runs in a row

## How to test
```
cd agent
uv run pytest tests/core/test_bus.py -v
```

## Learning
"A test you never saw fail proves nothing"; making a race deterministic; check-then-act races;
deliberately breaking code to check a test (mutation testing, by hand).
