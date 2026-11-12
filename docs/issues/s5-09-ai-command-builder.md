# [S5-09] AI command builder on the laptop (Gemini)

| | |
|---|---|
| Stage | S5 web app and AI command builder |
| Depends on | S2-01, S2-02, S4-09 (stage order) |
| Labels | stage-5, agent |
| Spec | §3.10 |
| Status | todo |

## Goal
The owner describes a command in plain words ("when I say study mode, open notion and mute"), and
the laptop proposes a schema-valid change, shows a diff, and saves it only after "yes".

## Scope
(updated 2026-11-12 after S2-01 merged (PR #85): the schema and checker that exist, so the proposal
check is not new code)

- a `CommandBuilder` interface; a Gemini implementation using the `google-genai` SDK; the model name
  is a setting (`ai_builder.model` in `settings.yaml`)
- reads `GEMINI_API_KEY` from `agent/.env`, which **the owner adds** when this issue starts (never in
  chat, never committed); no key -> builder disabled with a message
- input to the model: the request, current files (`commands/*.yaml`), the schema
  (`shared/recipe.schema.json`), the primitive list (`list_primitives()`, equal to the schema's
  `action` enum); output: a **proposed change**, not a rewritten file
- the proposal is schema-checked and tried on example sentences with the matcher; the owner sees a
  diff and approves; `press_keys` proposals highlighted; API error -> nothing written
  - **the check already exists**: apply the proposal to a copy of `commands/` and run
    `CommandFiles(copy).library.problems` (S2-01). It covers unknown keys, a wrong action,
    `press_keys` without `when_app`, a duplicate id or target and a default pointing nowhere, each
    in plain words with `file:line`; feed those lines back to the model for one retry. Do not write
    a second validator. The blocked key combinations (`win+r` ...) are S2-05's runtime check, so
    highlight every `press_keys` proposal for the owner regardless
  - save through the same ruamel writer as S4-07 (comments kept), never a rewritten file
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
