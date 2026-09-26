// Best-effort, in-memory rate limiting for parse-receipt.
//
// There is no database or auth in this project (CLAUDE.md), so limits are
// kept per Edge Function instance and reset whenever Supabase recycles it.
// That makes this a brake on bursts (a leaked anon key hammered in a loop),
// not a hard quota: the hard cap on Gemini spend is the Google Cloud quota
// and budget on the API key's project. No Deno APIs, so jest can test it.

export type RateLimitRule = { limit: number; windowMs: number };

export type RateLimitConfig = {
  perClient: RateLimitRule[];
  global: RateLimitRule[];
  // Bounds memory if many distinct clients show up.
  maxTrackedClients: number;
};

export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  perClient: [
    { limit: 5, windowMs: 60_000 }, // 5 per minute
    { limit: 30, windowMs: 60 * 60_000 }, // 30 per hour
  ],
  global: [{ limit: 60, windowMs: 60_000 }], // 60 per minute across all clients
  maxTrackedClients: 5_000,
};

export type RateLimitDecision = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export class RateLimiter {
  private readonly clients = new Map<string, number[]>();
  private globalHits: number[] = [];
  private readonly longestWindowMs: number;

  constructor(private readonly config: RateLimitConfig = DEFAULT_RATE_LIMITS) {
    this.longestWindowMs = Math.max(...config.perClient.map((r) => r.windowMs), ...config.global.map((r) => r.windowMs));
  }

  // Records the hit only when it is allowed, so rejected retries do not
  // extend a client's lockout.
  check(clientId: string, now: number): RateLimitDecision {
    const cutoff = now - this.longestWindowMs;
    const clientHits = (this.clients.get(clientId) ?? []).filter((t) => t > cutoff);
    this.globalHits = this.globalHits.filter((t) => t > cutoff);

    const retryAfterMs = Math.max(
      retryAfter(clientHits, this.config.perClient, now),
      retryAfter(this.globalHits, this.config.global, now)
    );
    if (retryAfterMs > 0) {
      this.clients.set(clientId, clientHits);
      return { allowed: false, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) };
    }

    clientHits.push(now);
    this.globalHits.push(now);
    // Re-insert so Map order tracks recency, then evict the stalest client.
    this.clients.delete(clientId);
    this.clients.set(clientId, clientHits);
    if (this.clients.size > this.config.maxTrackedClients) {
      const oldest = this.clients.keys().next().value;
      if (oldest !== undefined) {
        this.clients.delete(oldest);
      }
    }
    return { allowed: true };
  }
}

// Milliseconds until every rule would admit one more hit (0 = allowed now).
function retryAfter(hits: number[], rules: RateLimitRule[], now: number): number {
  let wait = 0;
  for (const rule of rules) {
    const inWindow = hits.filter((t) => t > now - rule.windowMs);
    if (inWindow.length >= rule.limit) {
      // The oldest hit that must expire before a slot frees up.
      const blocking = inWindow[inWindow.length - rule.limit];
      wait = Math.max(wait, blocking + rule.windowMs - now);
    }
  }
  return wait;
}

// Supabase's gateway sets x-forwarded-for; the first entry is the caller.
export function clientIdFromHeaders(headers: { get(name: string): string | null }): string {
  const forwarded = headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first || 'unknown';
}
