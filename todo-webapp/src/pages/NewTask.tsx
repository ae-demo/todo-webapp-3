import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, createTask, type Priority } from "../api";

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export function NewTask() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      setError("Title is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createTask({
        title: trimmedTitle,
        priority,
        dueDate: dueDate.length > 0 ? dueDate : null,
        tags: parseTags(tagsInput),
      });
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <p className="breadcrumb">
        <Link to="/">Tasks</Link> / New task
      </p>
      <h1>New Task</h1>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Title
          <input
            type="text"
            placeholder="e.g. Finish quarterly report"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label>
          Tags
          <input
            type="text"
            placeholder="comma separated, e.g. Work, Urgent"
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
        {error && <p className="error-text">{error}</p>}
        <div className="row row-end">
          <button
            type="button"
            className="btn"
            onClick={() => navigate("/")}
            disabled={submitting}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            Create task
          </button>
        </div>
      </form>
    </div>
  );
}
