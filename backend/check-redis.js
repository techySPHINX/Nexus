const Redis = require('ioredis');
require('dotenv').config();

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error('REDIS_URL is not set in environment variables.');
  process.exit(1);
}

const redis = new Redis(redisUrl);

redis
  .ping()
  .then((result) => {
    console.log('Redis connection successful:', result);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Redis connection failed:', err.message);
    process.exit(1);
  });
