const Redis = require('ioredis');

const redisHostname = process.env.REDIS_HOSTNAME
  ? process.env.REDIS_HOSTNAME
  : 'redis';

module.exports = new Redis(6379, redisHostname);
