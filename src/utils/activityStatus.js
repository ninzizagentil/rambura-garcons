/**
 * ACTIVITY_STATUS — single source of truth for how a log/activity entry's
 * status is labelled and coloured. Used by both the full Activity & Audit
 * Log page and every "Recent Activity" card on the dashboards, so a
 * "success" or "error" event always looks the same everywhere it appears.
 */
export const ACTIVITY_STATUS = {
  success: { tone: 'green', label: 'Success' },
  warning: { tone: 'amber', label: 'Warning' },
  error: { tone: 'red', label: 'Error' },
  info: { tone: 'blue', label: 'Info' },
};

export function getActivityStatus(status) {
  return ACTIVITY_STATUS[status] || { tone: 'neutral', label: status || 'Unknown' };
}

/** Short, human "time ago" label (e.g. "5m ago", "3h ago", "2d ago"). Falls
 *  back to a short date once an event is more than a week old, so old log
 *  entries don't show an ever-growing "312d ago". */
export function timeAgo(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
