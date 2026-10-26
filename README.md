# ftrack Skills

A [Claude Code](https://code.claude.com) plugin marketplace with skills for ftrack Studio API development.

## Installation

In a Claude Code session:

```text
/plugin marketplace add ftrackhq/ftrack-api-developer-skills
/plugin install ftrack-api-developer@ftrack-skills
```

`/plugin install` opens the plugin's details so you can review it and pick an install scope.

From a shell:

```bash
claude plugin marketplace add ftrackhq/ftrack-api-developer-skills
claude plugin install ftrack-api-developer@ftrack-skills
```

### Access

No authentication is needed: the repository is public. Claude Code installs it over HTTPS by default.

### Updates

Releases are versioned (semver `version` in `.claude-plugin/plugin.json`); users receive an update when that version changes on the default branch. Auto-update is off by default for this marketplace; enable it under `/plugin` → Marketplaces → ftrack-skills, or update manually:

```bash
claude plugin marketplace update ftrack-skills
claude plugin update ftrack-api-developer@ftrack-skills
```

Then run `/reload-plugins` in an open session, or start a new one.

## Skill

The plugin registers a single skill, `ftrack`. Claude loads it when your question or code matches - for example a file that imports `ftrack_api` or `@ftrack/api`, or calls `session.query()` - and it then reads only the topic guide(s) the task needs:

| Topic guide | Covers |
|-------------|--------|
| [setup](skills/ftrack/topics/setup/GUIDE.md) | Install ftrack-python-api, ftrack-action-handler, @ftrack/api, schema generator, web widget; credentials; connection check |
| [query](skills/ftrack/topics/query/GUIDE.md) | Query syntax, projections, has/any filters, pagination, group by aggregation |
| [session](skills/ftrack/topics/session/GUIDE.md) | Sessions, API keys, commit/rollback, caching, errors |
| [events](skills/ftrack/topics/events/GUIDE.md) | Event hub listeners, ftrack.update payloads, publishing, webhooks |
| [actions](skills/ftrack/topics/actions/GUIDE.md) | Custom actions with UI forms (Python and JavaScript) |
| [files](skills/ftrack/topics/files/GUIDE.md) | Publishing versions, components and sequences, locations, thumbnails, review media, uploads |
| [javascript](skills/ftrack/topics/javascript/GUIDE.md) | `@ftrack/api` in Node.js, browsers and React |
| [typescript](skills/ftrack/topics/typescript/GUIDE.md) | Typed sessions and generated workspace types |
| [dashboards](skills/ftrack/topics/dashboards/GUIDE.md) | Custom dashboard widgets: credentials, entity context, theme, chart data |

Each topic keeps its reference docs and runnable examples in its own `references/` and `examples/` folders, so the skill works offline.

To invoke it explicitly, type `/ftrack-api-developer:ftrack`.

**Prerequisites**: an ftrack server URL, username and API key (`FTRACK_SERVER`, `FTRACK_API_USER`, `FTRACK_API_KEY`).

## Development

```text
.claude-plugin/
  marketplace.json      # marketplace "ftrack-skills" with one plugin entry (source "./")
  plugin.json           # plugin metadata and semver version (bump it to release)
skills/ftrack/
  SKILL.md              # the only registered skill: frontmatter + data model + topic router
  topics/<topic>/
    GUIDE.md            # topic guide, read on demand (no frontmatter, not a registered skill)
    references/*.md     # detail loaded on demand
    examples/           # runnable examples (and scripts/ in setup)
AGENTS.md               # conventions and checks for anyone (human or agent) editing skills
```

Read [AGENTS.md](AGENTS.md) before changing a skill: it covers the writing conventions, size budgets, sources of truth and how to verify changes.

Validate before pushing:

```bash
claude plugin validate .
claude plugin details ftrack-api-developer@ftrack-skills   # token cost per skill
```

To test local changes, register this checkout as the marketplace instead of the GitHub repository (the two can't share the name `ftrack-skills` at once):

```bash
claude plugin marketplace remove ftrack-skills
claude plugin marketplace add /path/to/checkout
claude plugin install ftrack-api-developer@ftrack-skills
# after each commit (update only picks up a new version, so reinstall):
claude plugin marketplace update ftrack-skills
claude plugin uninstall ftrack-api-developer@ftrack-skills && claude plugin install ftrack-api-developer@ftrack-skills
```

Switch back with `claude plugin marketplace remove ftrack-skills` followed by the installation steps above.

## Links

- [ftrack Developer Hub](https://developer.ftrack.com/)
- [ftrack Python API](https://github.com/ftrackhq/ftrack-python) and [docs](https://developer.ftrack.com/api-clients/python/)
- [ftrack JavaScript API](https://github.com/ftrackhq/ftrack-javascript) and [docs](https://developer.ftrack.com/api-clients/javascript/)
- [ftrack recipes](https://github.com/ftrackhq/ftrack-recipes)

## License

Apache License 2.0, the same license as the ftrack Python and JavaScript API clients. See [LICENSE](LICENSE).
