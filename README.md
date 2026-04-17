# ftrack Skills

Agent skills for ftrack development workflows.

## What's Included

### Core Skills

All skills are available in the Claude Code marketplace and can be installed independently.

| Skill | Version | Description | Installation |
|-------|---------|-------------|--------------|
| **[ftrack-api-developer](skills/ftrack-api-developer/)** | 2.0.0 | ftrack API development orchestrator with smart delegation to 6 specialized subskills | `/install ftrack-api-developer` |
| **[ftrack-create-pull-request](skills/ftrack-create-pull-request/)** | 1.0.0 | Create GitHub PRs with org template and linked Linear tickets | `/install ftrack-create-pull-request` |

### ftrack API Subskills (Lazy Loaded)

The `ftrack-api-developer` skill automatically loads these focused subskills on-demand. You can also install them individually if you want them always available.

| Subskill | Version | Tokens | Description | Auto Triggers | Manual Install |
|----------|---------|--------|-------------|---------------|----------------|
| **[ftrack-query](skills/ftrack-query/)** | 1.0.0 | ~800 | Query optimization, projections, filtering, pagination for Python & JavaScript | query, search, filter, find, pagination | `/install ftrack-query` |
| **[ftrack-events](skills/ftrack-events/)** | 1.0.0 | ~600 | Real-time event handling, WebSocket subscriptions, async processing | event, webhook, real-time, subscribe, listen | `/install ftrack-events` |
| **[ftrack-actions](skills/ftrack-actions/)** | 1.0.0 | ~700 | Custom action handlers with UI forms (Python-only: BaseAction framework) | action, handler, ui form, BaseAction, discover, launch | `/install ftrack-actions` |
| **[ftrack-files](skills/ftrack-files/)** | 1.0.0 | ~500 | File upload/download, components, custom locations (S3, disk), thumbnails | upload, download, component, file, location, storage | `/install ftrack-files` |
| **[ftrack-session](skills/ftrack-session/)** | 1.0.0 | ~400 | Session initialization, authentication, caching, connection pooling | session, connection, authentication, cache, initialize | `/install ftrack-session` |
| **[ftrack-typescript](skills/ftrack-typescript/)** | 1.0.0 | ~400 | TypeScript integration, schema generation, type-safe repositories | typescript, types, type-safe, ts, interface | `/install ftrack-typescript` |

**Token efficiency**: 70-93% memory savings vs monolithic approach (loads only what's needed)

**Note**: Subskills load automatically when you use `ftrack-api-developer` - individual installation is optional.

### Quick Reference: Which Skill Do I Need?

| Your Goal | Recommended Skill | Why |
|-----------|------------------|-----|
| **Learn ftrack API** | `ftrack-api-developer` | Smart orchestrator - auto-loads relevant subskills |
| **Query optimization** | `ftrack-query` (or parent) | Focused on query patterns and performance |
| **Real-time updates** | `ftrack-events` (or parent) | WebSocket event handling and dashboards |
| **Custom UI actions** | `ftrack-actions` (or parent) | Python action handlers with forms |
| **Upload/download files** | `ftrack-files` (or parent) | File operations and custom storage |
| **Session management** | `ftrack-session` (or parent) | Connection setup and authentication |
| **TypeScript project** | `ftrack-typescript` (or parent) | Type-safe API with generated schemas |
| **Create GitHub PR** | `ftrack-create-pull-request` | Automate PR creation with Linear integration |

**Recommendation**: Start with `ftrack-api-developer` - it automatically loads the right subskill for your question.

### Detailed Skill Features

<details>
<summary><b>📘 ftrack-api-developer</b> - Smart API orchestrator (click to expand)</summary>

**What it does**: Intelligent skill that detects your question and automatically loads the most relevant subskill.

**Key features**:
- Keyword-based auto-delegation to 6 specialized subskills
- Supports both Python and JavaScript ftrack APIs
- 84% token reduction vs monolithic approach
- Lazy loading - only loads what you need
- Automatic language detection (Python/JavaScript)

**Use cases**:
- General ftrack API questions
- Multi-topic questions (auto-loads multiple subskills)
- Learning ftrack API (gets focused guidance)

**Example questions**:
- "How do I query tasks in ftrack?"
- "Setup event listener for status changes"
- "Create custom action with UI form"

</details>

<details>
<summary><b>🔍 ftrack-query</b> - Query optimization expert (click to expand)</summary>

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

</details>

<details>
<summary><b>⚡ ftrack-events</b> - Real-time event handling (click to expand)</summary>

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

</details>

<details>
<summary><b>🎨 ftrack-actions</b> - Custom action handlers (click to expand)</summary>

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

</details>

<details>
<summary><b>📁 ftrack-files</b> - File operations (click to expand)</summary>

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

</details>

<details>
<summary><b>🔐 ftrack-session</b> - Session management (click to expand)</summary>

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

</details>

<details>
<summary><b>🔷 ftrack-typescript</b> - TypeScript integration (click to expand)</summary>

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

</details>

<details>
<summary><b>🔀 ftrack-create-pull-request</b> - PR automation (click to expand)</summary>

**What it does**: Automate GitHub pull request creation with Linear integration.

**Key features**:
- Fetches org PR template from GitHub
- Links Linear tickets automatically
- Creates ticket if needed
- Pushes branch and opens PR
- Attaches PR URL to Linear

**Prerequisites**:
- `gh` CLI authenticated with ftrackhq GitHub org
- Linear MCP server connected
- Git repo with feature branch

**Workflow**:
1. Gathers context (branch, commits, diff)
2. Finds or creates Linear ticket
3. Pushes branch if unpushed
4. Fetches org PR template
5. Creates PR with template
6. Links PR to Linear ticket

</details>

## Prerequisites

**For ftrack-api-developer skill**:
- ftrack account and API credentials

**For ftrack-create-pull-request skill**:
- `gh` CLI authenticated with access to the ftrackhq GitHub org
- Linear MCP server connected
- Git repo with a feature branch checked out

## Installation

### ⚡ Quick Install

**Step 1: Add repository to marketplace** (recommended):

```bash
/plugin marketplace add https://github.com/ftrackhq/ftrack-skills
```

**Step 2: Install skills from marketplace**:

```bash
/install ftrack-api-developer
```

**Alternative: Direct install from GitHub** (without marketplace):

```bash
/install https://github.com/ftrackhq/ftrack-skills
```

### 🎯 Recommended: Claude Code Marketplace

**The easiest and most reliable way** to install ftrack skills:

#### Method 1: Marketplace UI (Easiest)

1. **Open the marketplace**:
   - Click the **marketplace icon** (🏪) in Claude Code sidebar, OR
   - Type `/marketplace` in the chat

2. **Search for the skill**:
   - Type **"ftrack"** in the search bar
   - Find **"ftrack-api-developer"** in results

3. **Install**:
   - Click **"Install"** button
   - Wait for confirmation (usually 5-10 seconds)
   - Done! Skill is ready to use

#### Method 2: Quick Command (Fastest)

```bash
# Type in Claude Code chat
/install ftrack-api-developer
```

Press Enter and the skill installs automatically from the marketplace.

#### Verify Installation

After installation, confirm it's ready:

```bash
# Check installed skills
/skills list

# Or test it directly
Ask: "How do I query tasks in ftrack?"
```

You should see `ftrack-api-developer` in the list and automatic responses to ftrack questions.

#### What Gets Installed

When you install `ftrack-api-developer` from the marketplace:
- ✅ Main orchestrator skill (auto-delegates to subskills)
- ✅ 6 focused subskills (load on-demand only)
- ✅ Automatic trigger when you mention "ftrack"

**Memory efficiency**: Idle = ~250 tokens, Active = 567 tokens average (84% reduction vs monolithic)

### Alternative Installation Methods

#### Claude Code CLI Installation

**Install using Claude Code commands** - quick and simple:

```bash
# From marketplace (recommended for stable releases)
/install ftrack-api-developer

# From GitHub URL (for latest development version)
/install https://github.com/ftrackhq/skills

# From specific branch (for testing features)
/install https://github.com/ftrackhq/skills#branch-name
```

**Update after changes:**

```bash
# Update specific skill
/skills update ftrack-api-developer

# Update all skills
/skills update --all

# Check installed skills
/skills list
```

**Which option to use?**
- **Marketplace** (`/install ftrack-api-developer`) - Stable releases, recommended for most users
- **GitHub URL** (`/install https://github.com/...`) - Latest changes, development versions, private repos

#### npm Skills CLI Installation

Alternative installation using npm CLI:

```bash
# Install from marketplace
npx @claudecode/skills add ftrackhq/ftrack-skills

# Install from GitHub URL
npx @claudecode/skills add https://github.com/ftrackhq/skills

# Update
npx @claudecode/skills update ftrackhq/ftrack-skills
```

#### Optional: Install Specific Subskills

By default, subskills load automatically when needed. If you want specific subskills always available:

```bash
# In Claude Code marketplace or via command:
/install ftrack-query       # Query optimization (if you query frequently)
/install ftrack-events      # Event handling (for real-time features)
/install ftrack-actions     # Action handlers (Python developers)
/install ftrack-files       # File operations (upload/download workflows)
/install ftrack-session     # Session management (connection issues)
/install ftrack-typescript  # TypeScript integration (TS projects)
```

**Note**: Installing individual subskills is optional - they load automatically when needed.

### Installation Method Comparison

| Method | Best For | Setup Time | Command/Steps |
|--------|----------|------------|---------------|
| **Marketplace UI** | New users, visual preference | 30 seconds | Open marketplace → Search "ftrack" → Install |
| **Marketplace CLI** | Everyone, fastest | 10 seconds | `/install ftrack-api-developer` |
| **GitHub URL** | Latest features, development | 15 seconds | `/install https://github.com/ftrackhq/skills` |
| **npm CLI** | CI/CD, automation scripts | 1 minute | `npx @claudecode/skills add ftrackhq/ftrack-skills` |
| **Local Source** | Skill development | 5 minutes | `/install /path/to/ftrack-skills` |

**Recommendation**: Use **Marketplace CLI** (`/install ftrack-api-developer`) - fastest and most reliable for stable releases.

#### For Developers: Local Source Installation

Install from a local clone for development (skills are symlinked):

```bash
# Using npm skills CLI
npx @claudecode/skills add /path/to/ftrack-skills

# Or in Claude Code
/install /path/to/ftrack-skills
```

## Usage

### Automatic Invocation

The ftrack API developer skill automatically triggers when you mention ftrack:

```
"How do I query tasks in ftrack?"           → Auto-loads ftrack-query
"Setup an event listener for ftrack"        → Auto-loads ftrack-events
"Create a custom ftrack action with UI"     → Auto-loads ftrack-actions
```

### Direct Invocation

Call the orchestrator directly:

```bash
/ftrack-api-developer "your question here"
```

Or invoke specific subskills for faster responses:

```bash
/ftrack-query "optimize this query"
/ftrack-events "setup event handler"
/ftrack-actions "create custom action"
/ftrack-files "upload files to ftrack"
/ftrack-session "initialize session"
/ftrack-typescript "generate types"
```

### How It Works

1. **You ask** about ftrack queries
2. **Orchestrator detects** keywords: "query", "optimize"
3. **Auto-loads** ftrack-query subskill (~800 tokens)
4. **Returns** focused query guidance
5. **Unloads** subskill to free memory

**Memory efficiency**: Only loads what you need, when you need it.

## Update

### Update Skills (Claude Code CLI)

```bash
# Update specific skill
/skills update ftrack-api-developer

# Update all installed skills
/skills update --all

# Check for available updates
/skills list
```

### Update Skills (npm CLI)

```bash
# Update from npm registry
npx @claudecode/skills update ftrackhq/ftrack-skills

# Update from GitHub URL
npx @claudecode/skills update https://github.com/ftrackhq/ftrack-skills
```

**When to update:**
- New features announced in releases
- Bug fixes published
- After pulling latest changes (if using GitHub URL)
- Marketplace shows update available

## Documentation

- **[INSTALLATION.md](INSTALLATION.md)** - Detailed installation guide with lazy loading strategies
- **[SUBSKILLS_BREAKDOWN.md](SUBSKILLS_BREAKDOWN.md)** - Architecture overview and token efficiency metrics
- **[CHECKLIST.md](CHECKLIST.md)** - Implementation status and testing guide

### Subskill Documentation

Each subskill has detailed documentation:

- [ftrack-query README](skills/ftrack-query/README.md) - Query optimization patterns
- [ftrack-events README](skills/ftrack-events/README.md) - Event handling examples
- [ftrack-actions README](skills/ftrack-actions/README.md) - Action handler framework
- [ftrack-files README](skills/ftrack-files/README.md) - File operations guide
- [ftrack-session README](skills/ftrack-session/README.md) - Session management
- [ftrack-typescript README](skills/ftrack-typescript/README.md) - TypeScript integration

## Architecture

### Modular Design

The ftrack skills use a **modular orchestrator pattern** with lazy loading:

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
└── ftrack-typescript [~400 tokens] TypeScript integration
```

### Benefits

- **84% average token reduction** per query (3,500 → 567 tokens)
- **70-93% memory savings** with lazy loading
- **3-4x faster responses** with focused context
- **Easy maintenance** - update subskills independently
- **Backward compatible** - existing workflows unchanged

### Token Comparison

| Approach | Idle Memory | Active Memory | Efficiency |
|----------|-------------|---------------|------------|
| **Old Monolithic** | 3,500 tokens | 3,500 tokens | Baseline |
| **New Orchestrator** | 250 tokens | 817 tokens avg | **77% reduction** |

## Troubleshooting

### Subskill Not Loading

If a subskill doesn't load automatically:

1. **Check keywords**: Ensure your question contains trigger words
2. **Manual invocation**: Directly call the subskill (e.g., `/ftrack-query`)
3. **Verify installation**: Run `/plugin list | grep ftrack`

### Memory Issues

If experiencing high memory usage:

1. Uninstall unused subskills
2. Use minimal installation (parent only)
3. Restart Claude Code to clear cache

### Need Help?

- Check [INSTALLATION.md](INSTALLATION.md) for detailed troubleshooting
- Review subskill READMEs for specific guidance
- Check official ftrack documentation

## Links

- [ftrack](https://www.ftrack.com)
- [ftrackhq on GitHub](https://github.com/ftrackhq)
- [ftrack Developer Hub](https://developer.ftrack.com/)
- [ftrack Python API](https://developer.ftrack.com/api-clients/python/)
- [ftrack JavaScript API](https://developer.ftrack.com/api-clients/javascript/)
