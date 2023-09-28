import { Redis } from 'ioredis';
import ms from 'ms';

export type AsyncNullable<T> = Promise<T | null>;

export class RedisStore {
  constructor(private readonly redis: Redis) {}

  async set<T = any>(key: string, val: T, ttl?: string): Promise<void> {
    if (ttl) {
      await this.redis.set(key, JSON.stringify(val), 'PX', ms(ttl));
    } else {
      await this.redis.set(key, JSON.stringify(val));
    }
  }

  async get<T = any>(key: string): AsyncNullable<T> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

interface Connection {
  host: string;
  port: number;
  password?: string;
}

/**
 * nfigures the url mapping for redis server based on the environment
 * There should be a better way to this but we're gonna stick with this for now I guess
 */
export const configureRedisUrl = (connectionString: string): Connection => {
  let redisConnection: Connection;
  if (process.env.NODE_ENV == 'production') {
    redisConnection = {
      host: connectionString.split(':')[2].split('@')[1],
      port: parseInt(connectionString.split(':')[3]),
      password: connectionString.split(':')[2].split('@')[0],
    };
  } else {
    redisConnection = {
      host: 'localhost',
      port: 6379,
    };
  }
  return redisConnection;
};
