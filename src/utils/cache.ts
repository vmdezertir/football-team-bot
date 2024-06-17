import { StorageValue, buildStorage, canStale } from 'axios-cache-interceptor';
import { Redis } from 'ioredis';

export const getRedisStorage = (client: Redis) =>
  buildStorage({
    find(key) {
      return client
        .get(`axios-cache-${key}`)
        .then((result: string | null) => (result ? (JSON.parse(result) as StorageValue) : undefined));
    },

    set(key, value, req) {
      const expireAt =
        // Check if the value is in a loading state
        value.state === 'loading'
          ? // Calculate expiration time based on request cache TTL or default to 1 minute
            Date.now() + (req?.cache && typeof req.cache.ttl === 'number' ? req.cache.ttl : 60000)
          : // Check if the value is in a stale state with a determined TTL, or if it's in a cached state that can't go stale
            (value.state === 'stale' && value.ttl) || (value.state === 'cached' && !canStale(value))
            ? value.createdAt + value.ttl!
            : // Otherwise, keep it indefinitely
              undefined;
      if (expireAt) {
        client.psetex(`axios-cache-${key}`, expireAt - Date.now(), JSON.stringify(value));
      } else {
        client.set(`axios-cache-${key}`, JSON.stringify(value));
      }
    },

    remove(key) {
      client.del(`axios-cache-${key}`);
    },
  });
