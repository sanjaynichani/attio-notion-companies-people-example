import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapCompany } from "../src/map-company.js";
import type { AttioRecord } from "../src/types.js";

function company(overrides: AttioRecord["values"] = {}, recordId = "rec_northwind"): AttioRecord {
  return {
    id: { record_id: recordId },
    values: overrides,
  };
}

describe("mapCompany", () => {
  it("maps the first value of each company field and keys the upsert by record id", () => {
    const change = mapCompany(
      company({
        name: [{ value: "Northwind Analytics" }],
        domains: [{ domain: "northwind.example" }, { domain: "ignored.example" }],
        description: [{ value: "Fictional analytics team used for this example." }],
        linkedin: [{ value: "https://example.com/company/northwind" }],
        primary_location: [{ city: "Portland", state: "OR" }],
        employee_range: [{ value: "11-50" }],
        logo_url: [{ value: "https://cdn.example/northwind.png" }],
      }),
    );

    assert.deepEqual(change, {
      type: "upsert",
      key: "rec_northwind",
      properties: {
        Name: "Northwind Analytics",
        "Attio ID": "rec_northwind",
        Domain: "northwind.example",
        Description: "Fictional analytics team used for this example.",
        LinkedIn: "https://example.com/company/northwind",
        City: "Portland",
        State: "OR",
        "Employee Range": "11-50",
        "Logo URL": "https://cdn.example/northwind.png",
      },
    });
  });

  it("uses the record id when the company has no name, and keeps missing fields empty", () => {
    const change = mapCompany(company({}, "rec_unnamed"));

    assert.equal(change.properties.Name, "rec_unnamed");
    assert.equal(change.properties.Domain, "");
    assert.equal(change.properties.Description, "");
    assert.equal(change.properties.LinkedIn, "");
    assert.equal(change.properties.City, "");
    assert.equal(change.properties.State, "");
    assert.equal(change.properties["Employee Range"], "");
    assert.equal(change.properties["Logo URL"], "");
  });

  it("treats a blank name as missing", () => {
    const change = mapCompany(company({ name: [{ value: "" }] }, "rec_blank"));
    assert.equal(change.properties.Name, "rec_blank");
  });

  it("trims a padded name and treats a whitespace-only name as missing", () => {
    assert.equal(
      mapCompany(company({ name: [{ value: "  Northwind Analytics  " }] })).properties.Name,
      "Northwind Analytics",
    );
    assert.equal(
      mapCompany(company({ name: [{ value: "   " }] }, "rec_space")).properties.Name,
      "rec_space",
    );
  });

  it("rejects a record that has no id, without echoing the record", () => {
    const marker = "do-not-print-this-record";
    assert.throws(
      () => mapCompany({ id: { record_id: " " }, values: { description: [{ value: marker }] } }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, "Attio record is missing record_id");
        assert.equal(error.message.includes(marker), false);
        return true;
      },
    );
  });
});
