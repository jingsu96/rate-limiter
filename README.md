# Rate Limiter

![Rate Limiter](https://imgs.parseweb.dev/images/fe-profermance/rate-limiting/og.png)

This repository is inspired by [@upstash/ratelimit-js](https://github.com/upstash/ratelimit-js).
I’ve implemented a simplified version of a rate-limiting algorithm.

I’ve also written an article about this topic — you can read it here:

- [English Version](https://www.parseweb.dev/writing/fe-performance/rate-limiting)
- [Chinese Version](https://www.parseweb.dev/zh-hant/writing/fe-performance/rate-limiting)

## Features

- **Multiple Algorithms**:
  - Fixed Window Counter
  - Sliding Window Counter
  - Token Bucket
  - Leaky Bucket
  - Sliding Window Log

- **Storage Options**:
  - In-memory storage (for development/single instance)
  - Redis storage (for production/distributed systems)

- **Production Ready**:
  - Express middleware integration
  - Docker support
  - Rate limit headers
  - Graceful degradation

## Quick Start

### Local Development

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Run with in-memory storage:

```bash
pnpm start
```

4. Run with Redis:

```bash
# Start Redis
docker run -d -p 6379:6379 redis:alpine

# Update .env with Redis settings
echo "REDIS_HOST=localhost" >> .env

# Start application
pnpm start
```

### Docker Setup

1. Build and run with Docker Compose:
```bash
docker-compose up --build
```

This starts:
- Node.js application on port 3334
- Redis on port 6379
- Redis Commander UI on port 8081

2. Access services:
- API: http://localhost:3334
- Redis Commander: http://localhost:8081

## API Endpoints

### Test Endpoints

```bash
# Basic API request (100 req/min limit)
curl http://localhost:3334/api/data

# Check rate limit headers
curl -i http://localhost:3334/api/data
```

## Testing

### Unit Tests
```bash
pnpm test
```

### Load Testing
```bash
node test/loadTest.js
```

### Benchmarks
```bash
node scripts/benchmark.js
```

## Checking Redis Data

### Using Redis CLI
```bash
# List all rate limiting keys
docker exec <redis-container-name> redis-cli keys '*'

# Check specific key value
docker exec <redis-container-name> redis-cli get "bucket:user-1"

# Monitor Redis in real-time
docker exec <redis-container-name> redis-cli monitor

# Get Redis info
docker exec <redis-container-name> redis-cli info
```

### Using Redis Commander (Web UI)
1. Start with Docker Compose:
```bash
docker-compose up --build
```

2. Access Redis Commander: http://localhost:8081

3. Browse keys and view values in the web interface

### Common Redis Commands
```bash
# Count total keys
docker exec <redis-container-name> redis-cli dbsize

# Get all keys with pattern
docker exec <redis-container-name> redis-cli keys "bucket:*"

# Delete specific key
docker exec <redis-container-name> redis-cli del "bucket:user-1"

# Flush all data (use with caution!)
docker exec <redis-container-name> redis-cli flushall
```

## Algorithm Comparison

| Algorithm | Pros | Cons | Use Case |
|-----------|------|------|----------|
| **Fixed Window** | Simple, memory efficient | Boundary issues | Basic rate limiting |
| **Sliding Window** | Smoother distribution | More complex | Better accuracy |
| **Token Bucket** | Allows bursts | State management | API with burst traffic |
| **Leaky Bucket** | Smooth rate | No bursts | Steady flow required |
| **Sliding Log** | Most accurate | Memory intensive | High accuracy needed |


### Example with rate-limiter-flexible:

```javascript
const { RateLimiterRedis } = require('rate-limiter-flexible');

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'middleware',
  points: 100, // requests
  duration: 60, // per minute
  blockDuration: 60, // block for 1 minute
});

app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).send('Too Many Requests');
  }
});
```


## Author

[JingHuang Su](https://www.linkedin.com/in/jinghuang-su/) — Open to opportunities!
# rate-limiter
