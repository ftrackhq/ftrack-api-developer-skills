---
name: ftrack-api-developer
description: Entry point for ftrack API development in Python and JavaScript/TypeScript; routes to the focused ftrack-* subskills (query, events, actions, files, session, javascript, typescript, dashboards). Use when code imports `ftrack_api`, `@ftrack/api` or `@ftrack/web-widget`, uses an ftrack Session or entities, or the user asks about the ftrack API or building an ftrack integration and the topic spans several areas or is unclear. Not for non-ftrack code or other media asset management systems.
---

# ftrack API Development Orchestrator

Smart orchestrator for ftrack API development. Automatically delegates to specialized subskills based on user intent.

## Available Subskills

### /ftrack-query - Query Optimization
**Use when**: User asks about querying, searching, filtering, finding entities
**Coverage**: Query syntax, projections, pagination, performance optimization

### /ftrack-events - Event Handling
**Use when**: User asks about events, webhooks, real-time updates, subscriptions
**Coverage**: Event hub, topic filters, async processing, WebSocket management

### /ftrack-actions - Action Handlers
**Use when**: User asks about custom actions, UI forms, action handlers (Python-only)
**Coverage**: BaseAction, discovery/launch, form building, bulk operations

### /ftrack-files - File Operations
**Use when**: User asks about upload, download, components, locations, storage
**Coverage**: File upload/download, custom locations (S3), thumbnails, sequences

### /ftrack-session - Session Management
**Use when**: User asks about sessions, connections, authentication, caching
**Coverage**: Session initialization, cache management, connection pooling

### /ftrack-javascript - JavaScript Patterns
**Use when**: User asks about JavaScript, async/await, browser/Node.js, ES6+
**Coverage**: Async patterns, Promises, file handling, bundling, performance

### /ftrack-typescript - TypeScript Integration
**Use when**: User asks about TypeScript, types, type-safety
**Coverage**: Schema generation, repositories, services, React integration

### /ftrack-dashboards - Dashboard Development
**Use when**: User asks about dashboards, widgets, charts, visualization, React widgets
**Coverage**: Widget setup, data visualization, charts (Recharts), calendars, PDF export, theme management

---

## How to Use This Skill

### Automatic Delegation
When you invoke this skill, it will:
1. **Check for TypeScript**: If `.ts` files, `tsconfig.json`, or TypeScript keywords detected → ALWAYS include `/ftrack-typescript`
2. Analyze the user's question
3. Determine which subskill(s) are relevant
4. Invoke the appropriate subskill(s)
5. Return focused, optimized guidance

### Manual Invocation
Users can directly invoke subskills:
```
/ftrack-query - for query help
/ftrack-events - for event handling
/ftrack-actions - for action handlers
/ftrack-files - for file operations
/ftrack-session - for session management
/ftrack-javascript - for JavaScript patterns
/ftrack-typescript - for TypeScript
/ftrack-dashboards - for dashboard/widget development
```

---

## Delegation Logic

Analyze user's question for keywords and invoke relevant subskills:

### Query Keywords
`query`, `search`, `filter`, `find`, `select`, `where`, `projection`, `pagination`, `aggregate`, `group by`, `count`, `sum`
→ Invoke `/ftrack-query`
**Note**: ftrack-query covers server-side aggregation (`group by` with counts/sums) for dashboard numbers

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

### JavaScript Keywords
`javascript`, `js`, `async`, `await`, `promise`, `.js` files, ES6, browser, Node.js, webpack, bundling
→ Invoke `/ftrack-javascript`

### TypeScript Keywords
`typescript`, `types`, `type-safe`, `.ts` files, `interface`, `schema generation`, type definitions, type safety
→ Invoke `/ftrack-typescript`

### Dashboard Keywords
`dashboard`, `widget`, `chart`, `visualization`, `graph`, `calendar`, `@ftrack/web-widget`, `recharts`, `react-big-calendar`, `PDF export`
→ Invoke `/ftrack-dashboards`

**Note**: 
- JavaScript projects (`.js` files, async/await, browser/Node.js keywords) should load `/ftrack-javascript`
- TypeScript projects (`.ts` files, `tsconfig.json`, TypeScript keywords) should load `/ftrack-typescript`
- For `.ts` files, ALWAYS load BOTH `/ftrack-javascript` AND `/ftrack-typescript` as TypeScript builds on JavaScript
- Dashboard projects should load `/ftrack-dashboards` (and optionally `/ftrack-javascript` for base patterns)

---

## Quick Reference (General)

### Language Detection
Before delegating, detect user's language:
- **Python**: `.py`, `import ftrack_api`, `session.query()`, mentions "Python"
- **JavaScript**: `.js`, `import ftrack`, `await session.query()`, mentions "JavaScript"/"JS"/"Node"/"browser" → Invoke `/ftrack-javascript`
- **TypeScript**: `.ts`, `interface`, `type`, mentions "TypeScript"/"TS" → Invoke BOTH `/ftrack-javascript` AND `/ftrack-typescript`
- **If unclear**: Ask user which language they're using

### Official Resources
- **Developer Hub**: https://developer.ftrack.com/
- **Python API**: https://developer.ftrack.com/api-clients/python/
- **JavaScript API**: https://developer.ftrack.com/api-clients/javascript/
- **API Reference**: https://developer.ftrack.com/api-clients/python/
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

### Dashboard Example
```javascript
// React dashboard widget
import { getActiveTheme } from '@ftrack/web-widget';
import useSession from './session_context';

function Dashboard() {
  const session = useSession();
  const theme = getActiveTheme();
  
  useEffect(() => {
    window.addEventListener('ftrackWidgetUpdate', handleUpdate);
  }, []);
  
  return <div className={`dashboard theme-${theme}`}>...</div>;
}
```
**→ For details, invoke `/ftrack-dashboards`**

---

## Decision Tree

```
User asks about ftrack
├─ Multiple topics? → Invoke multiple subskills in parallel
├─ Dashboard/widget/chart detected? → Include /ftrack-dashboards (+ /ftrack-javascript if needed)
├─ TypeScript detected (.ts, tsconfig.json, TS keywords)? → Include /ftrack-javascript + /ftrack-typescript
├─ JavaScript detected (.js, async/await, browser/Node.js)? → Include /ftrack-javascript
├─ Query/search/filter? → /ftrack-query
├─ Events/webhooks? → /ftrack-events
├─ Actions/UI forms? → /ftrack-actions
├─ Files/upload/storage? → /ftrack-files
├─ Session/connection? → /ftrack-session
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

## Resource Loading Strategy (IMPORTANT)

**Three-Tier Approach** - Minimize context usage by loading progressively:

### Tier 1: Quick Reference (70% of queries)
Each subskill has a minimal quick reference section with 5-8 core patterns.
- **When**: Simple "how do I..." questions
- **Action**: Invoke subskill normally - it will use quick reference

### Tier 2: Online Documentation (25% of queries)
Fetch fresh, authoritative content from official docs.
- **When**: User needs detailed API reference, edge cases, or latest features
- **Action**: Use WebFetch with URLs from "Official Resources" section below

### Tier 3: Local Examples (5% of queries - fallback only)
Load comprehensive local example files.
- **When**: WebFetch fails OR user explicitly requests local examples OR needs runnable code
- **Action**: Tell the subskill to read a specific file from its own `examples/` directory

### Decision Flow
```
User Question
  ├─ Simple/common pattern? 
  │   └→ Invoke subskill (uses quick reference)
  │
  ├─ Needs detailed docs/API reference?
  │   ├→ WebFetch official docs first
  │   └→ If fails: Tell subskill to load local examples
  │
  └─ Needs runnable code?
      └→ Tell subskill to read specific example file
```

### Official Resources for WebFetch

**Python Query Docs:**
- URL: `https://developer.ftrack.com/api-clients/python/querying`
- Fetch prompt: "Extract ftrack Python query patterns. Include select/where syntax, projections, filtering, pagination examples. Format as markdown."

**JavaScript Query Docs:**
- URL: `https://developer.ftrack.com/api/query-language`
- Fetch prompt: "Extract ftrack JavaScript query patterns. Include async/await examples, error handling. Format as markdown."

**Python Events:**
- URL: `https://developer.ftrack.com/api-clients/python/handling-events`
- Fetch prompt: "Extract Python event hub patterns. Include subscription syntax, event topics, handler patterns. Format as markdown."

**JavaScript Events:**
- URL: `https://developer.ftrack.com/api-clients/javascript/handling-events`
- Fetch prompt: "Extract JavaScript event hub patterns. Include WebSocket handling, subscriptions. Format as markdown."

**Python Actions:**
- URL: `https://developer.ftrack.com/extending-ftrack/actions`
- Fetch prompt: "Extract action handler patterns. Include BaseAction usage, discovery/launch, UI forms. Format as markdown."

**Locations (Files):**
- URL: `https://developer.ftrack.com/api-clients/python/locations/overview`
- Fetch prompt: "Extract location and file component patterns. Include upload/download, custom locations. Format as markdown."

**Session Management:**
- URL: `https://developer.ftrack.com/api-clients/python/understanding-sessions`
- Fetch prompt: "Extract session initialization and management patterns. Include authentication, caching. Format as markdown."

**Example Repositories:**
- URL: `https://github.com/ftrackhq/ftrack-recipes`
- Fetch prompt: "Extract [specific topic] examples. Show complete working patterns."

### WebFetch Decision Logic

When delegating to subskills, detect if WebFetch should be used based on user's query:

**Trigger Phrases for Online Docs:**
- "show all [operators|topics|methods|options]"
- "complete [reference|syntax|documentation|API]"
- "official docs" / "official documentation"
- "latest features" / "what's new"
- "full API reference"
- "edge cases for..."
- "all [authentication|location|event] types"

**Language Selection for URLs:**
- **Python**: `.py` extension, `import ftrack_api`, "Python" keyword
- **JavaScript**: `.js` extension, `import ftrack`, "JavaScript"/"JS", "browser", "Node.js"
- **TypeScript**: `.ts` extension, "TypeScript"/"TS", "type-safe"

**How to Instruct Subskills:**

When invoking a subskill AND trigger phrase detected:
1. Detect user's language from query context
2. Pass explicit instruction: "Fetch online docs for [topic] ([language])"
3. Subskill uses WebFetch with appropriate URL from mapping above
4. If fetch fails, subskill loads local example file as fallback

**Example:**
```
User: "Show me all query operators for Python"
→ Detect trigger: "show all operators"
→ Detect language: "Python"
→ Invoke: /ftrack-query "Fetch online docs for query operators (Python)"
→ Subskill fetches: https://developer.ftrack.com/api-clients/python/querying
→ If fails: ftrack-query reads its local references/query-language.md
```
