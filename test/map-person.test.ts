import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapPerson } from "../src/map-person.js";
import type { AttioRecord } from "../src/types.js";

function person(overrides: AttioRecord["values"] = {}, recordId = "rec_avery"): AttioRecord {
  return {
    id: { record_id: recordId },
    values: overrides,
  };
}

describe("mapPerson", () => {
  it("maps a named person, both email slots, and the company record id", () => {
    const change = mapPerson(
      person({
        name: [{ first_name: "Avery", last_name: "Chen" }],
        email_addresses: [
          { email_address: "avery.chen@northwind.example" },
          { email_address: "avery@personal.example" },
          { email_address: "ignored@northwind.example" },
        ],
        phone_numbers: [{ phone_number: "+1-503-555-0100" }],
        job_title: [{ value: "Support lead" }],
        company: [{ target_record_id: "rec_northwind" }],
        description: [{ value: "Fictional contact for the example." }],
        linkedin: [{ value: "https://example.com/in/avery-chen" }],
        linkedin_url: [{ value: "https://example.com/in/should-not-win" }],
        connection_strength: [{ value: 2 }],
        birthday: [{ value: "1990-04-12" }],
        primary_location: [{ city: "Portland", state: "OR" }],
        avatar_url: [{ value: "https://cdn.example/avery.png" }],
      }),
    );

    assert.equal(change.key, "rec_avery");
    assert.equal(change.type, "upsert");
    assert.equal(change.properties.Name, "Avery Chen");
    assert.equal(change.properties["First Name"], "Avery");
    assert.equal(change.properties["Last Name"], "Chen");
    assert.equal(change.properties.Email, "avery.chen@northwind.example");
    assert.equal(change.properties["Email (Other)"], "avery@personal.example");
    assert.equal(change.properties.Phone, "+1-503-555-0100");
    assert.equal(change.properties["Job Title"], "Support lead");
    assert.deepEqual(change.properties.Company, ["rec_northwind"]);
    assert.equal(change.properties.LinkedIn, "https://example.com/in/avery-chen");
    assert.equal(change.properties["Connection Strength"], "2");
    assert.equal(change.properties.Birthday, "1990-04-12");
    assert.equal(change.properties.City, "Portland");
    assert.equal(change.properties.State, "OR");
    assert.equal(change.properties["Photo URL"], "https://cdn.example/avery.png");
  });

  it("uses the record id when both names are blank and leaves company empty", () => {
    const change = mapPerson(person({ name: [{ first_name: " ", last_name: "" }] }, "rec_noname"));

    assert.equal(change.properties.Name, "rec_noname");
    assert.equal(change.properties["First Name"], "");
    assert.deepEqual(change.properties.Company, []);
    assert.equal(change.properties.Email, "");
    assert.equal(change.properties["Email (Other)"], "");
  });

  it("skips blank addresses and still keeps an automated mailbox", () => {
    const change = mapPerson(
      person({
        name: [{ first_name: "Riley", last_name: "Nguyen" }],
        email_addresses: [
          { email_address: "  " },
          { email_address: "noreply@harbor.example" },
          { email_address: " riley@harbor.example " },
        ],
      }),
    );

    assert.equal(change.properties.Email, "noreply@harbor.example");
    assert.equal(change.properties["Email (Other)"], "riley@harbor.example");
  });

  it("copies the first two addresses as stored, including a mailbox that looks automated", () => {
    const change = mapPerson(
      person({
        name: [{ first_name: "Riley", last_name: "Nguyen" }],
        email_addresses: [
          { email_address: "noreply@harbor.example" },
          { email_address: "riley@harbor.example" },
        ],
      }),
    );

    assert.equal(change.properties.Email, "noreply@harbor.example");
    assert.equal(change.properties["Email (Other)"], "riley@harbor.example");
  });

  it("falls back to linkedin_url when linkedin is only whitespace", () => {
    const change = mapPerson(
      person(
        {
          name: [{ first_name: "Jordan", last_name: "Lee" }],
          linkedin: [{ value: "   " }],
          linkedin_url: [{ value: "https://example.com/in/jordan-lee" }],
        },
        "rec_jordan_ws",
      ),
    );

    assert.equal(change.properties.LinkedIn, "https://example.com/in/jordan-lee");
  });

  it("falls back to linkedin_url only when linkedin is missing", () => {
    const change = mapPerson(
      person(
        {
          name: [{ first_name: "Jordan", last_name: "Lee" }],
          linkedin_url: [{ value: "https://example.com/in/jordan-lee" }],
        },
        "rec_jordan",
      ),
    );

    assert.equal(change.properties.LinkedIn, "https://example.com/in/jordan-lee");
  });

  it("leaves a non-finite connection strength empty", () => {
    const change = mapPerson(
      person({ connection_strength: [{ value: Number.NaN }] }, "rec_nan"),
    );
    assert.equal(change.properties["Connection Strength"], "");
  });

  it("does not stringify an object connection strength", () => {
    const change = mapPerson(
      person({ connection_strength: [{ value: { level: "strong" } }] }, "rec_object"),
    );
    assert.equal(change.properties["Connection Strength"], "");
  });

  it("stringifies connection strength and uses an empty string when it is absent", () => {
    assert.equal(
      mapPerson(person({ connection_strength: [{ value: null }] }, "rec_null")).properties[
        "Connection Strength"
      ],
      "",
    );
    assert.equal(
      mapPerson(person({}, "rec_missing")).properties["Connection Strength"],
      "",
    );
  });

  it("emits two upserts when two records share an id; it does not merge them", () => {
    const first = mapPerson(
      person({ name: [{ first_name: "Avery", last_name: "Chen" }] }, "rec_same"),
    );
    const second = mapPerson(
      person({ name: [{ first_name: "Avery", last_name: "Chen-Smith" }] }, "rec_same"),
    );

    assert.equal(first.key, second.key);
    assert.notEqual(first.properties.Name, second.properties.Name);
  });
});
