import { parseWindow } from '../utils/time.js';

export default function createLeakyBucketLimiter(config) {
  const { capacity, leakRate, interval } = config;
  const intervalDuration = parseWindow(interval);

  return async (storage, identifier) => {
    const now = Date.now();
    const key = `leaky:${identifier}`;

    // Get or initialize bucket
    let bucket = await storage.get(key) || {
      level: 0,
      lastLeak: now
    };

    // Calculate leak since last check
    const timePassed = now - bucket.lastLeak;
    const leaked = (timePassed / intervalDuration) * leakRate;

    bucket.level = Math.max(0, bucket.level - leaked);
    bucket.lastLeak = now;

    // Check if bucket has space
    if (bucket.level >= capacity) {
      const timeToLeak = ((bucket.level - capacity + 1) / leakRate) * intervalDuration;
      const reset = now + timeToLeak;

      await storage.setex(key, 3600, bucket);

      return {
        success: false,
        limit: capacity,
        remaining: 0,
        reset,
        retryAfter: Math.ceil(timeToLeak / 1000)
      };
    }

    // Add to bucket
    bucket.level += 1;
    await storage.setex(key, 3600, bucket);

    const remaining = Math.floor(capacity - bucket.level);
    const timeToEmpty = (bucket.level / leakRate) * intervalDuration;

    return {
      success: true,
      limit: capacity,
      remaining,
      reset: now + timeToEmpty,
      retryAfter: null
    };
  };
}
