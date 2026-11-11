/**
 * Plain stand-in for the Notion Worker upsert the original sync returned.
 * The original wrapped each field in a Worker builder (`Builder.title`,
 * `Builder.richText`, `Builder.email`, `Builder.relation`). Those objects are
 * not reproduced here. Strings and record-id arrays are the mapped values.
 */
export interface UpsertChange {
  type: "upsert";
  key: string;
  properties: Record<string, string | string[]>;
}

export interface AttioRecord {
  id: {
    record_id: string;
  };
  values: AttioValues;
}

/**
 * Only the fields the companies and people mapping reads.
 * Attio returns each field as a list. The original code used the first item,
 * and the second email address when it was present.
 */
export interface AttioValues {
  name?: Array<{ value?: string; first_name?: string; last_name?: string }>;
  domains?: Array<{ domain?: string }>;
  description?: Array<{ value?: string }>;
  linkedin?: Array<{ value?: string }>;
  linkedin_url?: Array<{ value?: string }>;
  primary_location?: Array<{ city?: string; state?: string }>;
  employee_range?: Array<{ value?: string }>;
  logo_url?: Array<{ value?: string }>;
  email_addresses?: Array<{ email_address?: string }>;
  phone_numbers?: Array<{ phone_number?: string }>;
  job_title?: Array<{ value?: string }>;
  company?: Array<{ target_record_id?: string }>;
  connection_strength?: Array<{ value?: unknown }>;
  birthday?: Array<{ value?: string }>;
  avatar_url?: Array<{ value?: string }>;
}
