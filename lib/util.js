export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function truncate(str, n = 160) {
  if (!str) return '';
  const s = String(str).replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n) + '…' : s;
}

/** Pakistani mobile number normalizer: 03001234567 / 3001234567 / +923001234567 / 00923001234567 */
export function normalize(raw) {
  if (!raw) throw new HttpError(400, 'number is required');

  let d = String(raw).replace(/[^\d+]/g, '').replace(/^\+/, '');

  if (d.startsWith('0092')) d = d.slice(4);
  else if (d.startsWith('92') && d.length >= 12) d = d.slice(2);
  else if (d.startsWith('0')) d = d.slice(1);

  if (d.length !== 10) {
    throw new HttpError(400, 'invalid number — use 03XXXXXXXXX (11 digits)');
  }
  if (!/^3\d{9}$/.test(d)) {
    throw new HttpError(400, 'invalid prefix — only 030x–034x mobile numbers work');
  }

  return {
    local: '0' + d,          // 03001234567
    intl: '92' + d,          // 923001234567
    plus: '+92' + d,         // +923001234567
    msisdn: '92' + d,
  };
}

export function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 1e6) reject(new HttpError(413, 'body too large'));
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(Object.fromEntries(new URLSearchParams(data)));
      }
    });
    req.on('error', reject);
  });
}

export function clientIp(req) {
  const f = req.headers['x-forwarded-for'];
  if (typeof f === 'string' && f) return f.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
  }
