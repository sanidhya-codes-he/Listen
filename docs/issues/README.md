# Issue files

Every piece of work on Listen is one GitHub issue, and every issue starts life as a file here.
Together they form a **DAG** (directed acyclic graph): each issue lists what it **depends on**, and
nothing can start before its dependencies are closed. The whole graph is drawn in
[`../roadmap.md`](../roadmap.md).

## Two levels

- **Stage issues** (`s1-...` to `s6-...`): one per build stage. Goal, task list, done-when. Each
  stage is also a GitHub **milestone**, and its task issues are its **sub-issues**.
- **Task issues** (`s2-01-...`, `m1-...`): one branch, one PR, small enough to review in one sitting.
  `m...` issues are follow-ups found in the stage 1 review.

## How an issue is built (the pipeline)

One issue at a time. The helpers are local Claude Code agents (`.claude/agents/`, not in the
repository), each in its own window; they cannot talk to each other, so every step ends with a
**handoff line** the owner pastes into the next window.

| Step | Who | What happens |
|---|---|---|
| 1 | owner | picks the issue (one whose dependencies are all done: the ready line in the roadmap) |
| 2 | github-ops | coaches the owner through starting it: `git switch main; git pull`, then `gh issue develop N --checkout --name N-short-name` |
| 3 | owner + building assistant | **the owner designs** the solution; we discuss what is better and what is not, and settle the file's open decisions. The assistant checks the versions and names the file uses are still true, then builds it test-first |
| 4 | github-ops | coaches the push, `gh pr create` and the CI check |
| 5 | pr-explainer | explains in plain words what the PR changes; it does not judge |
| 6 | pr-reviewer | reviews; the owner posts the review on the PR |
| 7 | assistant -> owner -> pr-reviewer | **fix loop**: fixes are committed to the same branch and pushed (the PR updates itself, CI runs again), then pr-reviewer checks only the fixes. Repeat until its verdict is "Ready" |
| 8 | owner | merges, only after step 7 says "Ready" |
| 9 | github-ops + assistant | after every merge: clean up the branch, run `agent/.venv/Scripts/python docs/issues/draw_flowchart.py` (statuses, ready line, chart and critical path follow from GitHub), and add the issue's section to its stage's learning doc (`docs/learning/11-stage-2-voice-agent.tex` for stage 2), in the teach-from-zero format. The stage's last issue only polishes the doc |
| 10 | issue-refresher + assistant | **major issues only** (see below): refresh the files of the issues that depend on the merged one, and draft follow-ups; the owner decides |

## Keeping the plan honest

Issue files are refreshed **after a major issue merges**, not before each start: an issue is
**major** when its file has an "Open decisions" section. Its dependents' files are updated to match
what was decided and found (names, interfaces, limitations), then copied to GitHub
(`gh issue edit N --body-file ...`). For every other issue, step 3's check covers what can go
stale (library versions, names).

**Follow-ups stay few.** A candidate becomes a **new issue** only when it is real work that does not
fit any open issue; anything smaller becomes one line in the scope of the open issue it belongs to
("fold into S2-06"). Each candidate is marked "new issue" or "fold into ..." with a one-line reason.

## Stage order

Stages are built one after another: each stage's first tasks also depend on the previous stage's
sign-off issue (marked `(stage order)` in their "Depends on" line), so only one stage is ever ready.

## Fields in every task file

| Field | Meaning |
|---|---|
| Stage / Depends on / Labels / Spec | where it sits in the DAG; the spec sections it implements |
| Status | `todo`, `in progress` or `done` (with the PR number) |
| Goal | one sentence: what exists when this is closed |
| Why | the problem it solves |
| Scope | what to build |
| Out of scope | what NOT to do here (it belongs to another issue) |
| Done when | a checklist; every box must be true before the PR is merged |
| How to test | exact commands |
| Open decisions | questions to settle in step 3; their presence makes the issue major |
| Learning | concepts this issue teaches, and where the learning doc covers them |

## Labels

`stage-1` ... `stage-6`, plus the area: `agent`, `server`, `web`, `ci`, `docs`, and `follow-up`
for the M issues.

## Creating the issues from the terminal (you run these)

Labels and milestones are created once (done on 2026-10-29). Then each issue, in PowerShell:

```
gh issue create --title "[S2-01] Command files and the recipe schema" --body-file docs/issues/s2-01-command-files.md --label stage-2 --label agent --milestone "Stage 2: voice agent in the terminal" --parent <S2 issue number> --blocked-by <M2 issue number>
```

`--parent` makes it a sub-issue of its stage issue; `--blocked-by` adds the "Depends on" links (so
create issues in dependency order, or add links later with `gh issue edit N --add-blocked-by M`).
After creating an issue, write its GitHub number into the table in `docs/roadmap.md`. All commands:
[`../gh-cheatsheet.md`](../gh-cheatsheet.md).
