# [S5-09] AI command builder on the laptop (Gemini)

| | |
|---|---|
| Stage | S5 web app and AI command builder |
| Depends on | S2-01, S2-02 |
| Labels | stage-5, agent |
| Spec | §3.10 |
| Status | todo |

## Goal
The owner describes a command in plain words ("when I say study mode, open notion and mute"), and
the laptop proposes a schema-valid change, shows a diff, and saves it only after "yes".

## Scope
- a `CommandBuilder` interface; a Gemini implementation using the `google-genai` SDK; the model name
  is a setting (`ai_builder.model` in `settings.yaml`)
- reads `GEMINI_API_KEY` from `agent/.env`, which **the owner adds** when this issue starts (never in
  chat, never committed); no key -> builder disabled with a message
- input to the model: the request, current files, the schema, the primitive list; output: a
  **proposed change**, not a rewritten file
- the proposal is schema-checked and tried on example sentences with the matcher; the owner sees a
  diff and approves; `press_keys` proposals highlighted; API error -> nothing written
- a guided form in the terminal as the offline fallback
- tests with a fake builder (no network, no key)

## Done when
- [ ] tests: valid proposal applied after "yes", rejected on "no", invalid proposal refused, no key,
      API error
- [ ] manual: three real requests produce working commands (in the PR)

## How to test
`cd agent; uv run pytest -k builder -v`

## Open decisions
- Which Gemini model (cheap and fast enough); chosen when this issue starts.

## Learning
Calling an LLM API safely; structured output; never trusting model output without validation.
