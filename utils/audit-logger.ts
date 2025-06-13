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

export function createAuditLogger(baseContext: Partial<AuditLogEntry>) {
  return {
    log: (entry: Omit<AuditLogEntry, keyof typeof baseContext>) => {
      return logAuditEvent({ ...baseContext, ...entry });
    },
  };
}
