export class InMemoryStorage extends Map {
  constructor() {
    super();
    this._timers = new Map();
  }

  async connect() {
    // No-op for in-memory storage
    return Promise.resolve();
  }

  async disconnect() {
    this.clear();
    return Promise.resolve();
  }

  async get(key) {
    return super.get(key);
  }

  async set(key, value) {
    this._clearTimer(key);
    super.set(key, value);
    return 'OK';
  }

  async del(key) {
    if (this.has(key)) {
      this._clearTimer(key);
      super.delete(key);
      return 1;
    }
    return 0;
  }

  async pexpire(key, ms) {
    if (!this.has(key)) return 0;

    this._clearTimer(key);

    const timer = setTimeout(() => {
      super.delete(key);
      this._timers.delete(key);
    }, ms);

    timer.unref?.();
    this._timers.set(key, timer);
    return 1;
  }

  async setex(key, seconds, value) {
    await this.set(key, value);
    await this.pexpire(key, seconds * 1000);
    return 'OK';
  }

  async incr(key) {
    const current = super.get(key) || 0;
    const newValue = current + 1;
    super.set(key, newValue);
    return newValue;
  }

  async expire(key, seconds) {
    return await this.pexpire(key, seconds * 1000);
  }

  async ttl(key) {
    // Simplified TTL - would need more complex tracking for accuracy
    return this.has(key) ? -1 : -2;
  }

  _clearTimer(key) {
    if (this._timers.has(key)) {
      clearTimeout(this._timers.get(key));
      this._timers.delete(key);
    }
  }

  clear() {
    for (const timer of this._timers.values()) {
      clearTimeout(timer);
    }
    this._timers.clear();
    super.clear();
  }
}
