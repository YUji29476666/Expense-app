import { clientIdFromHeaders, RateLimiter, type RateLimitConfig } from '../rate-limit';

const CONFIG: RateLimitConfig = {
  perClient: [
    { limit: 2, windowMs: 1_000 },
    { limit: 3, windowMs: 10_000 },
  ],
  global: [{ limit: 5, windowMs: 1_000 }],
  maxTrackedClients: 3,
};

describe('RateLimiter', () => {
  it('allows up to the per-client limit, then rejects with a retry time', () => {
    const limiter = new RateLimiter(CONFIG);
    expect(limiter.check('a', 0)).toEqual({ allowed: true });
    expect(limiter.check('a', 100)).toEqual({ allowed: true });
    // Third hit within 1s: the hit at t=0 frees its slot at t=1000.
    expect(limiter.check('a', 200)).toEqual({ allowed: false, retryAfterSeconds: 1 });
  });

  it('admits the client again once the window slides past', () => {
    const limiter = new RateLimiter(CONFIG);
    limiter.check('a', 0);
    limiter.check('a', 100);
    expect(limiter.check('a', 1_001)).toEqual({ allowed: true });
  });

  it('applies the longer window too', () => {
    const limiter = new RateLimiter(CONFIG);
    limiter.check('a', 0);
    limiter.check('a', 2_000);
    limiter.check('a', 4_000);
    // 3 per 10s is used up until the t=0 hit expires at t=10000.
    expect(limiter.check('a', 6_000)).toEqual({ allowed: false, retryAfterSeconds: 4 });
    expect(limiter.check('a', 10_001)).toEqual({ allowed: true });
  });

  it('does not let rejected retries extend the lockout', () => {
    const limiter = new RateLimiter(CONFIG);
    limiter.check('a', 0);
    limiter.check('a', 100);
    for (let t = 200; t < 1_000; t += 100) {
      expect(limiter.check('a', t).allowed).toBe(false);
    }
    expect(limiter.check('a', 1_001)).toEqual({ allowed: true });
  });

  it('keeps clients independent but enforces the global cap', () => {
    const limiter = new RateLimiter(CONFIG);
    for (const id of ['a', 'a', 'b', 'b', 'c']) {
      expect(limiter.check(id, 0)).toEqual({ allowed: true });
    }
    // Sixth request in the same second from a fresh client hits the global cap.
    expect(limiter.check('d', 0).allowed).toBe(false);
  });

  it('forgets the least recently seen client beyond maxTrackedClients', () => {
    const limiter = new RateLimiter({ ...CONFIG, global: [{ limit: 100, windowMs: 1_000 }] });
    limiter.check('a', 0);
    limiter.check('a', 0);
    limiter.check('b', 0);
    limiter.check('c', 0);
    limiter.check('d', 0); // evicts 'a'
    expect(limiter.check('a', 0)).toEqual({ allowed: true });
  });
});

describe('clientIdFromHeaders', () => {
  const headers = (value: string | null) => ({ get: () => value });

  it('uses the first x-forwarded-for entry', () => {
    expect(clientIdFromHeaders(headers('203.0.113.7, 10.0.0.1'))).toBe('203.0.113.7');
  });

  it('falls back to a shared bucket when the header is missing', () => {
    expect(clientIdFromHeaders(headers(null))).toBe('unknown');
  });
});
