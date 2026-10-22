// ftrack dashboard widget (React 18): task status chart for the project in context.
// npm install @ftrack/api @ftrack/web-widget react react-dom recharts
// Serve over HTTPS, add the URL to System settings > Advanced > Custom widgets,
// and enable "Inject API credentials" on the widget.

import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { Session, operation, expression } from "@ftrack/api";
import { initialize, getCredentials, getEntity, getActiveTheme, openSidebar } from "@ftrack/web-widget";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const root = createRoot(document.getElementById("root"));

async function projectIdFor(session, entity) {
  if (!entity) return null;
  if (entity.type === "Project") return entity.id;
  const { data } = await session.query(
    expression`select project_id from TypedContext where id is "${entity.id}"`
  );
  return data[0]?.project_id ?? null;
}

async function statusCounts(session, projectId, signal) {
  const [counts, statuses] = await session.call(
    [
      operation.query(
        expression`select count(id), status_id from Task where project_id is "${projectId}" group by status_id`
      ),
      operation.query("select id, name, color, sort from Status"),
    ],
    { signal, additionalHeaders: { "ftrack-strict-api": "true" } }
  );
  const byId = Object.fromEntries(statuses.data.map((s) => [s.id, s]));
  return counts.data
    .map((row) => ({ ...byId[row.status_id], value: row.count_id }))
    .sort((a, b) => a.sort - b.sort);
}

function StatusWidget({ session, entity, theme }) {
  const [state, setState] = useState({ data: [], error: null, projectId: null });

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const projectId = await projectIdFor(session, entity);
      if (!projectId) return setState({ data: [], error: null, projectId: null });
      const data = await statusCounts(session, projectId, controller.signal);
      setState({ data, error: null, projectId });
    })().catch((error) => {
      if (error.name !== "AbortError") setState((s) => ({ ...s, error }));
    });
    return () => controller.abort();
  }, [session, entity?.id]);

  const fg = theme === "dark" ? "#ddd" : "#333";
  if (state.error) return <p style={{ color: fg }}>Error: {state.error.message}</p>;
  if (!state.projectId) return <p style={{ color: fg }}>Open this widget on a project.</p>;

  return (
    <div style={{ height: "100vh", color: fg }}>
      <button onClick={() => openSidebar("Project", state.projectId)}>Open project</button>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={state.data}>
          <XAxis dataKey="name" stroke={fg} />
          <YAxis allowDecimals={false} stroke={fg} />
          <Tooltip />
          <Bar dataKey="value">
            {state.data.map((s) => <Cell key={s.id} fill={s.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

let session;

window.addEventListener("DOMContentLoaded", () => {
  initialize({
    async onWidgetLoad() {
      const credentials = getCredentials();
      if (!credentials?.apiKey) {
        root.render(<p>Open this page as a widget inside ftrack.</p>);
        return;
      }
      session = new Session(credentials.serverUrl, credentials.apiUser, credentials.apiKey);
      await session.initializing;
      root.render(<StatusWidget session={session} entity={getEntity()} theme={getActiveTheme()} />);
    },
    onWidgetUpdate({ data }) {
      if (session) root.render(<StatusWidget session={session} entity={data.entity} theme={getActiveTheme()} />);
    },
  });
});
