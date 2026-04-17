# ftrack Skills

Agent skills for ftrack development workflows.

## Installation

### Quick Install from Marketplace

**Step 1: Add repository to marketplace**:

```bash
/plugin marketplace add https://github.com/ftrackhq/ftrack-skills
```

**Step 2: Install skills**:

```bash
# Install main orchestrator skill
/install ftrack-api-developer

# Install PR automation skill
/install ftrack-create-pull-request
```

### Alternative: Direct Install

```bash
# Install all skills directly from GitHub
/install https://github.com/ftrackhq/ftrack-skills
```

## Available Plugins

| Plugin | Version | Description | Documentation |
|--------|---------|-------------|---------------|
| **[ftrack-api-developer](skills/ftrack-api-developer/)** | 2.0.0 | ftrack API development orchestrator with 6 specialized subskills | [API Skills README](API_SKILLS.md) |
| **[ftrack-create-pull-request](skills/ftrack-create-pull-request/)** | 1.0.0 | Create GitHub PRs with org template and linked Linear tickets | [Automation README](AUTOMATION.md) |

## Plugin Categories

### API Development Skills

The **ftrack-api-developer** plugin provides comprehensive ftrack API development support through specialized subskills. See [API_SKILLS.md](API_SKILLS.md) for details.

**Subskills included**:
- **ftrack-query** - Query optimization, projections, filtering, pagination
- **ftrack-events** - Real-time event handling, WebSocket subscriptions
- **ftrack-actions** - Custom action handlers with UI forms (Python only)
- **ftrack-files** - File upload/download, components, storage locations
- **ftrack-session** - Session management, authentication, caching
- **ftrack-typescript** - TypeScript integration, schema generation, type safety
- **ftrack-javascript** - JavaScript integration, async patterns, bundling

[→ Read API Skills Documentation](API_SKILLS.md)

### Automation Skills

The **ftrack-create-pull-request** plugin automates GitHub pull request creation with Linear integration. See [AUTOMATION.md](AUTOMATION.md) for details.

[→ Read Automation Documentation](AUTOMATION.md)

## Usage

### Automatic Invocation

Skills trigger automatically when you mention ftrack:

```
"How do I query tasks in ftrack?"           → Auto-loads ftrack-query
"Setup an event listener for ftrack"        → Auto-loads ftrack-events
"Create a custom ftrack action with UI"     → Auto-loads ftrack-actions
```

### Manual Invocation

```bash
# Invoke orchestrator
/ftrack-api-developer "your question"

# Invoke specific subskills
/ftrack-query "optimize this query"
/ftrack-events "setup event handler"
/ftrack-actions "create custom action"

# Invoke automation
/ftrack-create-pull-request
```

## Prerequisites

**For ftrack-api-developer**:
- ftrack account and API credentials

**For ftrack-create-pull-request**:
- `gh` CLI authenticated with ftrackhq GitHub org
- Linear MCP server connected
- Git repository with feature branch

## Update

```bash
# Update specific skill
/skills update ftrack-api-developer

# Update all skills
/skills update --all

# Check for updates
/skills list
```

## Links

- [ftrack](https://www.ftrack.com)
- [ftrackhq on GitHub](https://github.com/ftrackhq)
- [ftrack Developer Hub](https://developer.ftrack.com/)
- [ftrack Python API](https://developer.ftrack.com/api-clients/python/)
- [ftrack JavaScript API](https://developer.ftrack.com/api-clients/javascript/)
