# Contributing to BookLoop

Read [the team playbook](BOOKLOOP_TEAM_PLAYBOOK.md) first. It remains the source of truth for
architecture, database ownership, scope approval and release decisions.

## Start from the integration branch

Check `git status -sb` before switching branches. If there are unexpected changes, inspect and
preserve them before continuing; do not discard them or include them in unrelated work.
Replit may update `.replit` locally. Keep required workflow configuration, but review local
changes separately rather than automatically including them in an application PR.

With a clean working tree:

```sh
git switch Develop
git pull --ff-only origin Develop
git switch -c chore/short-name
npm ci
```

Use `feature/<name>` for features, `fix/<name>` for defects and `chore/<name>` for maintenance.
The integration branch is **`Develop`**, with a capital D. One agent owns one branch at a time.
If a fast-forward pull fails, stop and investigate; do not force-push or reset shared work.

## Run and check

Use Node 24, matching `.replit` and GitHub CI. `npm ci` installs the committed lockfile without
updating dependency versions. Do not mix package managers or change dependencies without
approval.

- Local development: `npm run dev` (port 3000 by default).
- Replit: use the configured Run workflow (host `0.0.0.0`, port 5000).
- Before every PR: `npm run check` (ESLint → route type generation/TypeScript → production build).

The `Quality checks` GitHub workflow runs that same quality gate with a clean lockfile install.
It has read-only repository permissions, needs no application secrets, and performs no
deployment or database operation. A passing local run does not mean a pending CI run passed.

The marketplace UI uses sample/browser-local data and needs no environment values. When
Supabase work is assigned, use ignored `.env.local` locally or Replit Secrets. Copy names from
`.env.example`; keep the tracked template placeholder-only. Database tests are separate:
run the documented pgTAP checks for schema/RLS changes, under the designated database owner's
workflow. Never apply migrations remotely as part of an unrelated task.

For application UI changes, also run the relevant browser checks documented in
[`docs/marketplace-ui.md`](docs/marketplace-ui.md). A maintenance-only diff does not require
changing or reimplementing those flows.

## Keep the repository clean

Commit source, shared team instructions, reviewed configuration, the npm lockfile and versioned
migrations. `.replit`, `AGENTS.md` and `CLAUDE.md` are shared project configuration/instructions,
not private agent memory.

Do not commit:

- `.env`, `.env.local`, credential files, private keys, tokens or real credentials in examples.
- `.agents/`, `.local/`, local caches or agent activity/state.
- `node_modules/`, `.next/`, build output, temporary files, logs or generated reports.
- Test captures/reports and Supabase CLI `.temp/` or `.branches/` state.

The root `.gitignore` covers common tooling/output paths; `supabase/.gitignore` covers its CLI
state. Keep source migrations, seeds and database tests tracked. Shared editor configuration
can be reviewed deliberately; do not hide all project configuration with broad ignore rules.
Use `generated-artifacts/` for disposable generated deliverables, not runtime assets.

Ignore rules do not remove already tracked files or erase earlier commits. Inspect
`git ls-files` and `git diff --cached --name-status`; stage explicit paths rather than blindly
adding everything. Do not force-add local state. If a real credential is discovered, do not
paste its value into a PR or logs: notify the owner so it can be revoked/rotated through the
appropriate secret manager. History rewriting requires separate coordination.

## Submit a pull request

```sh
git add path/to/reviewed-file
git diff --cached --check
git diff --cached
git commit -m "chore: describe the maintenance change"
git push -u origin chore/short-name
gh pr create --base Develop --head chore/short-name
```

Use the PR template to report scope, acceptance criteria, changed files, actual verification
results, limitations, migration details and environment variable **names only**. Include
screenshots when the UI changes. Say which checks were not run rather than implying a pass.

The owner reviews and merges. Agents must not merge their own PRs, push directly to `main`,
deploy without approval or include unrelated local changes.
