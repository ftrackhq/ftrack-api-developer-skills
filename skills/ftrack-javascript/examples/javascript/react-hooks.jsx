// React patterns for @ftrack/api.
// The session is created once and shared through context. In an ftrack
// dashboard widget, take the credentials from the widget (see ftrack-dashboards);
// never hard-code an API key in browser code.

import { createContext, useContext, useEffect, useState } from "react";
import { Session, expression, error } from "@ftrack/api";

const SessionContext = createContext(null);

export function FtrackSessionProvider({ serverUrl, apiUser, apiKey, children }) {
  const [state, setState] = useState({ session: null, error: null });

  useEffect(() => {
    const session = new Session(serverUrl, apiUser, apiKey);
    let active = true;
    session.initializing.then(
      () => active && setState({ session, error: null }),
      (e) => active && setState({ session: null, error: e })
    );
    // The client has no close(); just stop using this instance.
    return () => {
      active = false;
    };
  }, [serverUrl, apiUser, apiKey]);

  if (state.error) return <p>Could not connect to ftrack: {state.error.message}</p>;
  if (!state.session) return <p>Connecting...</p>;
  return <SessionContext.Provider value={state.session}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside FtrackSessionProvider");
  return session;
}

// Runs a query and cancels it when inputs change or the component unmounts.
export function useFtrackQuery(queryExpression) {
  const session = useSession();
  const [state, setState] = useState({ data: [], loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    session
      .query(queryExpression, { signal: controller.signal, decodeDatesAsIso: true })
      .then(({ data }) => setState({ data, loading: false, error: null }))
      .catch((e) => {
        if (e instanceof error.AbortError) return;
        setState({ data: [], loading: false, error: e });
      });
    return () => controller.abort();
  }, [session, queryExpression]);

  return state;
}

export function TaskList({ projectId }) {
  const { data, loading, error: queryError } = useFtrackQuery(
    expression`select name, status.name, end_date from Task where project_id is "${projectId}" order by name`
  );
  if (loading) return <p>Loading...</p>;
  if (queryError) return <p>Error: {queryError.message}</p>;
  return (
    <ul>
      {data.map((task) => (
        <li key={task.id}>
          {task.name} - {task.status?.name} {task.end_date && `(due ${task.end_date.slice(0, 10)})`}
        </li>
      ))}
    </ul>
  );
}

export function UploadButton({ versionId, onUploaded }) {
  const session = useSession();
  const [progress, setProgress] = useState(null);

  async function handleChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    setProgress(0);
    try {
      const [{ data: component }] = await session.createComponent(file, {
        data: { version_id: versionId },
        onProgress: setProgress,
      });
      onUploaded?.(component);
    } finally {
      setProgress(null);
    }
  }

  return (
    <label>
      <input type="file" onChange={handleChange} disabled={progress !== null} />
      {progress !== null && <span> {Math.round(progress)}%</span>}
    </label>
  );
}
