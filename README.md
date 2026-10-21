# ftrack Skills

Agent skills for ftrack development workflows.

## Installation

```bash
# Add this repository as a plugin marketplace
/plugin marketplace add ftrackhq/ftrack-api-developer-skills

# Install the plugins you need
/plugin install ftrack-api-developer@ftrack-skills
/plugin install ftrack-create-pull-request@ftrack-skills
```

To pull the latest version later:

```bash
/plugin marketplace update ftrack-skills
```

## Plugins

### ftrack-api-developer

ftrack API development support for Python and JavaScript/TypeScript. The `ftrack-api-developer` skill acts as an orchestrator and delegates to focused subskills, which can also be used on their own:

| Skill | Covers |
|-------|--------|
| [ftrack-api-developer](skills/ftrack-api-developer/SKILL.md) | Orchestrator - routes to the subskills below |
| [ftrack-query](skills/ftrack-query/SKILL.md) | Query syntax, projections, filtering, pagination, aggregation |
| [ftrack-events](skills/ftrack-events/SKILL.md) | Event hub, subscriptions, real-time updates |
| [ftrack-actions](skills/ftrack-actions/SKILL.md) | Custom action handlers with UI forms (Python only) |
| [ftrack-files](skills/ftrack-files/SKILL.md) | Upload/download, components, locations, thumbnails |
| [ftrack-session](skills/ftrack-session/SKILL.md) | Session setup, authentication, caching, error handling |
| [ftrack-javascript](skills/ftrack-javascript/SKILL.md) | JavaScript API, async patterns, browser/Node.js, bundling |
| [ftrack-typescript](skills/ftrack-typescript/SKILL.md) | Type-safe usage, schema generation, typed repositories |
| [ftrack-dashboards](skills/ftrack-dashboards/SKILL.md) | Dashboard widgets, charts, data visualization, PDF export |

Each subskill keeps its runnable examples in its own `examples/` directory so it works independently.

**Prerequisites**: an ftrack server URL, username and API key.

### ftrack-create-pull-request

Creates GitHub pull requests using the org PR template and links them to Linear tickets. See [SKILL.md](skills/ftrack-create-pull-request/SKILL.md).

**Prerequisites**:
- `gh` CLI authenticated with the ftrackhq GitHub org
- Linear MCP server connected
- Git repository on a feature branch

## Usage

Skills load automatically when the conversation matches them:

```
"How do I query tasks in ftrack?"          → ftrack-query
"Set up an event listener for ftrack"      → ftrack-events
"Create a custom ftrack action with a UI"  → ftrack-actions
```

They can also be invoked explicitly:

```bash
/ftrack-api-developer:ftrack-api-developer
/ftrack-api-developer:ftrack-query
/ftrack-create-pull-request:ftrack-create-pull-request
```

## Links

- [ftrack](https://www.ftrack.com)
- [ftrack Developer Hub](https://developer.ftrack.com/)
- [ftrack Python API](https://developer.ftrack.com/api-clients/python/)
- [ftrack JavaScript API](https://developer.ftrack.com/api-clients/javascript/)
