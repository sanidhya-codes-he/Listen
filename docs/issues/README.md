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

## The rule that keeps the plan honest

**Before starting an issue, re-read its file and update it** to match every decision made since it
was written (libraries chosen, names that changed, findings from earlier issues). Then copy the
updated text into the GitHub issue (`gh issue edit N --body-file ...`). Never start from a stale file.

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
| Open decisions | questions to settle when the file is updated before starting |
| Learning | concepts this issue teaches, and where the learning doc covers them |

## Labels

`stage-1` ... `stage-6`, plus the area: `agent`, `server`, `web`, `ci`, `docs`, and `follow-up`
for the M issues.

## Creating the issues from the terminal (you run these)

```
gh label create stage-2 --color 1565C0 --description "Stage 2: voice agent"
gh api repos/sanidhya-codes-he/Listen/milestones -f title="Stage 2: voice agent in the terminal"
gh issue create --title "[S2-01] Command files and the recipe schema" --body-file docs/issues/s2-01-command-files.md --label stage-2,agent --milestone "Stage 2: voice agent in the terminal"
```

Sub-issues and "blocked by" links are set through GitHub's API (`gh api ...`); we will look up the
exact commands together the first time. After creating an issue, write its GitHub number into the
table in `docs/roadmap.md`.
