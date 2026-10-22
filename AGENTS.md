# Working on ftrack-api-developer-skills

This repo is a Claude Code plugin marketplace (`ftrack-skills`) containing one plugin, `ftrack-api-developer`, made of one skill under `skills/` with topic guides. These instructions are for anyone - human or coding agent - changing the skills. They are not loaded for people who install the plugin.

## Layout

- `.claude-plugin/marketplace.json` - marketplace with one entry, `source: "./"`. Skills are found by the default `skills/` scan; don't add a `skills` list or `strict` (they conflict with `plugin.json`).
- `.claude-plugin/plugin.json` - listing metadata, `license: Apache-2.0`, and the plugin **`version`** (semver). Set it only here, never also on the marketplace entry. Users only get changes when this version changes: `claude plugin update` reports "already at the latest version" otherwise.
- `skills/ftrack-api-developer/SKILL.md` - the only registered skill (data model, rules, router table). It must stay the single entry: don't add other `skills/*/SKILL.md` files, or they show up as separate skills again.
- `skills/ftrack-api-developer/topics/<topic>/GUIDE.md` + `references/*.md` + `examples/` (+ `scripts/` in setup). Guides have no frontmatter and are read on demand via the router. Keep each topic's examples inside its own folder, even if that means small duplication.
- No per-skill `plugin.json`, no root `CLAUDE.md` (plugins don't load it and the validator warns).

## Writing skills

Frontmatter of the root `SKILL.md`: `name` (= folder name), `description`, `when_to_use`. Nothing else.

- `description`: what the skill covers, one or two sentences. No trigger lists.
- `when_to_use`: the signals that should load it - `Code:` imports, method calls, env vars, file names; `Asks:` typical requests; errors. Short and specific.
- `description` + `when_to_use` must stay under 1,536 characters (listing cap); aim for 350-600.
- Don't use `paths`: it restricts auto-loading to matching files, so plain questions would stop triggering the skill.
- `when_to_use` is Claude Code-only. If a skill is ever uploaded to claude.ai or the Skills API, merge it into `description` for that copy.

Budgets (check with `claude plugin details ftrack-api-developer@ftrack-skills`):

- Always-on total under ~1,500 tokens (currently ~1,250).
- Root `SKILL.md` body stays short (router + essentials); each `GUIDE.md` 80-150 lines, ~0.7-1.7k tokens. Put detail in `references/` and list each file in the guide's "Reference files" table with when to read it.
- Refer to bundled files under `${CLAUDE_SKILL_DIR}`.
- Leave out generic knowledge (React, charting, bundlers); keep only ftrack-specific behaviour.

Content rules:

- **Every API fact must come from a source**, in this order: client source and published packages, developer hub docs, ftrack-recipes. Don't trust memory or the old content - most of it was invented. If something can't be confirmed, say so or leave it out.
- Credentials only from `FTRACK_SERVER` / `FTRACK_API_USER` / `FTRACK_API_KEY`; never print or hard-code a key.
- JavaScript examples strip a trailing slash from the server URL (`.replace(/\/+$/, "")`).
- Use the `expression` tag for interpolated JavaScript query values; escape `"` in Python query strings built from user input.
- Python: `.one()`/`.first()` must not be used on expressions with `limit`; listeners and action servers need `auto_connect_event_hub=True`.

## Sources of truth

| What | Where |
|---|---|
| Docs | https://developer.ftrack.com/ (page list: `/sitemap.xml`; old `.html` URLs are dead) |
| Python client | https://github.com/ftrackhq/ftrack-python, PyPI `ftrack-python-api` |
| JavaScript client | https://github.com/ftrackhq/ftrack-javascript, npm `@ftrack/api` (published 1.x differs from `main`/2.0 beta: e.g. Moment vs dayjs) |
| Actions | https://github.com/ftrackhq/ftrack-action-handler, PyPI `ftrack-action-handler` |
| Types | https://github.com/ftrackhq/ftrack-ts-schema-generator, npm `@ftrack/ts-schema-generator` |
| Widgets | npm `@ftrack/web-widget` (type definitions) |
| Working examples | https://github.com/ftrackhq/ftrack-recipes |
| Plugin format | https://code.claude.com/docs/en/plugins/marketplace-reference, `/manifest-reference`, `/skills` (`.md` suffix gives raw markdown) |

Check the published package version when documenting behaviour - the GitHub default branch may be ahead of what users install.

## Verifying a change

1. `claude plugin validate .` - must pass. Expected warning: no icon.
2. Frontmatter parses and stays within the caps:
   `python -c "import yaml,pathlib;[print(p.parent.name,len((f:=yaml.safe_load(p.read_text(encoding='utf-8').split('---')[1]))['description'])+len(f['when_to_use'])) for p in pathlib.Path('skills').glob('*/SKILL.md')]"`
3. Examples: `python -m py_compile` / `node --check`; type-check TypeScript under `strict` against `@ftrack/api` and a generated schema.
4. Run examples against a real workspace when possible. Read-only checks are fine; anything that creates data goes in a throwaway project that you delete afterwards, and only with the workspace owner's agreement. Workspaces with a storage scenario copy published files to local disk - remove them through the location before deleting the project.
5. Install from the checkout (see README "Development"), start a new session and confirm the skill triggers on a typical question and on code containing its signals.

## Commits and releases

- Small, descriptive commits; say in the message which sources a change was verified against.
- Work on a branch and open a PR to `main`. Every PR that changes what users get bumps `version` in `.claude-plugin/plugin.json`: patch for fixes and wording, minor for new skills/references or notable content, major for renamed/removed skills or breaking layout changes. Merging the PR is the release.
- To test a local change without bumping, reinstall from the checkout (`claude plugin uninstall` + `install`); `claude plugin update` only picks up a new version.
- Don't open issues or PRs on other ftrackhq repositories without the maintainers' go-ahead.
