---
name: ftrack-query
description: ftrack query optimization - projections, filtering, pagination for Python & JavaScript
---

TRIGGER when: code uses `session.query()` method; file contains ftrack query strings with select/where/from syntax; user asks about querying ftrack, searching entities, filtering tasks/assets, projections, or pagination.
SKIP: SQL queries, general database queries, search without ftrack context.

# ftrack Query Optimization Expert

**Strategy**: Quick reference first → Fetch online docs if needed → Load local examples as fallback

## Language Detection
- **Python**: `.py`, `session.query()`, `import ftrack_api`
- **JavaScript**: `.js`, `.ts`, `await session.query()`, `import ftrack`

---

## Quick Reference (Use First - 70% of Queries)

### Core Principles
✓ **Always use projections**: `select name, status.name from Task`
✓ **Filter at database**: `where project.id is "uuid"`
✓ **Use IDs over names**: `where project.id is "abc"` (faster than `project.name`)
✗ Avoid `select *` or no projection
✗ Never fetch all then filter in code

### Python Quick Patterns
```python
# Basic query with projection
tasks = session.query(
    'select name, status.name from Task where project.id is "{}"'.format(pid)
).all()

# Single result
task = session.query('select name from Task where id is "{}"'.format(tid)).one()

# Count without fetching
count = session.query('Task where project.id is "{}"'.format(pid)).count()

# Multiple conditions
tasks = session.query(
    'select name from Task where project.id is "{}" and status.name is "Active"'
).format(pid).all()

# Pagination
query = session.query('select name from Task order by created_at desc')
query.page_size = 200
results = query.all()
```

### JavaScript Quick Patterns
```javascript
// Basic query with projection
const response = await session.query(
  'select name, status.name from Task where project.id is "' + projectId + '"'
);
const tasks = response.data;

// Async/await with error handling
try {
  const result = await session.query('select name from Task where id is "task-id"');
  console.log(result.data);
} catch (error) {
  console.error('Query failed:', error);
}

// Multiple results iteration
const response = await session.query('select name from Task');
response.data.forEach(task => console.log(task.name));
```

### Common Query Operators
```python
# Comparison
'where status.name is "Active"'
'where priority > 50'
'where created_at >= "2026-01-01"'

# Multiple conditions
'where project.id is "..." and status.name is "Active"'
'where name like "%render%"'

# Collections
'where status.name in ("Active", "Review")'
'where ancestors any (id is "parent-id")'

# Relationships
'select name, parent.name, project.name from Task'
```

### Aggregation Patterns for Dashboards

**Python - Group by Status**
```python
# Query all tasks with status info
tasks = session.query(
    'select status.name, status.color from Task where project.id is "{}"'.format(pid)
).all()

# Aggregate in Python
status_counts = {}
for task in tasks:
    status = task['status']['name']
    status_counts[status] = status_counts.get(status, 0) + 1

# Format for charts: [{'name': 'Active', 'value': 10, 'color': '#00ff00'}, ...]
chart_data = [
    {'name': status, 'value': count, 'color': tasks[0]['status']['color']}
    for status, count in status_counts.items()
]
```

**JavaScript - Group by Status**
```javascript
// Query all tasks
const response = await session.query(
  `select status.name, status.color from Task where project.id is "${projectId}"`
);

// Aggregate with reduce
const statusCounts = response.data.reduce((acc, task) => {
  const status = task.status.name;
  if (!acc[status]) {
    acc[status] = { name: status, value: 0, color: task.status.color };
  }
  acc[status].value += 1;
  return acc;
}, {});

// Format for charts
const chartData = Object.values(statusCounts);
```

**Python - Calculate Completion Percentage**
```python
# Query with state information
tasks = session.query(
    'select status.state from Task where project.id is "{}"'.format(pid)
).all()

total = len(tasks)
done = sum(1 for t in tasks if t['status']['state'] == 'DONE')
percentage = (done / total * 100) if total > 0 else 0

print(f"Completion: {percentage:.1f}% ({done}/{total})")
```

**JavaScript - Progress by Type**
```javascript
// Query tasks by type and state
const response = await session.query(
  `select type.name, status.state from Task where project.id is "${projectId}"`
);

// Group by type and state
const typeData = {};
response.data.forEach(task => {
  const type = task.type.name;
  const state = task.status.state;
  
  if (!typeData[type]) {
    typeData[type] = { name: type, done: 0, inProgress: 0, notStarted: 0 };
  }
  
  if (state === 'DONE') typeData[type].done += 1;
  else if (state === 'IN_PROGRESS') typeData[type].inProgress += 1;
  else typeData[type].notStarted += 1;
});

// Format for stacked bar charts
const chartData = Object.values(typeData);
```

**Python - Time Series Aggregation**
```python
from datetime import datetime

# Query tasks with timestamps
tasks = session.query(
    'select name, status.state, updated_at from Task where project.id is "{}"'
).format(pid).all()

# Group by month
monthly_data = {}
for task in tasks:
    month = task['updated_at'].strftime('%Y-%m')
    if month not in monthly_data:
        monthly_data[month] = {'month': month, 'completed': 0, 'total': 0}
    
    monthly_data[month]['total'] += 1
    if task['status']['state'] == 'DONE':
        monthly_data[month]['completed'] += 1

# Calculate completion rate
for month_data in monthly_data.values():
    rate = (month_data['completed'] / month_data['total'] * 100)
    month_data['completionRate'] = round(rate, 1)
```

**JavaScript - User Workload Aggregation**
```javascript
// Query tasks with assignments
const response = await session.query(
  `select assignments.resource.name from Task where project.id is "${projectId}"`
);

// Count tasks per user
const userCounts = {};
response.data.forEach(task => {
  task.assignments?.forEach(assignment => {
    const userName = assignment.resource.name;
    userCounts[userName] = (userCounts[userName] || 0) + 1;
  });
});

// Format for bar charts
const chartData = Object.entries(userCounts).map(([name, value]) => ({
  name,
  value
}));
```

**→ This quick reference handles most common queries including dashboard aggregations. For advanced usage, continue below.**

---

## Online Resources (Fetch for Detailed Info)

### When to Fetch
- User asks for "all operators" or "complete syntax"
- Needs edge cases or advanced features
- Wants official examples or API reference
- Unclear about specific query functionality

### Python Documentation
**URL**: `https://developer.ftrack.com/api-clients/python/querying`
**Fetch Prompt**: 
```
Extract ftrack Python query patterns and syntax. Include:
- Complete operator list (comparison, logical, collection)
- Projection syntax and examples
- Filtering with where clauses
- Pagination strategies
- Performance optimization tips
Format as markdown with code examples.
```

### JavaScript Documentation
**URL**: `https://developer.ftrack.com/api/query-language`
**Fetch Prompt**:
```
Extract ftrack JavaScript query patterns. Include:
- Async/await query examples
- Error handling patterns
- Pagination with promises
- Response data access
Format as markdown with async/await code examples.
```

### Query Language Reference
**URL**: `https://developer.ftrack.com/api/query-language`
**Fetch Prompt**:
```
Extract ftrack query language operators and syntax. Include:
- All comparison operators
- Logical operators (and, or, not)
- Collection operators (any, in)
- String operations (like, matches)
- Date/time filtering
Format as markdown with examples.
```

### WebFetch Decision Tree

**IMPORTANT**: Actively check user query for trigger phrases, then use WebFetch.

**Trigger detection** (check user's exact query):
```python
trigger_phrases = [
    "show all operators",
    "complete query syntax", 
    "official query docs",
    "full operator list",
    "edge cases",
    "advanced filtering patterns",
    "all query operators",
    "query language reference"
]
```

**Action when trigger detected:**
1. **Detect language**: Python (`.py`, `ftrack_api`) or JavaScript (`.js`, `await`, `ftrack`)
2. **Use WebFetch** with appropriate URL above
3. **If fetch succeeds**: Return formatted docs to user
4. **If fetch fails**: Gracefully fallback to local example (see "Local Examples" section)

**WebFetch Example:**
```markdown
# User asks: "Show me all query operators for Python"
# Trigger detected: "show all operators"
# Language detected: "Python"

Use WebFetch tool:
WebFetch(
  url="https://developer.ftrack.com/api-clients/python/querying",
  prompt="Extract ftrack Python query patterns and complete operator syntax. Include comparison, logical, and collection operators with examples. Format as markdown."
)

If successful: Present docs
If fails: Load examples/python/performance_optimization.py (lines 1-100)
```

---

## Local Examples (Fallback - Load Only When Needed)

### When to Load Local
1. WebFetch fails or times out
2. User explicitly requests "local examples" or "show me the code file"
3. Online docs don't cover the specific use case
4. User needs complete runnable code

### Available Local Files

**Python Comprehensive Examples**
- **File**: `examples/python/performance_optimization.py`
- **Contains**: 
  - Query optimization patterns (projections, filtering, pagination)
  - **Dashboard aggregations** (status counts, completion %, time series, user workload, multi-dimensional)
  - Batch operations and caching
  - Performance profiling
- **Load when**: Need Python production patterns, dashboard data aggregation, performance tuning
- **Size**: ~500 lines
- **Key sections**:
  - Lines 22-98: Query optimization
  - Lines 100-287: Dashboard aggregation patterns (NEW - 6 aggregation types)
  - Lines 288+: Batch operations and caching

**JavaScript Comprehensive Examples**
- **File**: `examples/javascript/query-operations.js`
- **Contains**: 
  - Async patterns with await/promises
  - Error handling and pagination
  - **Dashboard aggregations** (status, completion, type progress, trends, workload, multi-dimensional)
  - Query builder utility
- **Load when**: Need JavaScript production patterns, dashboard data processing, complex async flows
- **Size**: ~600 lines
- **Key sections**:
  - Lines 1-230: Basic patterns and pagination
  - Lines 232-420: Dashboard aggregation functions (NEW - 6 aggregation types)
  - Lines 422+: Query utilities

### How to Load
Paths are relative to this skill's directory (the folder containing this SKILL.md). Read only the file you need, then extract the sections relevant to the user's question.

---

## Decision Tree

```
User asks about ftrack queries
  │
  ├─ Simple query pattern (how to query X)?
  │   └→ Use Quick Reference above ✓
  │
  ├─ Needs complete operator list?
  │   ├→ WebFetch query language reference
  │   └→ If fails: Load local examples
  │
  ├─ Needs language-specific details?
  │   ├→ WebFetch Python or JavaScript docs
  │   └→ If fails: Load local examples
  │
  ├─ Needs production/performance patterns?
  │   ├→ WebFetch ftrack-recipes repo
  │   └→ If fails: Load local examples
  │
  └─ Needs runnable code file?
      └→ Load specific example file directly
```

---

## Response Strategy

### For Simple Questions
1. Answer using Quick Reference
2. Keep response concise (2-3 examples)
3. Cite source: "From core query patterns"

### For Detailed Questions
1. Start with Quick Reference summary
2. WebFetch relevant documentation
3. Synthesize fetch results
4. Cite source: "From [URL]"
5. If fetch fails: Load local examples + cite filename

### For Complex Questions
1. Assess if multiple resources needed
2. WebFetch primary docs first
3. If insufficient, load local examples
4. Provide complete working code
5. Cite all sources used

### Progressive Disclosure
Don't overwhelm the user:
- Start minimal (quick reference)
- Offer more: "Need advanced patterns? I can fetch detailed docs"
- Load comprehensive examples only if requested

---

## Error Handling

### If WebFetch Fails
```markdown
I attempted to fetch the latest documentation from ftrack's official site, 
but it's currently unavailable. I'll use local examples instead.

[Proceed to load relevant local example file]

Note: For the most current documentation, visit:
https://developer.ftrack.com/api-clients/python/querying
```

### If Local Files Missing
```markdown
I don't have access to the comprehensive example files. 
Let me provide a solution based on the quick reference patterns...

[Use quick reference + known patterns]
```

---

## Testing Examples

### Should Use Quick Reference Only
Q: "How do I query tasks in ftrack?"
Q: "Show me a basic query with projection"
Q: "What's the syntax for filtering by project ID?"
Q: "How do I count results without fetching?"

### Should Trigger WebFetch
Q: "Show me all available query operators"
Q: "What are the advanced filtering options in ftrack?"
Q: "How does pagination work in detail?"
Q: "Official documentation for ftrack query language"

### Should Load Local Examples
Q: "Show me the performance_optimization.py file"
Q: "I need the complete Python query examples"
Q: WebFetch fails
Q: "Use local examples"
