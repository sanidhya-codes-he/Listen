# [M4] Make the bus concurrency test able to fail

| | |
|---|---|
| Stage | S2 (follow-up from the stage 1 review) |
| Depends on | S1 |
| Labels | stage-2, agent, follow-up |
| Spec | §2 (event bus) |
| Status | todo |

## Goal
`test_subscribing_while_others_publish_is_safe` fails if the bus's lock is removed.

## Why
The reviewer showed the test still passes without the lock: its final assertion is satisfied by
the event published after the threads finish. A test that cannot fail protects nothing.

## Scope
- rework the test so it detects lost subscriptions or a crash during iteration, e.g. many threads
  subscribing and publishing at once, then assert every subscriber received exactly the events
  published after it subscribed
- prove it: temporarily remove `with self._lock:` locally, watch the test fail, put it back (do not
  commit the broken version)

## Out of scope
Changing `EventBus` itself (it is correct).

## Done when
- [ ] the test fails with the lock removed (show the failing output in the PR description)
- [ ] the test passes with the lock, 20 runs in a row (run it in a loop in the terminal)

## How to test
`agent/.venv/Scripts/python -m pytest agent/tests/core/test_bus.py -v`

## Learning
"A test you never saw fail proves nothing"; testing concurrent code; deliberately breaking code to
check a test (mutation testing, by hand).
