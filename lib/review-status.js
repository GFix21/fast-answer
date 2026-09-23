/**
 * Review shows the bank as active. Rejected and approved stay as set.
 * A missing status, or the old pending mark, is active.
 */
export function reviewStatus(q, statuses = {}) {
  const set = statuses && q?.id ? statuses[q.id] : "";
  if (set) return set;
  if (q?.status === "rejected" || q?.status === "approved") return q.status;
  return "active";
}
