import { parseWindow } from '../utils/time.js';

export default function createTokenBucketLimiter(config) {
  const { refillRate, interval, maxTokens } = config;
  const intervalDuration = parseWindow(interval);

  return async (storage, identifier) => {
    const now = Date.now();
    const key = `bucket:${identifier}`;

    // Get or initialize bucket
    let bucket = await storage.get(key) || {
      tokens: maxTokens,
      lastRefill: now
    };

    // Calculate refills since last check
    const timePassed = now - bucket.lastRefill;
    const refills = Math.floor(timePassed / intervalDuration);

    if (refills > 0) {
      bucket.tokens = Math.min(maxTokens, bucket.tokens + (refills * refillRate));
      bucket.lastRefill += refills * intervalDuration;
    }

    // Check if we can consume a token
    if (bucket.tokens < 1) {
      const timeToNextRefill = intervalDuration - (now - bucket.lastRefill);
      const reset = now + timeToNextRefill;

      // Save bucket state
      await storage.setex(key, 3600, bucket);

      return {
        success: false,
        limit: maxTokens,
        remaining: Math.floor(bucket.tokens),
        reset,
        retryAfter: Math.ceil(timeToNextRefill / 1000)
      };
    }

    // Consume a token
    bucket.tokens -= 1;
    await storage.setex(key, 3600, bucket);

    // Calculate when bucket will be full again
    const tokensNeeded = maxTokens - bucket.tokens;
    const refillsNeeded = Math.ceil(tokensNeeded / refillRate);
    const timeToFull = refillsNeeded * intervalDuration;

    return {
      success: true,
      limit: maxTokens,
      remaining: Math.floor(bucket.tokens),
      reset: now + timeToFull,
      retryAfter: null
    };
  };
}
