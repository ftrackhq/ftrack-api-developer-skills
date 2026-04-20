// Basic ftrack Dashboard Widget Template
// Demonstrates widget setup, session context, theme management, and entity selection

import { useEffect, useState } from 'react';
import { getActiveTheme } from '@ftrack/web-widget';
import useSession from './session_context';
import './App.css';

/**
 * Load theme-specific stylesheet dynamically
 */
function loadStyleSheet(theme) {
  const head = document.getElementsByTagName('head')[0];
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = import.meta.env.BASE_URL + 'style-' + theme + '.css';
  head.appendChild(link);
}

/**
 * Get default thumbnail URL
 */
function defaultThumbnail(session) {
  return `${session.serverUrl}/img/thumbnail2.png`;
}

/**
 * Check if widget is in overview context
 */
function isOverview() {
  const hash = new URLSearchParams(window.location.hash.substring(8));
  return hash.has('overview');
}

/**
 * Main Dashboard Component
 */
function Dashboard() {
  const isOverviewContext = isOverview();

  // Show warning if in overview context
  if (isOverviewContext) {
    return (
      <h1 className="warning">
        Please install this widget as project dashboard
      </h1>
    );
  }

  const session = useSession();
  const theme = getActiveTheme();

  // Load theme styles
  loadStyleSheet(theme);

  const [selection, setSelection] = useState({
    thumbnail_url: defaultThumbnail(session),
    id: '',
    __entity_type__: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState([]);

  /**
   * Handle entity selection changes from ftrack
   */
  function onFtrackWidgetUpdate(ftrackEvent) {
    const entityQuery = `select thumbnail_url, name, id
      from ${ftrackEvent.detail.entity.type}
      where id is "${ftrackEvent.detail.entity.id}"`;

    session.query(entityQuery).then((entity) => {
      const selectedEntity = entity.data[0];
      setSelection(selectedEntity);

      // Load data for selected entity
      loadEntityData(selectedEntity);
    });
  }

  /**
   * Load dashboard data for selected entity
   */
  async function loadEntityData(entity) {
    setIsLoading(true);
    try {
      // Example: Load tasks for selected project
      if (entity.__entity_type__ === 'Project') {
        const response = await session.query(
          `select name, status.name, status.color from Task
           where project.id is "${entity.id}"`
        );
        setData(response.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Register event listener
    window.addEventListener('ftrackWidgetUpdate', onFtrackWidgetUpdate);

    // Initial data load
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // Cleanup
    return () => {
      window.removeEventListener('ftrackWidgetUpdate', onFtrackWidgetUpdate);
    };
  }, [session]);

  return (
    <div className={`dashboard theme-${theme}`}>
      {isLoading ? (
        <div className="spinner">Loading...</div>
      ) : (
        <div className="dashboard-content">
          <h1>Dashboard</h1>

          {selection.name && (
            <div className="selection-info">
              <h2>Selected: {selection.name}</h2>
              <img src={selection.thumbnail_url} alt="thumbnail" />
            </div>
          )}

          <div className="data-section">
            <h3>Data ({data.length} items)</h3>
            <ul>
              {data.map(item => (
                <li key={item.id}>
                  <span style={{ color: item.status?.color }}>
                    {item.name} - {item.status?.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

// ============================================
// Session Context (session_context.jsx)
// ============================================

import { createContext, useContext } from 'react';

const SessionContext = createContext(null);

export const SessionProvider = SessionContext.Provider;

function useSession() {
  return useContext(SessionContext);
}

export default useSession;

// ============================================
// Main Entry Point (main.jsx)
// ============================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Session } from '@ftrack/api';
import { SessionProvider } from './session_context';
import Dashboard from './Dashboard';

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
    <Dashboard />
  </SessionProvider>
);
