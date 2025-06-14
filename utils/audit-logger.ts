import { createServerSupabaseClient } from "@/utils/supabase/server";

export interface AuditLogEntry {
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

// Helper type for entries that might be missing required fields
type PartialAuditLogEntry = Partial<AuditLogEntry>;

// Helper type for ensuring required fields are present
type RequiredAuditFields = "action" | "resource_type";

/**
 * Records an audit log entry in the Supabase "audit_logs" table.
 *
 * @param entry - The complete audit log entry to be recorded.
 *
 * @remark
 * If the log entry cannot be inserted, the error is logged to the console but not thrown.
 */
export async function logAuditEvent(entry: AuditLogEntry) {
  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.from("audit_logs").insert({
      ...entry,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to log audit event:", error);
    }
  } catch (error) {
    console.error("Audit logging error:", error);
  }
}

/**
 * Creates an audit logger with a predefined base context.
 *
 * Returns an object with a `log` method that records audit events by merging the provided entry with the base context. The `log` method requires the entry to include the `action` and `resource_type` fields.
 *
 * @param baseContext - Partial audit log fields to be included in every log entry.
 * @returns An object with a `log` method for recording audit events.
 */
export function createAuditLogger(baseContext: PartialAuditLogEntry) {
  return {
    log: (
      entry: PartialAuditLogEntry &
        Required<Pick<AuditLogEntry, RequiredAuditFields>>,
    ) => {
      // Ensure required fields are present
      const completeEntry: AuditLogEntry = {
        ...baseContext,
        ...entry,
      };
      return logAuditEvent(completeEntry);
    },
  };
}
