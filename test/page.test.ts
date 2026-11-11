import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapCompany } from "../src/map-company.js";
import { DEFAULT_PAGE_LIMIT, mapRecordPage } from "../src/page.js";
import { attioStatusError, readAttioRecords } from "../src/read-response.js";
import type { AttioRecord } from "../src/types.js";

function company(recordId: string, name: string): AttioRecord {
  return {
    id: { record_id: recordId },
    values: { name: [{ value: name }] },
  };
}

describe("mapRecordPage", () => {
  it("uses a 500-record page and continues only when that page is full", () => {
    assert.equal(DEFAULT_PAGE_LIMIT, 500);

    const full = Array.from({ length: 500 }, (_, index) => company(`rec_${index}`, `Company ${index}`));
    const first = mapRecordPage(full, mapCompany);

    assert.equal(first.changes.length, 500);
    assert.equal(first.hasMore, true);
    assert.deepEqual(first.nextState, { offset: 500 });
    assert.equal(first.changes[0]?.key, "rec_0");
    assert.equal(first.changes[499]?.properties.Name, "Company 499");

    const last = mapRecordPage([company("rec_500", "Last Company")], mapCompany, first.nextState);
    assert.equal(last.hasMore, false);
    assert.equal(last.nextState, undefined);
    assert.equal(last.changes[0]?.key, "rec_500");
  });

  it("advances the offset from the previous state when a test uses a smaller page", () => {
    const first = mapRecordPage(
      [company("rec_a", "Northwind Analytics"), company("rec_b", "Harbor & Co")],
      mapCompany,
      undefined,
      2,
    );
    const second = mapRecordPage(
      [company("rec_c", "Lumen Field Notes")],
      mapCompany,
      first.nextState,
      2,
    );

    assert.deepEqual(first.nextState, { offset: 2 });
    assert.equal(second.hasMore, false);
    assert.equal(second.collapsed, 0);
    assert.deepEqual(
      second.changes.map((change) => change.properties.Name),
      ["Lumen Field Notes"],
    );
  });

  it("keeps the last change when one page repeats a record id", () => {
    const page = mapRecordPage(
      [company("rec_a", "Northwind"), company("rec_a", "Northwind Analytics")],
      mapCompany,
      undefined,
      2,
    );

    assert.equal(page.collapsed, 1);
    assert.equal(page.changes.length, 1);
    assert.equal(page.changes[0]?.properties.Name, "Northwind Analytics");
  });

  it("rejects a limit or offset that would never finish the sync", () => {
    assert.throws(() => mapRecordPage([], mapCompany, undefined, 0), /Page limit/);
    assert.throws(() => mapRecordPage([], mapCompany, { offset: -10 }, 2), /Page offset/);
  });
});

describe("response checks", () => {
  it("returns the data array and rejects a body that is not a record list", () => {
    const records = readAttioRecords(
      { data: [company("rec_a", "Northwind Analytics")] },
      "companies",
    );
    assert.equal(records.length, 1);
    assert.equal(records[0]?.id.record_id, "rec_a");

    const secretMarker = "do-not-print-this-body";
    assert.throws(
      () => readAttioRecords({ data: secretMarker, other: "still-not-printed" }, "people"),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, "Unexpected Attio response for people");
        assert.equal(error.message.includes(secretMarker), false);
        return true;
      },
    );

    const leakedRow = "private-row-should-not-appear";
    assert.throws(
      () => readAttioRecords({ data: [leakedRow] }, "companies"),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, "Unexpected Attio response for companies");
        assert.equal(error.message.includes(leakedRow), false);
        return true;
      },
    );
  });

  it("reports HTTP status without a response body", () => {
    const error = attioStatusError(429, "companies");
    assert.equal(error.message, "Attio API error 429 on companies");
  });
});
