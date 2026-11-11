import type { AttioRecord, UpsertChange } from "./types.js";

/** Page size used by the original worker when it queried Attio. */
export const DEFAULT_PAGE_LIMIT = 500;

export interface PageState {
  offset?: number;
}

export interface SyncPage {
  changes: UpsertChange[];
  hasMore: boolean;
  /** How many earlier changes were replaced because the record id repeated. New in this example. */
  collapsed: number;
  nextState?: { offset: number };
}

/**
 * New in this example. The original emitted every record, including two
 * upserts with the same key. An upsert can only keep one row per key, so the
 * last change for each id is the one that remains.
 */
export function collapseChanges(changes: readonly UpsertChange[]): {
  changes: UpsertChange[];
  collapsed: number;
} {
  const byKey = new Map<string, UpsertChange>();
  let collapsed = 0;
  for (const change of changes) {
    if (byKey.has(change.key)) {
      collapsed += 1;
    }
    byKey.set(change.key, change);
  }
  return { changes: [...byKey.values()], collapsed };
}

/**
 * The original worker asked Attio for one page, mapped every record on that
 * page, and returned `hasMore` so the Worker runtime would call it again.
 * `hasMore` is true only when the page is full. A short page is the last page.
 * This function does not request the page. The caller supplies the records.
 */
export function mapRecordPage(
  records: readonly AttioRecord[],
  mapRecord: (record: AttioRecord) => UpsertChange,
  state?: PageState,
  limit = DEFAULT_PAGE_LIMIT,
): SyncPage {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("Page limit must be a positive integer");
  }

  const rawOffset = state?.offset ?? 0;
  if (typeof rawOffset !== "number" || !Number.isInteger(rawOffset) || rawOffset < 0) {
    throw new Error("Page offset must be a non-negative integer");
  }

  const hasMore = records.length === limit;
  const collapsed = collapseChanges(records.map((record) => mapRecord(record)));

  return {
    changes: collapsed.changes,
    hasMore,
    collapsed: collapsed.collapsed,
    nextState: hasMore ? { offset: rawOffset + limit } : undefined,
  };
}
