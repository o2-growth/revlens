import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        // PKCE makes invite/recovery links carry a token_hash that must be
        // explicitly exchanged client-side. Prevents Gmail/Outlook URL
        // prefetching from silently consuming the OTP before the user clicks.
        flowType: 'pkce',
      },
    }
  );
}
