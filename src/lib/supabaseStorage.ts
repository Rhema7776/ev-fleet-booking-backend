import { createClient } from "@supabase/supabase-js";

/**
 * Uses Supabase Storage rather than a new third-party service, since this
 * project's Postgres database is already on Supabase — no new account or
 * dependency needed.
 *
 * IMPORTANT — separate from Prisma's DATABASE_URL. Storage is accessed
 * through Supabase's own API, not the Postgres connection string, so it
 * needs its own credentials. Add these on Render (or wherever the backend
 * is deployed):
 *
 *   SUPABASE_URL               Project Settings -> API -> Project URL
 *   SUPABASE_SERVICE_ROLE_KEY  Project Settings -> API -> service_role key
 *
 * Use the SERVICE ROLE key here, never the anon key — this file only runs
 * server-side. That's also why uploads are proxied through this backend
 * (see vehicleController.ts's uploadVehicleImage) rather than done
 * directly from the browser: the service role key must never reach the
 * client.
 *
 * One-time manual setup required in the Supabase dashboard (not something
 * this code can do for you): Storage -> New bucket -> name it
 * "vehicle-images" -> Public bucket: on (so getPublicUrl below actually
 * resolves to a viewable image without extra signed-URL logic).
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Lazily created, NOT at module load time. Creating this eagerly at
// import time was a real bug: the Supabase SDK throws synchronously if
// the URL is missing/malformed, which meant a bad env var crashed the
// entire backend on boot — not just this one feature, contradicting the
// "rest of the app should keep working" intent below. Deferring
// construction until an upload is actually attempted means a missing
// env var only breaks image uploads specifically; everything else
// (auth, bookings, vehicles without a photo) keeps working.
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set — vehicle image uploads are unavailable until both are configured."
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);
  return supabaseClient;
}

const VEHICLE_IMAGES_BUCKET = "vehicle-images";

export async function uploadVehicleImage(
  buffer: Buffer,
  originalFileName: string,
  mimeType: string
): Promise<string> {
  const supabase = getSupabaseClient();

  // Prefixed with a timestamp so two vehicles named the same thing (or
  // the same vehicle re-uploaded) never collide on the storage path.
  const safeName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from(VEHICLE_IMAGES_BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(VEHICLE_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
