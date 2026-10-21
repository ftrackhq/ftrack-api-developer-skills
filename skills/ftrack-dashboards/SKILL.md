---
name: ftrack-dashboards
description: ftrack dashboard development - React widgets, data visualization, charts, PDF export
---

TRIGGER when: code imports `@ftrack/web-widget`, `react-big-calendar`, `recharts`, chart libraries; file contains dashboard components, widget setup, data visualization; user asks about ftrack dashboards, widgets, charts, data visualization, PDF export, or custom dashboard development.
SKIP: Python dashboards, backend data processing, non-ftrack visualization.

# ftrack Dashboard Development Expert

**Strategy**: Quick reference first → Fetch online docs if needed → Load local examples as fallback

**Note**: Dashboards are JavaScript/TypeScript only, served as static files from ftrack endpoints.

## Prerequisites
```bash
npm install @ftrack/api @ftrack/web-widget
npm install react react-dom
npm install recharts  # or chart.js, d3, etc.
```

---

## Quick Reference (Use First - 70% of Queries)

### Core Principles
✓ **Use @ftrack/web-widget**: Widget lifecycle and theme management
✓ **Session context**: Wrap app in SessionProvider for ftrack API access
✓ **Listen to ftrackWidgetUpdate**: React to entity selection changes
✓ **Theme support**: Load dark/light themes dynamically
✓ **Optimize queries**: Use projections and filters for dashboard performance
✗ Avoid loading entire entity data (use projections)
✗ Never block UI with heavy queries (use loading states)
✗ Don't forget to handle overview vs project context

### Basic Widget Setup

**App Structure**
```jsx
import { useEffect, useState } from 'react';
import { getActiveTheme } from '@ftrack/web-widget';
import useSession from './session_context';

function App() {
  const session = useSession();
  const theme = getActiveTheme();
  const [selection, setSelection] = useState(null);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for entity selection changes
  function onFtrackWidgetUpdate(event) {
    const { entity } = event.detail;
    
    // Query entity with needed fields
    session.query(
      `select name, status.name from ${entity.type} where id is "${entity.id}"`
    ).then(result => {
      setSelection(result.data[0]);
    });
  }

  useEffect(() => {
    window.addEventListener('ftrackWidgetUpdate', onFtrackWidgetUpdate);
    
    // Initial data load
    loadDashboardData();
    
    return () => {
      window.removeEventListener('ftrackWidgetUpdate', onFtrackWidgetUpdate);
    };
  }, []);

  async function loadDashboardData() {
    setIsLoading(true);
    try {
      const response = await session.query(
        'select name, status.name from Task where project.id is "{project_id}"'
      );
      setData(response.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <div className="spinner">Loading...</div>;
  }

  return (
    <div className={`dashboard theme-${theme}`}>
      <h1>Dashboard</h1>
      {/* Your visualization components */}
    </div>
  );
}

export default App;
```

**Session Context** (session_context.jsx)
```jsx
import { createContext, useContext } from 'react';

const SessionContext = createContext(null);

export const SessionProvider = SessionContext.Provider;

function useSession() {
  return useContext(SessionContext);
}

export default useSession;
```

**Main Entry** (main.jsx)
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Session } from '@ftrack/api';
import { SessionProvider } from './session_context';
import App from './App';

// Extract session credentials from URL hash
const hash = new URLSearchParams(window.location.hash.substring(1));
const session = new Session(
  hash.get('server'),
  hash.get('user'),
  hash.get('key')
);

await session.initializing;

ReactDOM.createRoot(document.getElementById('root')).render(
  <SessionProvider value={session}>
    <App />
  </SessionProvider>
);
```

### Theme Management

```jsx
import { getActiveTheme } from '@ftrack/web-widget';

function loadThemeStyles(theme) {
  const head = document.getElementsByTagName('head')[0];
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = `${import.meta.env.BASE_URL}style-${theme}.css`;
  head.appendChild(link);
}

function App() {
  const theme = getActiveTheme(); // 'dark' or 'light'
  
  useEffect(() => {
    loadThemeStyles(theme);
  }, [theme]);
  
  return <div className={`dashboard theme-${theme}`}>...</div>;
}
```

### Data Aggregation for Charts

```jsx
async function aggregateTasksByStatus(session, projectId) {
  const response = await session.query(
    `select status.name, status.color from Task where project.id is "${projectId}"`
  );
  
  // Aggregate by status
  const statusCounts = {};
  response.data.forEach(task => {
    const status = task.status.name;
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  // Format for chart library
  return Object.entries(statusCounts).map(([name, count]) => ({
    name,
    value: count,
    color: response.data.find(t => t.status.name === name)?.status.color
  }));
}
```

### Chart Visualization (Recharts)

```jsx
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

function TaskStatusChart({ data }) {
  return (
    <PieChart width={400} height={400}>
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={120}
        label
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  );
}
```

```jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function TaskProgressChart({ data }) {
  return (
    <BarChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="completed" fill="#82ca9d" />
      <Bar dataKey="inProgress" fill="#8884d8" />
      <Bar dataKey="notStarted" fill="#ffc658" />
    </BarChart>
  );
}
```

### Calendar Widget Pattern

```jsx
import { Calendar } from 'react-big-calendar';
import { luxonLocalizer } from 'react-big-calendar';
import { DateTime } from 'luxon';

const localizer = luxonLocalizer(DateTime);

function MilestoneCalendar() {
  const session = useSession();
  const [events, setEvents] = useState([]);

  async function loadMilestones() {
    const response = await session.query(`
      select name, start_date, end_date, status.color 
      from Milestone 
      where project.id is "{project_id}"
    `);
    
    const calendarEvents = response.data.map(milestone => ({
      title: milestone.name,
      start: new Date(milestone.start_date),
      end: new Date(milestone.end_date),
      resource: { color: milestone.status.color }
    }));
    
    setEvents(calendarEvents);
  }

  useEffect(() => {
    loadMilestones();
  }, []);

  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: 600 }}
      eventPropGetter={event => ({
        style: { backgroundColor: event.resource.color }
      })}
    />
  );
}
```

### PDF Export

```jsx
import { usePDF, Resolution, Margin } from 'react-to-pdf';

function DashboardWithExport() {
  const { toPDF, targetRef } = usePDF({
    filename: 'dashboard.pdf',
    resolution: Resolution.HIGH,
    page: { margin: Margin.SMALL, orientation: 'landscape' },
    canvas: { qualityRatio: 1 }
  });

  return (
    <div>
      <button onClick={() => toPDF()}>Export to PDF</button>
      <div ref={targetRef}>
        {/* Dashboard content to export */}
        <TaskStatusChart data={chartData} />
        <TaskProgressChart data={progressData} />
      </div>
    </div>
  );
}
```

### Batch Operations for Performance

```jsx
import { operation } from '@ftrack/api';

async function loadMultipleDataSets(session) {
  // Load multiple queries in parallel
  const results = await session.call([
    operation.query('select name from Status'),
    operation.query('select name from Project where status is "Active"'),
    operation.query('select name from User'),
  ]);
  
  return {
    statuses: results[0].data,
    projects: results[1].data,
    users: results[2].data
  };
}
```

### Context Detection

```jsx
function isOverviewContext() {
  const hash = new URLSearchParams(window.location.hash.substring(8));
  return hash.has('overview');
}

function App() {
  const isOverview = isOverviewContext();
  
  if (isOverview) {
    return (
      <div className="warning">
        Please install this widget as project dashboard
      </div>
    );
  }
  
  // Project context
  return <ProjectDashboard />;
}
```

### Local Storage for Settings

```jsx
function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

// Usage
function Dashboard() {
  const [selectedProjects, setSelectedProjects] = useLocalStorage('projects', []);
  const [chartType, setChartType] = useLocalStorage('chartType', 'bar');
  
  return <div>...</div>;
}
```

**→ This quick reference handles most dashboard patterns. For advanced visualizations or widget deployment, continue below.**

---

## Online Resources (Fetch for Detailed Info)

### When to Fetch
- User asks for "complete widget API" or "@ftrack/web-widget documentation"
- Needs advanced chart library integration
- Questions about widget deployment or build configuration
- Performance optimization for large datasets

### ftrack Web Widget Documentation
**URL**: `https://developer.ftrack.com/extending-ftrack/widgets`
**Fetch Prompt**:
```
Extract ftrack web widget development patterns. Include:
- Widget lifecycle and initialization
- Theme management (dark/light)
- Event handling (ftrackWidgetUpdate)
- Session integration
- Deployment and build process
- Best practices
Format as markdown with React examples.
```

### React Big Calendar Documentation
**URL**: `https://github.com/jquense/react-big-calendar`
**Fetch Prompt**:
```
Extract React Big Calendar usage patterns for ftrack dashboards. Include:
- Calendar setup and localization
- Event data structure
- Drag and drop functionality
- Custom event rendering
- Date navigation
Format as markdown.
```

### Recharts Documentation
**URL**: `https://recharts.org/en-US/api`
**Fetch Prompt**:
```
Extract Recharts usage for dashboard visualization. Include:
- Pie, Bar, Line chart examples
- Responsive containers
- Custom tooltips and legends
- Color customization
- Data formatting
Format as markdown with examples.
```

### WebFetch Decision Tree

**IMPORTANT**: Actively check user query for trigger phrases, then use WebFetch.

**Trigger detection**:
```python
trigger_phrases = [
    "complete widget api",
    "official widget docs",
    "@ftrack/web-widget documentation",
    "advanced chart integration",
    "widget deployment",
    "build configuration",
    "performance optimization dashboard"
]
```

**Action when trigger detected:**
1. **Detect topic**: Widget API, charts, or deployment
2. **Use WebFetch** with appropriate URL above
3. **If fetch succeeds**: Return formatted docs
4. **If fetch fails**: Use quick reference + guidance

**WebFetch Example:**
```markdown
# User asks: "Show me complete @ftrack/web-widget API"
# Trigger detected: "complete widget api"

Use WebFetch tool:
WebFetch(
  url="https://developer.ftrack.com/extending-ftrack/widgets",
  prompt="Extract complete ftrack web widget API reference. Include lifecycle hooks, theme management, event handling, session integration, and deployment. Format as markdown."
)

If successful: Present docs
If fails: Use quick reference examples
```

---

## Local Examples (Load Only When Needed)

### When to Load Local
1. WebFetch fails or times out
2. User explicitly requests "show me dashboard examples"
3. Need complete runnable dashboard implementations
4. Advanced patterns like multi-chart dashboards, real-time updates

### Available Local Files

**Dashboard Template Example**:
- **File**: `examples/javascript/dashboard-template.jsx`
- **Contains**: Complete widget setup with session context, theme management, ftrackWidgetUpdate handling, loading states, context detection (overview vs project)
- **Load when**: User needs basic dashboard structure or complete widget boilerplate
- **Size**: ~150 lines

**Chart Examples**:
- **File**: `examples/javascript/chart-examples.jsx`
- **Contains**: Pie chart (status distribution), bar chart (progress by type), line chart (completion trend), calendar widget (milestones), multi-chart dashboard layout
- **Load when**: User needs visualization examples with Recharts or React Big Calendar
- **Size**: ~300 lines

**Data Patterns**:
- **File**: `examples/javascript/data-patterns.jsx`
- **Contains**: Data aggregation functions, batch operations, custom hooks (useTaskData, useCachedDashboardData, useRealtimeDashboard), filtering patterns, localStorage persistence, CSV export helpers
- **Load when**: User needs data processing, real-time updates, or performance optimization patterns
- **Size**: ~350 lines

### How to Load
Paths are relative to this skill's directory (the folder containing this SKILL.md). Read only the file you need, then extract the sections relevant to the user's question.

---

## Decision Tree

```
User asks about ftrack dashboards
  │
  ├─ Basic widget setup?
  │   └→ Use Quick Reference (widget structure) ✓
  │
  ├─ Theme management?
  │   └→ Use Quick Reference (theme loading) ✓
  │
  ├─ Chart visualization?
  │   └→ Use Quick Reference (recharts examples) ✓
  │
  ├─ Calendar widget?
  │   └→ Use Quick Reference (calendar pattern) ✓
  │
  ├─ PDF export?
  │   └→ Use Quick Reference (PDF export) ✓
  │
  ├─ Complete widget API or deployment?
  │   ├→ WebFetch widget documentation
  │   └→ If fails: Use quick reference + guidance
  │
  ├─ Advanced charts or performance?
  │   ├→ WebFetch chart library docs
  │   └→ If fails: Load local examples
  │
  └─ Complete dashboard examples?
      └→ Load local example files
```

---

## Response Strategy

### For Simple Questions
1. Answer using Quick Reference patterns
2. Show appropriate pattern (widget, chart, theme)
3. Keep concise (1 example)
4. Cite: "From dashboard quick reference"

### For Detailed Questions
1. Start with Quick Reference context
2. If trigger detected: WebFetch widget/chart documentation
3. Provide specific examples
4. Cite: "From [URL]"
5. If fetch fails: Use quick reference + additional guidance

### For Advanced Questions (Deployment, Performance)
1. Check if Quick Reference covers it
2. If not: WebFetch widget docs
3. If insufficient or fails: Load local example files
4. Provide production-ready code

### Progressive Disclosure
- Start minimal (quick reference - basic widget setup)
- Offer more: "Need deployment guide or advanced charts? I can fetch official docs"
- Load comprehensive examples only if requested or if WebFetch fails

---

## Common Patterns

### Real-time Updates with Events

```jsx
function LiveDashboard() {
  const session = useSession();
  const [data, setData] = useState([]);

  useEffect(() => {
    // Subscribe to entity updates
    const subscription = session.eventHub.subscribe(
      'topic=ftrack.update and data.entityType is "Task"',
      (event) => {
        // Refresh dashboard data
        loadDashboardData();
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return <div>Live updating dashboard</div>;
}
```

### Filtered Data with Dropdowns

```jsx
function FilteredDashboard() {
  const session = useSession();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [data, setData] = useState([]);

  async function loadProjects() {
    const response = await session.query(
      'select name from Project where status is "Active"'
    );
    setProjects(response.data);
  }

  async function loadProjectData(projectId) {
    const response = await session.query(
      `select name, status.name from Task where project.id is "${projectId}"`
    );
    setData(response.data);
  }

  return (
    <div>
      <select onChange={e => {
        setSelectedProject(e.target.value);
        loadProjectData(e.target.value);
      }}>
        {projects.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      
      <TaskStatusChart data={data} />
    </div>
  );
}
```

### Responsive Layout

```jsx
import { ResponsiveContainer, BarChart } from 'recharts';

function ResponsiveDashboard() {
  return (
    <div className="dashboard-grid">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          {/* Chart components */}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* CSS */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1rem;
  padding: 1rem;
}
```

---

## Build Configuration

**Vite Config** (vite.config.js)
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['recharts'],
        }
      }
    }
  }
});
```

**Package.json scripts**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@ftrack/api": "^latest",
    "@ftrack/web-widget": "^latest",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "recharts": "^2.0.0",
    "react-big-calendar": "^1.0.0",
    "luxon": "^3.0.0"
  }
}
```

---

## Performance Tips

1. **Use projections**: Only query fields you need
2. **Batch queries**: Use `session.call([...operations])`
3. **Debounce updates**: Don't refresh on every event
4. **Lazy load charts**: Load visualizations only when visible
5. **Cache data**: Use local storage for frequently accessed data
6. **Optimize renders**: Use React.memo for expensive components
