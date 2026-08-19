import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ApiError,
  listTags,
  listTasks,
  type Priority,
  type Tag,
  type Task,
} from "../api";
import { capitalize, formatDueDate, isDueThisWeek } from "../dateUtils";

type SortField = "dueDate" | "priority" | "createdAt";
type DueWindow = "any" | "week";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "dueDate", label: "Sort: Due date" },
  { value: "priority", label: "Sort: Priority" },
  { value: "createdAt", label: "Sort: Created" },
];

export function TaskList() {
  const navigate = useNavigate();

  const [tagFilter, setTagFilter] = useState<string | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<Priority | undefined>(
    undefined,
  );
  const [dueWindow, setDueWindow] = useState<DueWindow>("any");
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [searchQuery, setSearchQuery] = useState("");

  const [tags, setTags] = useState<Tag[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<{ total: number; high: number; dueWeek: number }>(
    { total: 0, high: 0, dueWeek: 0 },
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Aggregate badge counts — independent of the current tag/priority/search
  // filters, scoped only to "open". Bounded to the first page (max 100) the
  // contract allows; accurate for the scale of a personal task list.
  useEffect(() => {
    let cancelled = false;
    listTasks({ status: "open", limit: 100 })
      .then((result) => {
        if (cancelled) return;
        setStats({
          total: result.count,
          high: result.data.filter((t) => t.priority === "high").length,
          dueWeek: result.data.filter((t) => isDueThisWeek(t.dueDate)).length,
        });
      })
      .catch(() => {
        /* badge stats are a convenience — swallow, main list surfaces errors */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    listTags()
      .then((result) => {
        if (!cancelled) setTags(result.data);
      })
      .catch(() => {
        /* tag tabs are a convenience — swallow, main list surfaces errors */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listTasks({
      status: "open",
      tag: tagFilter,
      priority: priorityFilter,
      sort: sortField,
      limit: 100,
    })
      .then((result) => {
        if (!cancelled) setTasks(result.data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : "Failed to load tasks",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tagFilter, priorityFilter, sortField]);

  const visibleTasks = tasks
    .filter((task) =>
      searchQuery.trim().length === 0
        ? true
        : task.title.toLowerCase().includes(searchQuery.trim().toLowerCase()),
    )
    .filter((task) =>
      dueWindow === "week" ? isDueThisWeek(task.dueDate) : true,
    );

  return (
    <div>
      <div className="row row-between">
        <h1>My Tasks</h1>
        <div className="row-actions">
          <input
            type="search"
            placeholder="Search tasks…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/tasks/new")}
          >
            New task
          </button>
        </div>
      </div>

      <div className="row badges">
        <button
          type="button"
          className={`badge ${priorityFilter === undefined && dueWindow === "any" ? "badge-active" : ""}`}
          onClick={() => {
            setPriorityFilter(undefined);
            setDueWindow("any");
          }}
        >
          All ({stats.total})
        </button>
        <button
          type="button"
          className={`badge badge-danger ${priorityFilter === "high" ? "badge-active" : ""}`}
          onClick={() =>
            setPriorityFilter(priorityFilter === "high" ? undefined : "high")
          }
        >
          High priority ({stats.high})
        </button>
        <button
          type="button"
          className={`badge badge-warning ${dueWindow === "week" ? "badge-active" : ""}`}
          onClick={() => setDueWindow(dueWindow === "week" ? "any" : "week")}
        >
          Due this week ({stats.dueWeek})
        </button>
      </div>

      <div className="row tabs">
        <button
          type="button"
          className={`tab ${tagFilter === undefined ? "tab-active" : ""}`}
          onClick={() => setTagFilter(undefined)}
        >
          Open
        </button>
        {tags.map((tag) => (
          <button
            key={tag.name}
            type="button"
            className={`tab ${tagFilter === tag.name ? "tab-active" : ""}`}
            onClick={() => setTagFilter(tag.name)}
          >
            Tag: {tag.name}
          </button>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : visibleTasks.length === 0 ? (
        <p>No open tasks match your filters.</p>
      ) : (
        <table className="task-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Tags</th>
              <th>Due</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleTasks.map((task) => (
              <tr
                key={task.id}
                className="task-row"
                onClick={() => navigate(`/tasks/${task.id}`)}
              >
                <td>{task.title}</td>
                <td>{task.tags && task.tags.length > 0 ? task.tags.join(", ") : "—"}</td>
                <td>{formatDueDate(task.dueDate)}</td>
                <td>{capitalize(task.priority)}</td>
                <td>{capitalize(task.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
