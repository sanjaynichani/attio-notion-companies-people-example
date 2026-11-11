import type { AttioRecord } from "./types.js";

/**
 * Checks the JSON shape the original worker required: an object with a `data` array.
 * The original error included the raw response body. This copy leaves the body
 * out of the error so a failed fixture cannot print record contents.
 */
export function readAttioRecords(body: unknown, objectSlug: string): AttioRecord[] {
  if (typeof body !== "object" || body === null || !("data" in body)) {
    throw new Error(`Unexpected Attio response for ${objectSlug}`);
  }

  const data = (body as { data?: unknown }).data;
  if (!Array.isArray(data)) {
    throw new Error(`Unexpected Attio response for ${objectSlug}`);
  }

  if (data.some((item) => typeof item !== "object" || item === null || Array.isArray(item))) {
    throw new Error(`Unexpected Attio response for ${objectSlug}`);
  }

  return data as AttioRecord[];
}

/**
 * The original error was `Attio API error ${status} on ${slug}: ${response text}`.
 * This copy keeps the status and object slug, and drops the response text.
 */
export function attioStatusError(status: number, objectSlug: string): Error {
  return new Error(`Attio API error ${status} on ${objectSlug}`);
}
