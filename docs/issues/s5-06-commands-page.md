# [S5-06] Commands page and the guided form

| | |
|---|---|
| Stage | S5 web app |
| Depends on | S5-02, S4-07 |
| Labels | stage-5, web |
| Spec | §8.1 (Commands), §3.10 (guided form), prototype `commands` |
| Status | todo |

## Goal
The owner browses the laptop's command files and proposes new or changed commands with a guided form;
the page shows what happened to each proposal.

## Scope
- command files as folders, a card per command (ids in Doc 03 style, e.g. `core.open`)
- guided form: Where -> Say it like this -> What it does -> Check, with "try a sentence"
- validation against the same `shared/recipe.schema.json`
- pending edits list with statuses: waiting for laptop / applied / invalid / overridden

## Done when
- [ ] the form cannot submit an entry the schema rejects
- [ ] each status shown and tested with the mocked API

## How to test
`cd web; npm run check`

## Learning
Multi-step forms; sharing one schema between Python and TypeScript.
