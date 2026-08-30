# Airline Empire — Git Workflow

GitHub is the single source of truth for Airline Empire.

`main` is the authoritative integrated/release baseline.

The currently assigned development branch is the authoritative source for work in progress and must not be replaced with `main` unless explicitly instructed.

## Standard workflow

- Never edit directly on `main`.
- Before starting work, confirm the assigned working branch and inspect its latest GitHub state.
- When working locally, pull that branch before making changes.
- Make all code and asset changes on the assigned working branch.
- Test changes using the available repository/runtime before committing.
- Use a medium level of testing appropriate to the scope; do not over-test.
- Commit completed, coherent changes with a descriptive commit message.
- Push the working branch to GitHub.
- Merges will be handled manually.

## ChatGPT / AI development rule

When ChatGPT or another AI is making repository changes, it should work against the current Git repository rather than providing disconnected patches whenever repository access is available.

Preferred flow:

`current branch → modify files → test → git diff/status → commit → push branch`

Do not silently switch to an older copy, standalone build, archived version, previously supplied file, or unrelated Git branch.

When direct GitHub repository access is available, inspect the current remote branch state and make the requested changes there. Do not claim the repository is unavailable without first attempting the available repository tools.

If the AI is operating only against GitHub and does not have a local checkout/runtime, it must not claim to have run local commands or local browser/runtime tests that it did not actually perform.

## Doug workflow

Doug should begin from the latest GitHub state of the branch he is currently assigned to.

Doug's `git status` should normally return clean because his local copy is a pull-only working copy.

Typical sequence:

1. Run:
   `git status`
2. Paste the result to ChatGPT so the local state can be checked.
3. If the working tree is clean and the branch is correct, run:
   `git pull`
4. If Doug's local copy becomes inconsistent, diverged, or contains unwanted local changes, ChatGPT should provide the exact commands needed to reset the local copy to the latest remote branch state.

Doug will always be on a branch, will change branches manually when needed, and will keep ChatGPT informed of the active branch.

## Scotty workflow

Scotty may perform development, QA, branch changes, and Git maintenance.

Before destructive Git operations, inspect `git status` and confirm the intended branch and remote source.

When Scotty is using a local copy that should exactly mirror a remote development branch, the remote working branch is authoritative unless explicitly stated otherwise.

## Safety rules

- Never push `main`; Doug or Scotty will handle `main` manually.
- Check `git status` before destructive Git operations.
- Never discard unexpected local work without first identifying it.
- On Doug's designated pull-only copy, the remote working branch is authoritative. After reviewing `git status`, unwanted local changes may be discarded to restore the GitHub version.
- Do not create repositories, backup repositories, or backup branches unless explicitly asked.
- Preserve existing work before resets, rebases, branch deletion, or history changes unless the user has explicitly designated the local copy as disposable/pull-only.
- `origin/<current-working-branch>` takes precedence over stale local copies of that branch.
- `main` must not be substituted for an active development branch unless explicitly instructed.
- Do not force-push, rebase shared history, delete branches, or rewrite history unless explicitly authorized.

## Repository delivery rule

Use Git as the delivery mechanism.

When repository access is available, make the requested changes in the assigned working branch and push them so another developer can obtain them with Git rather than manually applying patches.

Do not default to returning code-only patches when the repository can be modified directly.

## Branch authority rule

Before making repository changes, establish the active working branch from the current conversation or repository state.

If there is any uncertainty about which branch is authoritative for current work, confirm it before writing changes.

Once the branch is established, all reads, edits, tests, commits, and pushes must remain scoped to that branch unless explicitly instructed otherwise.

## Recovery rule for pull-only local copies

If `git status` is clean:

`git pull`

If the local copy has unwanted changes or divergence and GitHub should overwrite local state, first inspect `git status`, then use the appropriate reset-to-remote procedure for the current branch. Do not improvise a merge when the stated goal is to make the local copy match GitHub.

## Current development principle

The active development branch is the source of truth for in-progress Airline Empire work.

`main` is the integrated baseline and remains protected from direct AI development changes.

Repository access should be used directly whenever available, with GitHub serving as the handoff point between ChatGPT, Scotty, and Doug.

## Claude (claude.ai) session workflow

Claude works through the Filesystem connector directly on the local working copy at
`C:\GitHub\AirlineEmpire`. Claude edits local files only; Scotty handles all Git operations
manually. Claude never runs or suggests Git commands.

### Text changes (code, CSS, HTML, data, docs)

Claude writes these directly into the working copy. New work goes in self-contained,
versioned files (`game\css\*-vNN.css`, `game\js\patches\*_vNN.js`) plus minimal loader
lines in `game\index.html`. `game\js\core\game.js` is not edited by Claude; if a change
there is unavoidable, Claude specifies the exact line and Scotty applies it, then Claude
verifies the saved file (syntax check + diff against the previous version).

### Images / binary files (Claude → repo)

The connector is text-only, so binary files are delivered as a zip:

1. Claude builds the zip, always rooted at repo layout (`assets\...`, `game\...`),
   verifies its contents, and attaches it in chat.
2. Save the download to `C:\GitHub\AirlineEmpire\images_to_apply\<filename>.zip`.
3. From the base directory `C:\GitHub\AirlineEmpire`, run:
   `unzip -o .\images_to_apply\<filename>.zip`
   (`-o` overwrites in place — Claude's zips are always intentional overwrites and
   contain nothing outside their stated paths.)
4. Reply "applied".
5. Claude verifies through the connector (byte-size/content spot checks against the
   built package) and confirms, or flags exactly what did not land.

### Images / binary files (ChatGPT → repo)

Generated images for Claude to integrate go into `C:\GitHub\AirlineEmpire\images_to_apply\`
(following the request README there when one exists). Claude routes them into the game
from that folder and updates the relevant manifests.

### File removal

Claude cannot delete files. When a file should be removed from the working copy, Claude
moves it to `C:\GitHub\AirlineEmpire\claude_for_delete\`, appending a timestamp before the
extension — `fleet_aircraft_v112.js` → `fleet_aircraft_v112_1512.js` (24h HHMM; seconds added
only if needed to avoid a collision) — and states in chat what was moved and why. Scotty
handles the actual cleanup of that folder. Claude also removes any loader/manifest references
to the moved file so the game never points at it.
