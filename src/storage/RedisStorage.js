import Redis from 'ioredis';

export class RedisStorage {
  constructor(options = {}) {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      ...options
    });

    this.client.on('error', (err) => {
      console.error('Redis error:', err);
    });
  }

  async connect() {
    await this.client.ping();
  }

  async disconnect() {
    await this.client.quit();
  }

  async get(key) {
    const value = await this.client.get(key);
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  async set(key, value) {
    const serialized = typeof value === 'object'
      ? JSON.stringify(value)
      : value;
    return await this.client.set(key, serialized);
  }

  async del(key) {
    return await this.client.del(key);
  }

  async pexpire(key, ms) {
    return await this.client.pexpire(key, ms);
  }

  async setex(key, seconds, value) {
    const serialized = typeof value === 'object'
      ? JSON.stringify(value)
      : value;
    return await this.client.setex(key, seconds, serialized);
  }

  async incr(key) {
    return await this.client.incr(key);
  }

  async expire(key, seconds) {
    return await this.client.expire(key, seconds);
  }

  async ttl(key) {
    return await this.client.ttl(key);
  }

  async zadd(key, score, member) {
    return await this.client.zadd(key, score, member);
  }

  async zremrangebyscore(key, min, max) {
    return await this.client.zremrangebyscore(key, min, max);
  }

  async zcard(key) {
    return await this.client.zcard(key);
  }
}
