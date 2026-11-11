import { clean, connectionStrength, emailSlots, requireRecordId } from "./text.js";
import type { AttioRecord, UpsertChange } from "./types.js";

/**
 * People mapping from the original Notion Worker, plus the trimming, blank-email
 * skip, and connection-strength rules in `text.ts`.
 * The company property is still a list of Attio company record ids.
 * The original passed those ids to a Notion relation against the companies sync.
 */
export function mapPerson(person: AttioRecord): UpsertChange {
  const v = person.values ?? {};
  const recordId = requireRecordId(person);
  const first = clean(v.name?.[0]?.first_name);
  const last = clean(v.name?.[0]?.last_name);
  const companyId = clean(v.company?.[0]?.target_record_id);
  const [email, otherEmail] = emailSlots(v.email_addresses);

  return {
    type: "upsert",
    key: recordId,
    properties: {
      Name: `${first} ${last}`.trim() || recordId,
      "Attio ID": recordId,
      "First Name": first,
      "Last Name": last,
      Email: email,
      "Email (Other)": otherEmail,
      Phone: clean(v.phone_numbers?.[0]?.phone_number),
      "Job Title": clean(v.job_title?.[0]?.value),
      Company: companyId ? [companyId] : [],
      Description: clean(v.description?.[0]?.value),
      LinkedIn: clean(v.linkedin?.[0]?.value) || clean(v.linkedin_url?.[0]?.value),
      "Connection Strength": connectionStrength(v.connection_strength?.[0]?.value),
      Birthday: clean(v.birthday?.[0]?.value),
      City: clean(v.primary_location?.[0]?.city),
      State: clean(v.primary_location?.[0]?.state),
      "Photo URL": clean(v.avatar_url?.[0]?.value),
    },
  };
}
