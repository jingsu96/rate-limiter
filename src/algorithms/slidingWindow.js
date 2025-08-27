import { parseWindow } from '../utils/time.js';

export default function createSlidingWindowLimiter(config) {
  const { tokens, window } = config;
  const windowDuration = parseWindow(window);

  return async (storage, identifier) => {
    const now = Date.now();
    const currentBucket = Math.floor(now / windowDuration);
    const previousBucket = currentBucket - 1;

    const currentKey = `sliding:${identifier}:${currentBucket}`;
    const previousKey = `sliding:${identifier}:${previousBucket}`;

    // Get counts from both windows
    const [currentCount, previousCount] = await Promise.all([
      storage.get(currentKey) || 0,
      storage.get(previousKey) || 0
    ]);

    // Calculate weighted count
    const percentageInCurrentWindow = (now % windowDuration) / windowDuration;
    const weightedPrevious = Math.floor(previousCount * (1 - percentageInCurrentWindow));
    const estimatedCount = currentCount + weightedPrevious;

    const reset = (currentBucket + 1) * windowDuration;

    if (estimatedCount >= tokens) {
      return {
        success: false,
        limit: tokens,
        remaining: 0,
        reset,
        retryAfter: Math.ceil((reset - now) / 1000)
      };
    }

    // Increment current window
    const newCount = await storage.incr(currentKey);
    if (newCount === 1) {
      await storage.expire(currentKey, Math.ceil(windowDuration * 2 / 1000));
    }

    const newEstimate = newCount + weightedPrevious;
    const remaining = Math.max(0, tokens - Math.ceil(newEstimate));

    return {
      success: true,
      limit: tokens,
      remaining,
      reset,
      retryAfter: null
    };
  };
}
