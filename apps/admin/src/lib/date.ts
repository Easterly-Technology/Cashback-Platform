export function getDateOnly(date: Date) {
  return new Date(date.toISOString().split("T")[0]);
}

export function formatDateOnly(date: Date) {
  return date.toISOString().split("T")[0];
}

export function formatRelativeAge(date: Date) {
  const diffMs = Date.now() - date.getTime();

  if (diffMs < 60_000) return "just now";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo ago`;
  }

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}
