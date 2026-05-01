/**
 * Vitest global setup — polyfills for node test environment.
 *
 * @adobe/data uses the Cache API (globalThis.caches) at module load time
 * for its blob-store persistence. This polyfill prevents "Cannot read
 * properties of undefined (reading 'open')" in node tests.
 */

// Minimal Cache API polyfill for node test environment
if (typeof globalThis.caches === 'undefined') {
  const memCache = new Map<string, Map<string, Response>>();

  const makeCache = (name: string) => ({
    match: (_req: RequestInfo) => Promise.resolve(undefined as Response | undefined),
    put: (_req: RequestInfo, _res: Response) => Promise.resolve(),
    delete: (_req: RequestInfo) => Promise.resolve(false as boolean),
    keys: () => Promise.resolve([] as Request[]),
    add: (_req: RequestInfo) => Promise.resolve(),
    addAll: (_reqs: RequestInfo[]) => Promise.resolve(),
    matchAll: () => Promise.resolve([] as Response[]),
    _name: name,
  });

  // @ts-expect-error — partial CacheStorage polyfill for tests
  globalThis.caches = {
    open: (name: string) => {
      if (!memCache.has(name)) memCache.set(name, new Map());
      return Promise.resolve(makeCache(name));
    },
    has: (name: string) => Promise.resolve(memCache.has(name)),
    delete: (name: string) => { memCache.delete(name); return Promise.resolve(true as boolean); },
    keys: () => Promise.resolve([] as string[]),
    match: (_req: RequestInfo) => Promise.resolve(undefined as Response | undefined),
  };
}
