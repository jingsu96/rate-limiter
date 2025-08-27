import { parseWindow } from '../utils/time.js';

export default function createSlidingLogLimiter(config) {
  const { tokens, window } = config;
  const windowDuration = parseWindow(window);

  return async (storage, identifier) => {
    const now = Date.now();
    const key = `log:${identifier}`;
    const windowStart = now - windowDuration;

    // For Redis, we use sorted sets
    if (storage.zadd) {
      // Remove old entries
      await storage.zremrangebyscore(key, '-inf', windowStart);

      // Count current entries
      const count = await storage.zcard(key);

      if (count >= tokens) {
        // Get oldest entry for reset time
        const oldest = await storage.zrange(key, 0, 0, 'WITHSCORES');
        const reset = oldest && oldest.length > 1
          ? parseInt(oldest[1]) + windowDuration
          : now + windowDuration;

        return {
          success: false,
          limit: tokens,
          remaining: 0,
          reset,
          retryAfter: Math.ceil((reset - now) / 1000)
        };
      }

      // Add current request
      await storage.zadd(key, now, `${now}-${Math.random()}`);
      await storage.expire(key, Math.ceil(windowDuration / 1000) + 1);

      const remaining = tokens - count - 1;
      const reset = now + windowDuration;

      return {
        success: true,
        limit: tokens,
        remaining,
        reset,
        retryAfter: null
      };
    } else {
      // In-memory implementation
      let timestamps = await storage.get(key) || [];

      // Filter old timestamps
      timestamps = timestamps.filter(ts => ts > windowStart);

      if (timestamps.length >= tokens) {
        const reset = timestamps[0] + windowDuration;

        return {
          success: false,
          limit: tokens,
          remaining: 0,
          reset,
          retryAfter: Math.ceil((reset - now) / 1000)
        };
      }

      // Add current timestamp
      timestamps.push(now);
      await storage.setex(key, Math.ceil(windowDuration / 1000) + 1, timestamps);

      const remaining = tokens - timestamps.length;
      const reset = timestamps[0] + windowDuration;

      return {
        success: true,
        limit: tokens,
        remaining,
        reset,
        retryAfter: null
      };
    }
  };
}
