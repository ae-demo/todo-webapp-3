import { useEffect, useState } from "react";
import { ApiError, listTasks, reopenTask, type Task } from "../api";
import { capitalize, formatRelativeTime } from "../dateUtils";

export function CompletedTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reopening, setReopening] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listTasks({ status: "completed", sort: "createdAt", limit: 100 })
      .then((result) => {
        if (!cancelled) setTasks(result.data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : "Failed to load completed tasks",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleReopenSelected() {
    if (selected.size === 0) return;
    setReopening(true);
    setError(null);
    try {
      await Promise.all(Array.from(selected).map((id) => reopenTask(id)));
      setSelected(new Set());
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reopen tasks");
    } finally {
      setReopening(false);
    }
  }

  return (
    <div>
      <h1>Completed Tasks</h1>
      <p className="meta-text">
        Tasks you've finished — reopen one if it needs more work.
      </p>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : tasks.length === 0 ? (
        <p>No completed tasks yet.</p>
      ) : (
        <>
          <table className="task-table">
            <thead>
              <tr>
                <th />
                <th>Title</th>
                <th>Tags</th>
                <th>Completed</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(task.id)}
                      onChange={() => toggleSelected(task.id)}
                    />
                  </td>
                  <td>{task.title}</td>
                  <td>{task.tags && task.tags.length > 0 ? task.tags.join(", ") : "—"}</td>
                  <td>{formatRelativeTime(task.updatedAt)}</td>
                  <td>{capitalize(task.priority)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="row row-end">
            <button
              type="button"
              className="btn"
              onClick={handleReopenSelected}
              disabled={selected.size === 0 || reopening}
            >
              Reopen selected
            </button>
          </div>
        </>
      )}
    </div>
  );
}
