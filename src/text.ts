import type { AttioRecord } from "./types.js";

/**
 * New in this example. The original worker used `|| ""` and did not trim,
 * so a whitespace-only value was kept.
 */
export function clean(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

/**
 * New in this example. The original read `record_id` directly and would throw
 * a less specific error, sometimes including response text elsewhere.
 * This message does not include the record.
 */
export function requireRecordId(record: AttioRecord): string {
  const recordId = clean(record?.id?.record_id);
  if (!recordId) {
    throw new Error("Attio record is missing record_id");
  }
  return recordId;
}

/**
 * New in this example. The original copied index 0 and index 1 even when the
 * first address was blank. Blank entries are skipped. Addresses are still not
 * classified, so an automated mailbox is kept when it is non-blank.
 */
export function emailSlots(
  addresses: Array<{ email_address?: string }> | undefined,
): [string, string] {
  const usable = (addresses ?? [])
    .map((item) => clean(item?.email_address))
    .filter((address) => address.length > 0);
  return [usable[0] ?? "", usable[1] ?? ""];
}

/**
 * The original used `String(value ?? "")`, which turned an object into
 * "[object Object]". Numbers and booleans still stringify. Anything else is empty.
 */
export function connectionStrength(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "boolean") {
    return String(value);
  }
  return "";
}
