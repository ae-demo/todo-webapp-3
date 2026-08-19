// Small, dependency-free date helpers shared by the task screens.

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysFromToday(isoDate: string): number {
  const date = new Date(isoDate + "T00:00:00");
  const diffMs = date.getTime() - startOfToday().getTime();
  return Math.round(diffMs / 86_400_000);
}

export function formatDueDate(dueDate?: string | null): string {
  if (!dueDate) return "—";
  const diffDays = daysFromToday(dueDate);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) {
    return new Date(dueDate + "T00:00:00").toLocaleDateString(undefined, {
      weekday: "short",
    });
  }
  return new Date(dueDate + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function isOverdue(dueDate?: string | null): boolean {
  if (!dueDate) return false;
  return daysFromToday(dueDate) < 0;
}

export function isDueThisWeek(dueDate?: string | null): boolean {
  if (!dueDate) return false;
  const diff = daysFromToday(dueDate);
  return diff >= 0 && diff < 7;
}

export function isDueThisMonth(dueDate?: string | null): boolean {
  if (!dueDate) return false;
  const diff = daysFromToday(dueDate);
  return diff >= 0 && diff < 31;
}

export function formatRelativeTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  const diffDays = Math.floor(
    (startOfToday().getTime() - new Date(date).setHours(0, 0, 0, 0)) /
      86_400_000,
  );
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

export function capitalize(value: string): string {
  return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}
