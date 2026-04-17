# ftrack API Development Skills

Comprehensive ftrack API development support through specialized subskills.

## Overview

The **ftrack-api-developer** skill is a smart orchestrator that automatically loads the most relevant subskill based on your question. This modular approach provides:

- **84% token reduction** vs monolithic approach
- **Lazy loading** - only loads what you need
- **Automatic language detection** (Python/JavaScript)
- **Multi-topic support** - auto-loads multiple subskills when needed

## Installation

```bash
# Install from marketplace
/install ftrack-api-developer

# Or install specific subskills individually
/install ftrack-query
/install ftrack-events
/install ftrack-actions
/install ftrack-files
/install ftrack-session
/install ftrack-typescript
/install ftrack-javascript
```

**Note**: Individual subskill installation is optional - they load automatically when needed.

## Subskills Overview

| Subskill | Tokens | Description | Auto Triggers |
|----------|--------|-------------|---------------|
| **[ftrack-query](skills/ftrack-query/)** | ~800 | Query optimization, projections, filtering, pagination | query, search, filter, find, pagination |
| **[ftrack-events](skills/ftrack-events/)** | ~600 | Real-time event handling, WebSocket subscriptions | event, webhook, real-time, subscribe, listen |
| **[ftrack-actions](skills/ftrack-actions/)** | ~700 | Custom action handlers with UI forms (Python only) | action, handler, ui form, BaseAction, discover, launch |
| **[ftrack-files](skills/ftrack-files/)** | ~500 | File upload/download, components, storage locations | upload, download, component, file, location, storage |
| **[ftrack-session](skills/ftrack-session/)** | ~400 | Session management, authentication, caching | session, connection, authentication, cache, initialize |
| **[ftrack-typescript](skills/ftrack-typescript/)** | ~400 | TypeScript integration, schema generation, type safety | typescript, types, type-safe, ts, interface |
| **[ftrack-javascript](skills/ftrack-javascript/)** | ~400 | JavaScript integration, async patterns, bundling | javascript, js, async, promise, ES6 |

**Memory efficiency**: 70-93% savings vs loading all skills at once.

## Quick Reference: Which Skill Do I Need?

| Your Goal | Recommended Skill | Why |
|-----------|------------------|-----|
| **Learn ftrack API** | `ftrack-api-developer` | Smart orchestrator - auto-loads relevant subskills |
| **Query optimization** | `ftrack-query` | Focused on query patterns and performance |
| **Real-time updates** | `ftrack-events` | WebSocket event handling and dashboards |
| **Custom UI actions** | `ftrack-actions` | Python action handlers with forms |
| **Upload/download files** | `ftrack-files` | File operations and custom storage |
| **Session management** | `ftrack-session` | Connection setup and authentication |
| **TypeScript project** | `ftrack-typescript` | Type-safe API with generated schemas |
| **JavaScript project** | `ftrack-javascript` | Browser/Node.js patterns, modern ES6+ |

**Recommendation**: Start with `ftrack-api-developer` - it automatically loads the right subskill for your question.

## Detailed Skill Features

### 📘 ftrack-api-developer - Smart API Orchestrator

**What it does**: Intelligent skill that detects your question and automatically loads the most relevant subskill.

**Key features**:
- Keyword-based auto-delegation to specialized subskills
- Supports both Python and JavaScript ftrack APIs
- 84% token reduction vs monolithic approach
- Lazy loading - only loads what you need
- Automatic language detection

**Use cases**:
- General ftrack API questions
- Multi-topic questions (auto-loads multiple subskills)
- Learning ftrack API (gets focused guidance)

**Example questions**:
- "How do I query tasks in ftrack?"
- "Setup event listener for status changes"
- "Create custom action with UI form"

### 🔍 ftrack-query - Query Optimization

**What it does**: Optimize ftrack queries for performance and efficiency.

**Key features**:
- Query syntax and projections
- Filtering best practices (IDs vs names)
- Pagination strategies
- Performance optimization checklist
- Both Python and JavaScript examples

**Covers**:
- `select` projections for minimal data transfer
- `where` clauses with optimal filtering
- Pagination with offset/limit
- Query builders and advanced patterns
- Cache optimization

**Example usage**:
```python
# Optimized query with projections
session.query(
    'select name, status.name from Task where project.id is "{}"'
).all()
```

[→ Read full documentation](skills/ftrack-query/README.md)

### ⚡ ftrack-events - Real-time Event Handling

**What it does**: Build real-time features with WebSocket events.

**Key features**:
- Event hub initialization and management
- Topic-based subscriptions and filtering
- Async event processing patterns
- Batch event handling
- React/UI integration examples

**Covers**:
- WebSocket connection management
- Event topic filtering (create, update, delete)
- Debouncing and throttling
- Auto-updating dashboards
- Error handling and reconnection

**Example usage**:
```python
# Subscribe to task status changes
session.event_hub.subscribe(
    'topic=ftrack.update and data.entities.objectTypeId=Task',
    callback
)
```

[→ Read full documentation](skills/ftrack-events/README.md)

### 🎨 ftrack-actions - Custom Action Handlers

**What it does**: Build custom ftrack actions with UI forms (Python-only).

**Key features**:
- BaseAction framework patterns
- Discovery and launch lifecycle
- UI form building (all field types)
- Multi-step forms and validation
- Bulk operations and deployment

**Covers**:
- Action discovery logic
- UI form widgets (text, dropdown, date, etc.)
- User input validation
- Batch entity updates
- Action server setup

**Note**: Python-only (JavaScript API doesn't support actions)

**Example usage**:
```python
class MyAction(ftrack_api.action.BaseAction):
    def discover(self, event):
        return {'items': [{'label': 'My Action'}]}
    
    def launch(self, event):
        # Action logic here
        pass
```

[→ Read full documentation](skills/ftrack-actions/README.md)

### 📁 ftrack-files - File Operations

**What it does**: Upload, download, and manage files in ftrack.

**Key features**:
- File upload (single files and sequences)
- File download and component management
- Custom storage locations (S3, disk)
- Thumbnail generation and upload
- Resource transformers for file organization

**Covers**:
- Browser and Node.js file uploads
- Progress tracking
- Custom S3/disk locations
- Image sequences
- Component queries

**Example usage**:
```python
# Upload file to task
component = session.create_component(
    '/path/to/file.mp4',
    data={'name': 'my-video'},
    location=location
)
task['metadata']['ftr_meta']['file'] = component
session.commit()
```

[→ Read full documentation](skills/ftrack-files/README.md)

### 🔐 ftrack-session - Session Management

**What it does**: Manage ftrack API sessions, authentication, and connections.

**Key features**:
- Session initialization patterns
- Context managers (Python) and async/await (JavaScript)
- Environment variable configuration
- Cache management strategies
- Connection pooling for high-traffic apps

**Covers**:
- Authentication methods (API keys, service accounts)
- Cache optimization and clearing
- Connection error handling
- Retry logic and timeouts
- React hooks for sessions

**Example usage**:
```python
# Context manager pattern
with ftrack_api.Session() as session:
    task = session.query('Task').first()
    # Session auto-commits and closes
```

[→ Read full documentation](skills/ftrack-session/README.md)

### 🔷 ftrack-typescript - TypeScript Integration

**What it does**: Build type-safe ftrack applications with TypeScript.

**Key features**:
- Schema generation from your workspace
- Type-safe queries with generics
- Repository and service patterns
- React integration with hooks
- Jest testing patterns

**Covers**:
- `@ftrack/ts-schema-generator` usage
- Type-safe query builders
- Repository pattern implementation
- Express API with types
- Testing with mocked sessions

**Note**: JavaScript/TypeScript only

**Example usage**:
```typescript
// Type-safe query
const tasks = await session.query<Task>(
  'select name, status.name from Task'
);
```

[→ Read full documentation](skills/ftrack-typescript/README.md)

### 📜 ftrack-javascript - JavaScript Integration

**What it does**: Build ftrack applications with modern JavaScript.

**Key features**:
- Async/await patterns
- Promise handling
- Browser and Node.js support
- ES6+ features
- Module bundling

**Covers**:
- Modern JavaScript syntax
- Async iteration
- Error handling
- Webpack/Rollup configuration
- Browser compatibility

**Example usage**:
```javascript
// Modern async/await
const tasks = await session.query(
  'select name from Task'
).all();
```

[→ Read full documentation](skills/ftrack-javascript/README.md)

## How It Works

1. **You ask** about ftrack queries
2. **Orchestrator detects** keywords: "query", "optimize"
3. **Auto-loads** ftrack-query subskill (~800 tokens)
4. **Returns** focused query guidance
5. **Unloads** subskill to free memory

**Memory efficiency**: Only loads what you need, when you need it.

## Usage Examples

### Automatic Invocation

```
"How do I query tasks in ftrack?"           → Auto-loads ftrack-query
"Setup an event listener for ftrack"        → Auto-loads ftrack-events
"Create a custom ftrack action with UI"     → Auto-loads ftrack-actions
"Upload files to ftrack"                    → Auto-loads ftrack-files
"Initialize ftrack session"                 → Auto-loads ftrack-session
"Generate TypeScript types for ftrack"      → Auto-loads ftrack-typescript
"Use ftrack in browser with JavaScript"     → Auto-loads ftrack-javascript
```

### Direct Invocation

```bash
# Call orchestrator
/ftrack-api-developer "your question here"

# Call specific subskills for faster responses
/ftrack-query "optimize this query"
/ftrack-events "setup event handler"
/ftrack-actions "create custom action"
/ftrack-files "upload files to ftrack"
/ftrack-session "initialize session"
/ftrack-typescript "generate types"
/ftrack-javascript "async patterns"
```

## Architecture

### Modular Design

```
ftrack-api-developer (Orchestrator)
├── Detects user intent from keywords
├── Loads only relevant subskill(s)
├── Returns focused guidance
└── Unloads to free memory

Subskills (Loaded on-demand):
├── ftrack-query      [~800 tokens] Query optimization
├── ftrack-events     [~600 tokens] Event handling
├── ftrack-actions    [~700 tokens] Action handlers
├── ftrack-files      [~500 tokens] File operations
├── ftrack-session    [~400 tokens] Session management
├── ftrack-typescript [~400 tokens] TypeScript integration
└── ftrack-javascript [~400 tokens] JavaScript integration
```

### Token Comparison

| Approach | Idle Memory | Active Memory | Efficiency |
|----------|-------------|---------------|------------|
| **Old Monolithic** | 3,500 tokens | 3,500 tokens | Baseline |
| **New Orchestrator** | 250 tokens | 567-817 tokens | **77-84% reduction** |

## Troubleshooting

### Subskill Not Loading

If a subskill doesn't load automatically:

1. **Check keywords**: Ensure your question contains trigger words
2. **Manual invocation**: Directly call the subskill (e.g., `/ftrack-query`)
3. **Verify installation**: Run `/skills list | grep ftrack`

### Memory Issues

If experiencing high memory usage:

1. Uninstall unused subskills
2. Use minimal installation (parent only)
3. Restart Claude Code to clear cache

## Prerequisites

- ftrack account and API credentials
- Python 3.7+ (for Python API)
- Node.js 14+ (for JavaScript API)

## Links

- [ftrack Developer Hub](https://developer.ftrack.com/)
- [ftrack Python API](https://developer.ftrack.com/api-clients/python/)
- [ftrack JavaScript API](https://developer.ftrack.com/api-clients/javascript/)
