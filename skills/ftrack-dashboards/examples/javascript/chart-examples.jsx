// ftrack Dashboard Chart Examples
// Various chart types for data visualization

import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
  ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { Calendar, luxonLocalizer } from 'react-big-calendar';
import { DateTime } from 'luxon';
import useSession from './session_context';

const localizer = luxonLocalizer(DateTime);

// ============================================
// Pie Chart - Task Status Distribution
// ============================================

export function TaskStatusPieChart({ projectId }) {
  const session = useSession();
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadData() {
      const response = await session.query(
        `select status.name, status.color from Task
         where project.id is "${projectId}"`
      );

      // Aggregate by status
      const statusCounts = {};
      response.data.forEach(task => {
        const status = task.status.name;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      // Format for chart
      const chartData = Object.entries(statusCounts).map(([name, count]) => ({
        name,
        value: count,
        color: response.data.find(t => t.status.name === name)?.status.color || '#999'
      }));

      setData(chartData);
    }

    if (projectId) {
      loadData();
    }
  }, [projectId, session]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={120}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ============================================
// Bar Chart - Task Progress by Type
// ============================================

export function TaskProgressBarChart({ projectId }) {
  const session = useSession();
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadData() {
      const response = await session.query(
        `select type.name, status.state from Task
         where project.id is "${projectId}"`
      );

      // Aggregate by type and state
      const typeData = {};
      response.data.forEach(task => {
        const type = task.type.name;
        const state = task.status.state;

        if (!typeData[type]) {
          typeData[type] = { name: type, done: 0, inProgress: 0, notStarted: 0 };
        }

        if (state === 'DONE') {
          typeData[type].done += 1;
        } else if (state === 'IN_PROGRESS') {
          typeData[type].inProgress += 1;
        } else {
          typeData[type].notStarted += 1;
        }
      });

      setData(Object.values(typeData));
    }

    if (projectId) {
      loadData();
    }
  }, [projectId, session]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="done" fill="#82ca9d" name="Done" />
        <Bar dataKey="inProgress" fill="#8884d8" name="In Progress" />
        <Bar dataKey="notStarted" fill="#ffc658" name="Not Started" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================
// Line Chart - Task Completion Trend
// ============================================

export function TaskCompletionTrendChart({ projectId }) {
  const session = useSession();
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadData() {
      const response = await session.query(
        `select name, status.state, updated_at from Task
         where project.id is "${projectId}"
         order by updated_at desc`
      );

      // Group by month
      const monthlyData = {};
      response.data.forEach(task => {
        const month = DateTime.fromISO(task.updated_at).toFormat('yyyy-MM');

        if (!monthlyData[month]) {
          monthlyData[month] = { month, completed: 0, total: 0 };
        }

        monthlyData[month].total += 1;
        if (task.status.state === 'DONE') {
          monthlyData[month].completed += 1;
        }
      });

      // Calculate completion rate
      const chartData = Object.values(monthlyData).map(item => ({
        ...item,
        completionRate: ((item.completed / item.total) * 100).toFixed(1)
      }));

      setData(chartData.reverse());
    }

    if (projectId) {
      loadData();
    }
  }, [projectId, session]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="completionRate" stroke="#8884d8" name="Completion Rate %" />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ============================================
// Calendar - Milestone Widget
// ============================================

export function MilestoneCalendar({ projectId }) {
  const session = useSession();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function loadMilestones() {
      const response = await session.query(
        `select name, description, start_date, end_date, status.color, type.color
         from TypedContext
         where project.id is "${projectId}"
         and context_type is "milestone"
         order by start_date`
      );

      const calendarEvents = response.data.map(milestone => {
        const startDate = milestone.start_date || milestone.end_date;
        return {
          id: milestone.id,
          title: milestone.name,
          start: startDate ? startDate.toDate() : new Date(),
          end: milestone.end_date ? milestone.end_date.toDate() : new Date(),
          allDay: false,
          resource: {
            description: milestone.description,
            statusColor: milestone.status?.color || '#999',
            typeColor: milestone.type?.color || '#999'
          }
        };
      });

      setEvents(calendarEvents);
    }

    if (projectId) {
      loadMilestones();
    }
  }, [projectId, session]);

  return (
    <div style={{ height: 600 }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        eventPropGetter={event => ({
          style: {
            backgroundColor: event.resource.statusColor,
            borderColor: event.resource.typeColor,
            borderWidth: 2
          }
        })}
        components={{
          event: ({ event }) => (
            <div>
              <strong>{event.title}</strong>
              {event.resource.description && (
                <div style={{ fontSize: '0.8em' }}>
                  {event.resource.description}
                </div>
              )}
            </div>
          )
        }}
      />
    </div>
  );
}

// ============================================
// Combined Dashboard with Multiple Charts
// ============================================

export function MultiChartDashboard({ projectId }) {
  return (
    <div className="dashboard-grid">
      <div className="chart-container">
        <h2>Task Status Distribution</h2>
        <TaskStatusPieChart projectId={projectId} />
      </div>

      <div className="chart-container">
        <h2>Progress by Type</h2>
        <TaskProgressBarChart projectId={projectId} />
      </div>

      <div className="chart-container full-width">
        <h2>Completion Trend</h2>
        <TaskCompletionTrendChart projectId={projectId} />
      </div>

      <div className="chart-container full-width">
        <h2>Milestone Calendar</h2>
        <MilestoneCalendar projectId={projectId} />
      </div>
    </div>
  );
}

// ============================================
// CSS Example (for dashboard-grid)
// ============================================

/*
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.chart-container {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
}

.chart-container.full-width {
  grid-column: 1 / -1;
}
*/
