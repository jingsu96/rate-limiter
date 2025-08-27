import { parseWindow } from '../utils/time.js';

export default function createFixedWindowLimiter(config) {
  const { tokens, window } = config;
  const windowDuration = parseWindow(window);

  return async (storage, identifier) => {
    const now = Date.now();
    const bucket = Math.floor(now / windowDuration);
    const key = `fixed:${identifier}:${bucket}`;

    const current = await storage.incr(key);

    if (current === 1) {
      await storage.expire(key, Math.ceil(windowDuration / 1000));
    }

    const reset = (bucket + 1) * windowDuration;
    const remaining = Math.max(0, tokens - current);
    const success = current <= tokens;

    return {
      success,
      limit: tokens,
      remaining,
      reset,
      retryAfter: success ? null : Math.ceil((reset - now) / 1000)
    };
  };
}
