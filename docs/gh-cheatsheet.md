# GitHub CLI (`gh`) cheat sheet

Checked against `gh` 2.103 on this laptop. Run everything from inside the repo folder: `gh` then
knows which repository you mean. For any command, `gh <command> --help` lists every option.

## How a gh command is built

```
gh  issue  create  --title "..."  --label stage-2
│   │      │       └─ options (flags): --long-name value, or -s short form
│   │      └─ the action (subcommand)
│   └─ the area: auth, repo, issue, pr, run, workflow, label, api, browse
└─ the program
```

## PowerShell traps (read this first)

| Trap | What happens | Do this instead |
|---|---|---|
| `{owner}` / `{repo}` unquoted | PowerShell treats `{ }` as code: *"The command parameter was already specified"* | `'repos/{owner}/{repo}/milestones'` in **single quotes** |
| double quotes **inside** a single-quoted argument | PowerShell 5.1 splits the argument: *"accepts 1 arg(s), received 3"* | avoid inner `"`, or write them as `\"` |
| `$` inside double quotes | PowerShell replaces `$name` with a variable (often empty) | single quotes: `'cost is $5'` |
| `#` in a value, e.g. a colour | everything after `#` becomes a comment | write colours without `#`: `--color 1565C0` |
| `gh` "not recognized" | the terminal was opened before `gh` was installed | open a new terminal (restart the IDE if it's the IDE's terminal) |

## Log in, look around

| Command | What it does |
|---|---|
| `gh auth login` | log in (GitHub.com, HTTPS, web browser); press **Enter** when asked, then authorise in the browser |
| `gh auth status` | who you're logged in as, and the token's permissions (scopes) |
| `gh repo view` | the repo's description and README in the terminal |
| `gh browse` | open the repo in the browser; `gh browse docs/roadmap.md` opens one file; `gh browse -a` opens the Actions tab |

## Issues

| Command | What it does |
|---|---|
| `gh issue create --title "[S2-01] ..." --body-file docs/issues/s2-01-command-files.md --label stage-2 --label agent --milestone "Stage 2: voice agent in the terminal"` | create an issue from a file |
| `... --parent 4` | (add to create) make it a **sub-issue** of issue #4 |
| `... --blocked-by 5,6` | (add to create) mark it **blocked by** #5 and #6 |
| `gh issue list` | open issues (default 30) |
| `gh issue list --state all --limit 100` | open **and** closed, up to 100 |
| `gh issue list --label stage-2 --label agent` | several `--label` = must have **all** of them |
| `gh issue list --milestone "Stage 2: voice agent in the terminal"` | one milestone's issues |
| `gh issue list --search "matcher in:title"` | GitHub search syntax |
| `gh issue view 7` | read issue #7 in the terminal; add `--comments` for the discussion, `--web` for the browser |
| `gh issue edit 7 --body-file docs/issues/s2-02-matcher.md` | replace the body (the "update before starting" rule) |
| `gh issue edit 7 --add-label follow-up --remove-label docs` | change labels |
| `gh issue edit 7 --add-sub-issue 8` / `--parent 4` / `--add-blocked-by 5` | link issues after creating them |
| `gh issue edit 7 --add-assignee "@me"` | assign yourself (quotes needed: `@` is special in PowerShell) |
| `gh issue comment 7 --body "Started; see branch 7-matcher"` | add a comment |
| `gh issue develop 7 --checkout --name 7-matcher` | create a branch **linked** to the issue and switch to it |
| `gh issue close 7 --comment "Done in #12"` | close; `--reason "not planned"` for work you dropped |
| `gh issue reopen 7` | reopen |
| `gh issue status` | issues assigned to you, mentioning you, or opened by you |

**Edge cases:**
- Issue and PR numbers are **shared**: if the last PR was #2, the next issue is #3.
- `--label` and `--milestone` must **already exist**, spelled exactly. Otherwise: *"could not add label: 'x' not found"*.
- Without `--title` and a body, `gh issue create` asks questions interactively. With `--body-file`, nothing is asked.
- `Closes #7` in a PR closes the issue **only when the PR is merged into `main`** (the default branch).

## Branches and pull requests

| Command | What it does |
|---|---|
| `gh pr create --base main --title "..." --body "Closes #7"` | open a PR from the current branch into `main` |
| `gh pr create --fill` | take the title and body from the commits |
| `gh pr create --draft` | a draft: visible, but marked "not ready" (`gh pr ready` when it is) |
| `gh pr list` | open PRs; `--state merged` for merged ones |
| `gh pr view` | the current branch's PR; `gh pr view 12 --web` in the browser |
| `gh pr diff` | the changes, in the terminal |
| `gh pr checks --watch` | CI status, updating live until it finishes |
| `gh pr checkout 12` | download someone's PR branch and switch to it |
| `gh pr review 12 --comment --body "Why 30 s here?"` | review comment (`--approve`, `--request-changes` exist, but **you can't approve your own PR**) |
| `gh pr merge --merge --delete-branch` | merge with a merge commit, delete the branch on GitHub and locally |
| `gh pr merge --squash` | squash all commits into one (we use `--merge` to keep every TDD step) |
| `gh pr merge --auto --merge` | merge automatically once CI passes |
| `gh pr close 12` | close without merging |

**Edge cases:**
- `gh pr create` while on `main` fails: a PR needs a branch **different** from its base. Create the branch first (`git switch -c ...`).
- Pushing new commits to the branch updates the open PR and reruns CI. You never need a new PR for fixes.
- After `gh pr merge --delete-branch`, still run `git switch main` then `git pull` so your `main` matches GitHub.

## CI runs and workflows

| Command | What it does |
|---|---|
| `gh run list` | recent workflow runs, with status |
| `gh run watch` | pick a running run and follow it live |
| `gh run view 123456` | one run's summary; `--log-failed` shows only the failing steps' output |
| `gh run rerun 123456 --failed` | rerun only the failed jobs (e.g. after a flaky network error) |
| `gh workflow list` | the workflows in `.github/workflows/` |
| `gh workflow run ci.yml` | start a workflow by hand (only if it has `on: workflow_dispatch`) |

## Labels

| Command | What it does |
|---|---|
| `gh label list` | all labels |
| `gh label create stage-2 --color BBDEFB --description "..."` | create; add `--force` to update an existing one |
| `gh label edit docs --description "..."` | change |
| `gh label delete wontfix` | delete (asks to confirm) |

## `gh api`: anything without its own command

| Part | Meaning |
|---|---|
| `gh api '<address>'` | a **GET** (read) request to GitHub's REST API |
| `-f key=value` | send a text field; sending fields makes it a **POST** (create) |
| `-F key=value` | a **typed** field: numbers, `true`/`false` and `null` are sent as such; `-F body=@file.md` reads a file |
| `-X PATCH` / `-X DELETE` | choose the method yourself: PATCH = change, DELETE = remove |
| `--jq '<program>'` | print only part of the JSON reply |
| `--paginate` | GitHub returns 30 items per page; this fetches every page |
| `{owner}`, `{repo}` | filled in by `gh` from the current folder (single-quote them in PowerShell) |
| `?state=all` | a query parameter on the address (only for reads) |

Examples:
```powershell
gh api 'repos/{owner}/{repo}/milestones' -f title="Stage 2: voice agent in the terminal"
gh api 'repos/{owner}/{repo}/milestones?state=all' --jq '.[] | [.number, .state, .title] | @tsv'
gh api 'repos/{owner}/{repo}/milestones/2' -X PATCH -f state=closed      # close milestone 2
```

## The loop for every issue

```powershell
gh issue view 7                                  # read the task
git switch main; git pull                        # start from the latest main
gh issue develop 7 --checkout --name 7-matcher   # linked branch, switched to it
# ... work, commit (git add / git commit) ...
git push -u origin 7-matcher
gh pr create --base main --title "[S2-02] Normaliser and matcher" --body "Closes #7"
gh pr checks --watch
gh pr merge --merge --delete-branch
git switch main; git pull
```
