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

The repository is private: you need read access to `ftrackhq/ftrack-api-developer-skills` and git credentials Claude Code can use without prompting - an SSH key loaded in your agent, or `gh auth login` followed by `gh auth setup-git`. Without a GitHub SSH key, set `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1`.

### Updates

The plugin has no fixed version, so every commit on the default branch is a new release. Auto-update is off by default for this marketplace; enable it under `/plugin` → Marketplaces → ftrack-skills, or update manually:

```bash
claude plugin marketplace update ftrack-skills
claude plugin update ftrack-api-developer@ftrack-skills
```

Then run `/reload-plugins` in an open session, or start a new one.

## Skills

The `ftrack-api-developer` plugin contains these skills. Claude loads them automatically when your question or code matches - for example when a file imports `ftrack_api` or `@ftrack/api`, or calls `session.query()`:

| Skill | Covers |
|-------|--------|
| [ftrack-api-developer](skills/ftrack-api-developer/SKILL.md) | Entry point: core concepts, routes to the skills below |
| [ftrack-setup](skills/ftrack-setup/SKILL.md) | Install ftrack-python-api, ftrack-action-handler, @ftrack/api, schema generator, web widget; credentials; connection check |
| [ftrack-query](skills/ftrack-query/SKILL.md) | Query syntax, projections, has/any filters, pagination, group by aggregation |
| [ftrack-session](skills/ftrack-session/SKILL.md) | Sessions, API keys, commit/rollback, caching, errors |
| [ftrack-events](skills/ftrack-events/SKILL.md) | Event hub listeners, ftrack.update payloads, publishing, webhooks |
| [ftrack-actions](skills/ftrack-actions/SKILL.md) | Custom actions with UI forms (Python and JavaScript) |
| [ftrack-files](skills/ftrack-files/SKILL.md) | Components, locations, upload/download, thumbnails |
| [ftrack-javascript](skills/ftrack-javascript/SKILL.md) | `@ftrack/api` in Node.js, browsers and React |
| [ftrack-typescript](skills/ftrack-typescript/SKILL.md) | Typed sessions and generated workspace types |
| [ftrack-dashboards](skills/ftrack-dashboards/SKILL.md) | Dashboard widgets, charts, PDF export |

Each skill keeps its reference docs and runnable examples in its own `references/` and `examples/` folders, so it works on its own and offline.

To invoke a skill explicitly, type `/ftrack-api-developer:<skill>`, e.g. `/ftrack-api-developer:ftrack-query`.

**Prerequisites**: an ftrack server URL, username and API key (`FTRACK_SERVER`, `FTRACK_API_USER`, `FTRACK_API_KEY`).

## Development

Validate before pushing:

```bash
claude plugin validate .
claude plugin details ftrack-api-developer@ftrack-skills   # token cost per skill
```

To test local changes, add this checkout as the marketplace (`claude plugin marketplace add /path/to/checkout`) instead of the GitHub repository; the two can't be registered under the same name at once.

## Links

- [ftrack Developer Hub](https://developer.ftrack.com/)
- [ftrack Python API](https://github.com/ftrackhq/ftrack-python) and [docs](https://developer.ftrack.com/api-clients/python/)
- [ftrack JavaScript API](https://github.com/ftrackhq/ftrack-javascript) and [docs](https://developer.ftrack.com/api-clients/javascript/)
- [ftrack recipes](https://github.com/ftrackhq/ftrack-recipes)
