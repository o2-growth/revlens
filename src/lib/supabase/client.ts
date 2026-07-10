import { createBrowserClient } from '@supabase/ssr';

const GLOBAL_KEY = '__supabase_browser_client__';

// PKCE keeps invite/recovery tokens in a token_hash that is only consumed
// when the app explicitly calls verifyOtp/exchangeCodeForSession. Prevents
// Gmail/Outlook URL prefetch from burning the one-time token before the
// user actually clicks.
const SUPABASE_OPTIONS = {
  auth: { flowType: 'pkce' as const },
};

export function createClient() {
  if (typeof window === 'undefined') {
    // Server-side: always create fresh (never cached)
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      SUPABASE_OPTIONS
    );
  }

  // Client-side: true singleton via globalThis
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      SUPABASE_OPTIONS
    );
  }

  return g[GLOBAL_KEY];
}
