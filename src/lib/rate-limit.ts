const requests = new Map<string, number[]>();

export function createRateLimit({
  windowMs,
  maxRequests,
}: {
  windowMs: number;
  maxRequests: number;
}) {
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of requests) {
      const valid = timestamps.filter((t) => now - t < windowMs);
      if (valid.length === 0) requests.delete(key);
      else requests.set(key, valid);
    }
  }, 60_000);

  return {
    check(key: string): { success: boolean; retryAfter: number } {
      const now = Date.now();
      const timestamps = (requests.get(key) ?? []).filter((t) => now - t < windowMs);

      if (timestamps.length >= maxRequests) {
        const retryAfter = timestamps[0] + windowMs - now;
        return { success: false, retryAfter };
      }

      timestamps.push(now);
      requests.set(key, timestamps);
      return { success: true, retryAfter: 0 };
    },
  };
}
