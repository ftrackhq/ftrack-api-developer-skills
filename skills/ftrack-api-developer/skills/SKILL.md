---
name: ftrack-api-developer
description: ftrack API orchestrator - delegates to specialized subskills for queries, events, actions, files, sessions, TypeScript
trigger: ftrack
---

# ftrack API Development Orchestrator

Smart orchestrator for ftrack API development. Automatically delegates to specialized subskills based on user intent.

## Available Subskills

### /ftrack-query - Query Optimization
**Use when**: User asks about querying, searching, filtering, finding entities
**Coverage**: Query syntax, projections, pagination, performance optimization
**Tokens**: ~800

### /ftrack-events - Event Handling
**Use when**: User asks about events, webhooks, real-time updates, subscriptions
**Coverage**: Event hub, topic filters, async processing, WebSocket management
**Tokens**: ~600

### /ftrack-actions - Action Handlers
**Use when**: User asks about custom actions, UI forms, action handlers (Python-only)
**Coverage**: BaseAction, discovery/launch, form building, bulk operations
**Tokens**: ~700

### /ftrack-files - File Operations
**Use when**: User asks about upload, download, components, locations, storage
**Coverage**: File upload/download, custom locations (S3), thumbnails, sequences
**Tokens**: ~500

### /ftrack-session - Session Management
**Use when**: User asks about sessions, connections, authentication, caching
**Coverage**: Session initialization, cache management, connection pooling
**Tokens**: ~400

### /ftrack-typescript - TypeScript Integration
**Use when**: User asks about TypeScript, types, type-safety
**Coverage**: Schema generation, repositories, services, React integration
**Tokens**: ~400

---

## How to Use This Skill

### Automatic Delegation
When you invoke this skill, it will:
1. Analyze the user's question
2. Determine which subskill(s) are relevant
3. Invoke the appropriate subskill(s)
4. Return focused, optimized guidance

### Manual Invocation
Users can directly invoke subskills:
```
/ftrack-query - for query help
/ftrack-events - for event handling
/ftrack-actions - for action handlers
/ftrack-files - for file operations
/ftrack-session - for session management
/ftrack-typescript - for TypeScript
```

---

## Delegation Logic

Analyze user's question for keywords and invoke relevant subskills:

### Query Keywords
`query`, `search`, `filter`, `find`, `select`, `where`, `projection`, `pagination`
→ Invoke `/ftrack-query`

### Event Keywords
`event`, `webhook`, `real-time`, `subscribe`, `listen`, `event hub`, `WebSocket`
→ Invoke `/ftrack-events`

### Action Keywords
`action`, `handler`, `ui form`, `custom action`, `BaseAction`, `discover`, `launch`
→ Invoke `/ftrack-actions`

### File Keywords
`upload`, `download`, `component`, `file`, `asset version`, `location`, `storage`, `S3`, `thumbnail`
→ Invoke `/ftrack-files`

### Session Keywords
`session`, `connection`, `authentication`, `cache`, `initialize`, `login`, `connect`
→ Invoke `/ftrack-session`

### TypeScript Keywords
`typescript`, `types`, `type-safe`, `ts`, `interface`, `schema generation`
→ Invoke `/ftrack-typescript`

---

## Quick Reference (General)

### Language Detection
Before delegating, detect user's language:
- **Python**: `.py`, `import ftrack_api`, `session.query()`, mentions "Python"
- **JavaScript**: `.js`, `.ts`, `import ftrack`, `await session.query()`, mentions "JavaScript"/"JS"/"Node"/"browser"
- **If unclear**: Ask user which language they're using

### Official Resources
- **Developer Hub**: https://developer.ftrack.com/
- **Python API**: https://developer.ftrack.com/api-clients/python/
- **JavaScript API**: https://developer.ftrack.com/api-clients/javascript/
- **API Reference**: https://ftrack-python-api.readthedocs.io/en/stable/api_reference/
- **Python GitHub**: https://github.com/ftrackhq/ftrack-python
- **Recipes**: https://github.com/ftrackhq/ftrack-recipes

### Core Concepts
- **Sessions**: API communication through `Session` object
- **Entities**: Dict-like objects representing ftrack resources (Project, Task, etc.)
- **Querying**: ftrack query language with projections and filters
- **Events**: WebSocket-based real-time updates
- **Components**: Files attached to asset versions
- **Locations**: Storage backends (cloud, S3, disk)

---

## Examples by Topic

### Query Example
```python
# Python
tasks = session.query('select name, status.name from Task where project.id is "{0}"'.format(pid)).all()
```
```javascript
// JavaScript
const response = await session.query('select name, status.name from Task where project.id is "proj-id"');
```
**→ For details, invoke `/ftrack-query`**

### Event Example
```python
# Python
session.event_hub.subscribe('topic=ftrack.update', handler)
```
```javascript
// JavaScript
session.eventHub.subscribe('topic=ftrack.update', handler);
```
**→ For details, invoke `/ftrack-events`**

### Action Example
```python
# Python (only)
class MyAction(BaseAction):
    def launch(self, event):
        # Implementation
        pass
```
**→ For details, invoke `/ftrack-actions`**

### File Example
```python
# Python
component = asset_version.create_component(path='/path/to/file.ma', location=location)
```
```javascript
// JavaScript
await session.upload(component.id, file);
```
**→ For details, invoke `/ftrack-files`**

### Session Example
```python
# Python
with ftrack_api.Session() as session:
    # Auto-cleanup
    pass
```
```javascript
// JavaScript
const session = new ftrack.Session(server, user, key);
await session.initializing;
```
**→ For details, invoke `/ftrack-session`**

### TypeScript Example
```typescript
// TypeScript
const tasks = await session.query<Task>('select name from Task');
```
**→ For details, invoke `/ftrack-typescript`**

---

## Decision Tree

```
User asks about ftrack
├─ Multiple topics? → Invoke multiple subskills in parallel
├─ Query/search/filter? → /ftrack-query
├─ Events/webhooks? → /ftrack-events
├─ Actions/UI forms? → /ftrack-actions
├─ Files/upload/storage? → /ftrack-files
├─ Session/connection? → /ftrack-session
├─ TypeScript/types? → /ftrack-typescript
└─ General/unclear? → Ask clarifying question, then delegate
```

---

## Response Guidelines

1. **Analyze Intent**: Understand what user is trying to accomplish
2. **Detect Language**: Python or JavaScript (or ask if unclear)
3. **Delegate**: Invoke 1-2 most relevant subskills
4. **Synthesize**: Combine subskill responses if multiple invoked
5. **Provide Links**: Point to official docs for deep dives
6. **Optimize**: Only load what's needed to answer the question

---

## When to Use WebFetch

Use WebFetch to verify documentation when:
- User asks about specific API methods not covered in subskills
- Working with newer features or version-specific info
- Uncertain about current syntax or parameters
- User requests official examples or references

**Strategy**: Delegate to subskill first, use WebFetch only if needed for clarification.

---

## Token Efficiency

Total available tokens across subskills: ~3,400
- **ftrack-query**: 800 tokens
- **ftrack-events**: 600 tokens
- **ftrack-actions**: 700 tokens
- **ftrack-files**: 500 tokens
- **ftrack-session**: 400 tokens
- **ftrack-typescript**: 400 tokens

**Previous monolithic skill**: 3,500 tokens (always loaded)
**New approach**: 400-800 tokens (only what's needed)
**Savings**: 76-89% reduction per query

---

## Migration Notes

This orchestrator replaces the previous monolithic `ftrack-developer` skill:
- **Old**: Single 3,500 token skill with all content
- **New**: Orchestrator + 6 focused subskills (400-800 tokens each)
- **Benefit**: Load only relevant content, faster responses, better focus
- **Compatibility**: Users can still invoke `/ftrack-api-developer` (auto-delegates)
