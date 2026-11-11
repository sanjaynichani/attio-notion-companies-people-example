import { clean, requireRecordId } from "./text.js";
import type { AttioRecord, UpsertChange } from "./types.js";

/**
 * Companies mapping from the original Notion Worker, plus the trimming and
 * record-id check in `text.ts`. A record with no name still uses its Attio
 * record id as the title. Empty fields stay empty strings.
 */
export function mapCompany(company: AttioRecord): UpsertChange {
  const v = company.values ?? {};
  const recordId = requireRecordId(company);

  return {
    type: "upsert",
    key: recordId,
    properties: {
      Name: clean(v.name?.[0]?.value) || recordId,
      "Attio ID": recordId,
      Domain: clean(v.domains?.[0]?.domain),
      Description: clean(v.description?.[0]?.value),
      LinkedIn: clean(v.linkedin?.[0]?.value),
      City: clean(v.primary_location?.[0]?.city),
      State: clean(v.primary_location?.[0]?.state),
      "Employee Range": clean(v.employee_range?.[0]?.value),
      "Logo URL": clean(v.logo_url?.[0]?.value),
    },
  };
}
