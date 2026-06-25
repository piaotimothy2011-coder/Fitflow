// Cloud sync layer. Mirrors the localStorage "ff.*" keys into a single
// Supabase table `user_data(user_id, key, value jsonb)` guarded by RLS.
// Strategy: localStorage stays the synchronous source of truth for the UI;
// this module pushes every write up and pulls everything down on sign-in.
import { supabase } from "./supabase";
import { setSyncPusher, rawWrite, SYNC_KEYS, SKIP_SYNC_KEYS } from "./storage";

const TABLE = "user_data";

let currentUserId: string | null = null;

function nowIso() {
  return new Date().toISOString();
}

// Begin mirroring local writes up to the cloud for this user.
export function startSync(userId: string) {
  currentUserId = userId;
  setSyncPusher((key, value) => {
    if (!supabase || !currentUserId || SKIP_SYNC_KEYS.has(key)) return;
    supabase
      .from(TABLE)
      .upsert(
        { user_id: currentUserId, key, value, updated_at: nowIso() },
        { onConflict: "user_id,key" }
      )
      .then(({ error }) => {
        if (error) console.warn("[FitFlow sync] cloud save failed:", error.message,
          "\nDid you run supabase/schema.sql to create the user_data table?");
      });
  });
}

export function stopSync() {
  currentUserId = null;
  setSyncPusher(null);
}

// Pull every row for the user into localStorage. Returns rows pulled.
export async function pullAll(userId: string): Promise<number> {
  if (!supabase) return 0;
  const { data, error } = await supabase
    .from(TABLE)
    .select("key,value")
    .eq("user_id", userId);
  if (error) {
    console.warn("[FitFlow sync] cloud load failed:", error.message,
      "\nDid you run supabase/schema.sql to create the user_data table?");
    return 0;
  }
  if (!data) return 0;
  for (const row of data as { key: string; value: unknown }[]) {
    rawWrite(row.key, row.value);
  }
  return data.length;
}

// Push everything currently in localStorage up (first-time migration / signup).
export async function pushAllLocal(userId: string): Promise<void> {
  if (!supabase || typeof window === "undefined") return;
  const rows: { user_id: string; key: string; value: unknown; updated_at: string }[] = [];
  for (const key of SYNC_KEYS) {
    if (SKIP_SYNC_KEYS.has(key)) continue;
    const raw = window.localStorage.getItem(key);
    if (raw == null) continue;
    try {
      rows.push({ user_id: userId, key, value: JSON.parse(raw), updated_at: nowIso() });
    } catch {
      /* skip unparseable */
    }
  }
  if (rows.length) {
    await supabase.from(TABLE).upsert(rows, { onConflict: "user_id,key" });
  }
}
