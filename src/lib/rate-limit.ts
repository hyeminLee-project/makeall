export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

const MAX_ENTRIES = 10_000;

const requests = new Map<string, number[]>();

let cleanupScheduled = false;

function scheduleCleanup(windowMs: number) {
  if (cleanupScheduled) return;
  cleanupScheduled = true;

  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of requests) {
      const valid = timestamps.filter((t) => now - t < windowMs);
      if (valid.length === 0) requests.delete(key);
      else requests.set(key, valid);
    }
  }, 60_000);
}

function evictOldest() {
  if (requests.size <= MAX_ENTRIES) return;
  const toDelete = requests.size - MAX_ENTRIES;
  const iter = requests.keys();
  for (let i = 0; i < toDelete; i++) {
    const key = iter.next().value;
    if (key) requests.delete(key);
  }
}

export function createRateLimit({
  windowMs,
  maxRequests,
}: {
  windowMs: number;
  maxRequests: number;
}) {
  scheduleCleanup(windowMs);

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
      evictOldest();
      return { success: true, retryAfter: 0 };
    },
  };
}
