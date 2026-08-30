const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days between today and the given expiry date. Negative = past due. */
export function daysUntil(expiryDate) {
  if (!expiryDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return null;
  expiry.setHours(0, 0, 0, 0);

  return Math.round((expiry - today) / DAY_MS);
}

/** "fresh" | "soon" | "expired" | "unknown" */
export function getFreshnessStatus(expiryDate, soonThreshold = 5) {
  const days = daysUntil(expiryDate);
  if (days === null) return "unknown";
  if (days < 0) return "expired";
  if (days <= soonThreshold) return "soon";
  return "fresh";
}

export function formatDaysLabel(expiryDate) {
  const days = daysUntil(expiryDate);
  if (days === null) return "No date";
  if (days < 0) return `${Math.abs(days)}d over`;
  if (days === 0) return "Today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export function formatDate(expiryDate) {
  if (!expiryDate) return "\u2014";
  const d = new Date(expiryDate);
  if (Number.isNaN(d.getTime())) return "\u2014";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
