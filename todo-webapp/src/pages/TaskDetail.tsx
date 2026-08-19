import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ApiError,
  completeTask,
  deleteTask,
  getTask,
  reopenTask,
  updateTask,
  type Priority,
  type Task,
} from "../api";
import { capitalize, formatDueDate } from "../dateUtils";

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    setLoading(true);
    getTask(taskId)
      .then((loaded) => {
        if (cancelled) return;
        setTask(loaded);
        setTitle(loaded.title);
        setTagsInput((loaded.tags ?? []).join(", "));
        setDueDate(loaded.dueDate ?? "");
        setPriority(loaded.priority);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError ? err.message : "Failed to load task",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  if (!taskId) {
    return <p className="error-text">No task specified.</p>;
  }
  if (loading) {
    return <p>Loading…</p>;
  }
  if (loadError || !task) {
    return <p className="error-text">{loadError ?? "Task not found."}</p>;
  }

  async function handleSave() {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      setActionError("Title is required.");
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      await updateTask(taskId!, {
        title: trimmedTitle,
        priority,
        dueDate: dueDate.length > 0 ? dueDate : null,
        tags: parseTags(tagsInput),
      });
      navigate("/");
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to save changes",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    setBusy(true);
    setActionError(null);
    try {
      await deleteTask(taskId!);
      navigate("/");
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to delete task",
      );
      setBusy(false);
    }
  }

  async function handleComplete() {
    setBusy(true);
    setActionError(null);
    try {
      await completeTask(taskId!);
      navigate("/");
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to mark task complete",
      );
      setBusy(false);
    }
  }

  async function handleReopen() {
    setBusy(true);
    setActionError(null);
    try {
      await reopenTask(taskId!);
      navigate("/completed");
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to reopen task",
      );
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="breadcrumb">
        <Link to="/">Tasks</Link> / {task.title}
      </p>
      <div className="row">
        <h1>{task.title}</h1>
        <span className={`badge badge-inline ${task.priority === "high" ? "badge-danger" : ""}`}>
          {capitalize(task.priority)}
        </span>
        <span className="badge badge-inline badge-info">
          {capitalize(task.status)}
        </span>
      </div>
      <p className="meta-text">
        Tags: {task.tags && task.tags.length > 0 ? task.tags.join(", ") : "none"} · Due:{" "}
        {formatDueDate(task.dueDate)} · Created{" "}
        {new Date(task.createdAt).toLocaleDateString()}
      </p>

      <div className="form">
        <label>
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label>
          Tags
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </label>
        <div className="row">
          <label>
            Due date
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
          <label>
            Priority
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>

        {actionError && <p className="error-text">{actionError}</p>}

        <div className="row row-end">
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={busy}
          >
            Delete
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={busy}
          >
            Save changes
          </button>
        </div>
        <div className="row row-end">
          {task.status === "open" ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleComplete}
              disabled={busy}
            >
              Mark complete
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleReopen}
              disabled={busy}
            >
              Reopen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
