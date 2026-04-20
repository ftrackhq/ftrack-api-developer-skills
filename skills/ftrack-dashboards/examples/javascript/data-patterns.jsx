// ftrack Dashboard Data Patterns
// Query patterns, data aggregation, and transformation for dashboards

import { useState, useEffect } from 'react';
import { operation } from '@ftrack/api';
import useSession from './session_context';

// ============================================
// Data Aggregation Patterns
// ============================================

/**
 * Aggregate tasks by status
 */
export async function aggregateTasksByStatus(session, projectId) {
  const response = await session.query(
    `select status.name, status.color from Task
     where project.id is "${projectId}"`
  );

  const statusCounts = {};
  response.data.forEach(task => {
    const status = task.status.name;
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  return Object.entries(statusCounts).map(([name, count]) => ({
    name,
    value: count,
    color: response.data.find(t => t.status.name === name)?.status.color || '#999'
  }));
}

/**
 * Aggregate tasks by assigned user
 */
export async function aggregateTasksByUser(session, projectId) {
  const response = await session.query(
    `select assignments from Task
     where project.id is "${projectId}"`
  );

  const userCounts = {};
  response.data.forEach(task => {
    task.assignments?.forEach(assignment => {
      const userId = assignment.resource_id;
      userCounts[userId] = (userCounts[userId] || 0) + 1;
    });
  });

  return userCounts;
}

/**
 * Calculate completion percentage
 */
export async function calculateCompletionPercentage(session, projectId) {
  const response = await session.query(
    `select status.state from Task
     where project.id is "${projectId}"`
  );

  const total = response.data.length;
  const done = response.data.filter(t => t.status.state === 'DONE').length;

  return {
    total,
    done,
    percentage: total > 0 ? ((done / total) * 100).toFixed(1) : 0
  };
}

// ============================================
// Batch Operations for Performance
// ============================================

/**
 * Load multiple data sets in parallel
 */
export async function loadDashboardData(session, projectId) {
  const results = await session.call([
    operation.query(`select name from Status order by name`),
    operation.query(`select name from User where is_active is true`),
    operation.query(`select name, status.name from Task where project.id is "${projectId}"`),
    operation.query(`select name, start_date, end_date from Milestone where project.id is "${projectId}"`),
  ]);

  return {
    statuses: results[0].data,
    users: results[1].data,
    tasks: results[2].data,
    milestones: results[3].data
  };
}

// ============================================
// Custom Hooks for Data Loading
// ============================================

/**
 * Hook for loading and aggregating task data
 */
export function useTaskData(projectId) {
  const session = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      if (!projectId) return;

      setLoading(true);
      try {
        const [statusData, completion] = await Promise.all([
          aggregateTasksByStatus(session, projectId),
          calculateCompletionPercentage(session, projectId)
        ]);

        setData({ statusData, completion });
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [projectId, session]);

  return { data, loading, error };
}

/**
 * Hook for loading dashboard data with caching
 */
export function useCachedDashboardData(projectId, cacheKey = 'dashboardData') {
  const session = useSession();
  const [data, setData] = useState(() => {
    // Try to load from localStorage
    const cached = localStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    async function load() {
      if (!projectId) return;

      setLoading(true);
      try {
        const dashboardData = await loadDashboardData(session, projectId);
        setData(dashboardData);

        // Cache in localStorage
        localStorage.setItem(cacheKey, JSON.stringify(dashboardData));
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [projectId, session, cacheKey]);

  return { data, loading, refresh: () => load() };
}

// ============================================
// Real-time Updates with Events
// ============================================

/**
 * Hook for real-time dashboard updates
 */
export function useRealtimeDashboard(projectId) {
  const session = useSession();
  const [data, setData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Load initial data
  useEffect(() => {
    async function load() {
      if (!projectId) return;

      const dashboardData = await loadDashboardData(session, projectId);
      setData(dashboardData);
    }

    load();
  }, [projectId, session]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!projectId) return;

    // Debounced refresh function
    let refreshTimeout;
    const debouncedRefresh = () => {
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(async () => {
        const dashboardData = await loadDashboardData(session, projectId);
        setData(dashboardData);
        setLastUpdate(Date.now());
      }, 1000); // Debounce 1 second
    };

    // Subscribe to task updates
    const subscription = session.eventHub.subscribe(
      'topic=ftrack.update and data.entityType is "Task"',
      (event) => {
        // Check if update is for our project
        const entities = event.data.entities || [];
        const relevantUpdate = entities.some(e => e.projectId === projectId);

        if (relevantUpdate) {
          debouncedRefresh();
        }
      }
    );

    return () => {
      clearTimeout(refreshTimeout);
      subscription.unsubscribe();
    };
  }, [projectId, session]);

  return { data, lastUpdate };
}

// ============================================
// Data Transformation Utilities
// ============================================

/**
 * Transform ftrack date to chart format
 */
export function formatDateForChart(ftrackDate) {
  if (!ftrackDate) return null;
  return ftrackDate.toDate ? ftrackDate.toDate() : new Date(ftrackDate);
}

/**
 * Group data by time period
 */
export function groupByTimePeriod(data, dateField, period = 'month') {
  const grouped = {};

  data.forEach(item => {
    const date = formatDateForChart(item[dateField]);
    if (!date) return;

    let key;
    if (period === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else if (period === 'week') {
      // Get week number
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      key = `${date.getFullYear()}-W${weekNum}`;
    } else {
      key = date.toISOString().split('T')[0]; // Daily
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });

  return grouped;
}

/**
 * Calculate percentage distribution
 */
export function calculatePercentages(data, totalKey = 'value') {
  const total = data.reduce((sum, item) => sum + item[totalKey], 0);

  return data.map(item => ({
    ...item,
    percentage: total > 0 ? ((item[totalKey] / total) * 100).toFixed(1) : 0
  }));
}

// ============================================
// Filter and Search Patterns
// ============================================

/**
 * Hook for filtered dashboard data
 */
export function useFilteredDashboard(projectId, filters = {}) {
  const session = useSession();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!projectId) return;

      setLoading(true);
      try {
        // Build query with filters
        let query = `select name, status.name, type.name, assignments from Task where project.id is "${projectId}"`;

        if (filters.statusIds?.length > 0) {
          const statusFilter = filters.statusIds.map(id => `"${id}"`).join(',');
          query += ` and status.id in (${statusFilter})`;
        }

        if (filters.typeIds?.length > 0) {
          const typeFilter = filters.typeIds.map(id => `"${id}"`).join(',');
          query += ` and type.id in (${typeFilter})`;
        }

        if (filters.search) {
          query += ` and name like "%${filters.search}%"`;
        }

        const response = await session.query(query);
        setData(response.data);
      } catch (error) {
        console.error('Failed to load filtered data:', error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [projectId, filters, session]);

  return { data, loading };
}

// ============================================
// Local Storage for Dashboard Settings
// ============================================

/**
 * Hook for persisting dashboard settings
 */
export function useDashboardSettings(settingsKey = 'dashboardSettings') {
  const [settings, setSettings] = useState(() => {
    const stored = localStorage.getItem(settingsKey);
    return stored ? JSON.parse(stored) : {
      selectedProjects: [],
      selectedStatuses: [],
      chartType: 'bar',
      refreshInterval: 30000 // 30 seconds
    };
  });

  useEffect(() => {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
  }, [settings, settingsKey]);

  return [settings, setSettings];
}

// ============================================
// Export Helpers
// ============================================

/**
 * Prepare data for CSV export
 */
export function prepareCSVData(data, fields) {
  const headers = fields.map(f => f.label).join(',');
  const rows = data.map(item =>
    fields.map(f => {
      const value = f.accessor(item);
      return typeof value === 'string' && value.includes(',')
        ? `"${value}"`
        : value;
    }).join(',')
  );

  return [headers, ...rows].join('\n');
}

/**
 * Download data as CSV
 */
export function downloadCSV(data, filename = 'dashboard-data.csv') {
  const blob = new Blob([data], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
