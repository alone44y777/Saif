import { ProxyAgent } from 'undici';

const raw = (process.env.PROXY_LIST || '')
  .split(/[\s,;\n]+/)
  .map((s) => s.trim())
  .filter(Boolean);

const agents = [];
for (const url of raw) {
  try {
    agents.push({ url, agent: new ProxyAgent(url) });
  } catch {
    /* ignore malformed proxy */
  }
}

let cursor = 0;

export const proxyCount = agents.length;

/** Round-robin proxy. Returns { url, agent } or null when no proxies configured. */
export function nextProxy() {
  if (!agents.length) return null;
  const p = agents[cursor++ % agents.length];
  return p;
}
