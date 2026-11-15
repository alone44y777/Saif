<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Pak SMS Bomber — Devp Sardar Daud Arain</title>
<style>
  :root{
    --bg:#07090d; --panel:#0d1117; --line:#1c2530; --txt:#d7e2ee;
    --dim:#6b7c8f; --acc:#00e6a0; --warn:#ffb02e; --bad:#ff4d5e;
  }
  *{box-sizing:border-box}
  body{
    margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
    background:radial-gradient(900px 500px at 50% -10%,#0f2a24,#07090d 60%);
    color:var(--txt);min-height:100vh;padding:28px 16px 60px;
  }
  .wrap{max-width:940px;margin:0 auto}
  header{text-align:center;margin-bottom:26px}
  h1{font-size:clamp(20px,4vw,32px);letter-spacing:2px;margin:0 0 8px;
     background:linear-gradient(90deg,var(--acc),#4ea8ff);-webkit-background-clip:text;color:transparent}
  .sub{color:var(--dim);font-size:12px;letter-spacing:1px}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:18px;margin-bottom:16px}
  .grid{display:grid;grid-template-columns:1fr 130px;gap:10px}
  input,select,button{font:inherit;padding:12px;border-radius:9px;border:1px solid var(--line);background:#0a0f15;color:var(--txt);width:100%}
  input:focus{outline:1px solid var(--acc)}
  button{background:linear-gradient(90deg,#00b37e,#0077ff);border:0;font-weight:700;cursor:pointer;letter-spacing:1px}
  button:disabled{opacity:.5;cursor:not-allowed}
  .row{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;align-items:center;font-size:12px;color:var(--dim)}
  .chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
  .chip{font-size:11px;padding:4px 8px;border:1px solid var(--line);border-radius:20px;color:var(--dim)}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th,td{text-align:left;padding:7px 6px;border-bottom:1px solid var(--line);vertical-align:top}
  th{color:var(--dim);font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:1px}
  .sent{color:var(--acc)} .throttled{color:var(--warn)} .failed{color:var(--bad)} .skipped{color:var(--dim)}
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-top:12px}
  .stat{background:#0a0f15;border:1px solid var(--line);border-radius:9px;padding:10px;text-align:center}
  .stat b{display:block;font-size:18px}
  footer{text-align:center;color:var(--dim);font-size:11px;margin-top:26px;line-height:1.8}
  a{color:var(--acc)}
  .err{color:var(--bad);font-size:12px;margin-top:10px}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>PAK SMS BOMBER</h1>
    <div class="sub">11 OTP GATEWAYS · SERVERLESS · DEV SARDAR DAUD ARAIN</div>
  </header>

  <div class="card">
    <div class="grid">
      <input id="num" placeholder="03XXXXXXXXX" value="03001234567" inputmode="numeric" />
      <input id="amt" type="number" min="1" max="200" value="11" />
    </div>
    <div class="row">
      <label><input type="checkbox" id="dry" style="width:auto" /> dry run</label>
      <label>gap (s) <input id="gap" type="number" min="0" max="120" value="20" style="width:70px;padding:5px" /></label>
      <button id="go" style="width:auto;padding:10px 22px">FIRE</button>
    </div>
    <div class="chips" id="chips"></div>
    <div class="err" id="err"></div>
  </div>

  <div class="card" id="outCard" style="display:none">
    <div class="stats" id="stats"></div>
    <table><thead><tr><th>#</th><th>Gateway</th><th>Status</th><th>HTTP</th><th>ms</th><th>Note</th></tr></thead>
    <tbody id="rows"></tbody></table>
  </div>

  <footer>
    Devp <b>Sardar Daud Arain</b> · Power By <b>Dark Empire</b><br />
    GET /api/send?number=03XXXXXXXXX&amp;amount=11&amp;format=json
  </footer>
</div>

<script>
const $ = (id) => document.getElementById(id);
let endpoints = [];

fetch('/api/endpoints').then(r => r.json()).then(d => {
  endpoints = d.endpoints || [];
  $('chips').innerHTML = endpoints.map(e => `<span class="chip">#${e.id} ${e.name}</span>`).join('');
});

$('go').onclick = async () => {
  const number = $('num').value.trim();
  const amount = $('amt').value;
  $('err').textContent = '';
  $('go').disabled = true;
  $('go').textContent = 'FIRING…';
  $('outCard').style.display = 'none';

  try {
    const url = `/api/send?number=${encodeURIComponent(number)}&amount=${amount}&gap=${$('gap').value}${$('dry').checked ? '&dry=1' : ''}`;
    const res = await fetch(url);
    const d = await res.json();
    if (!d.ok) throw new Error(d.error || 'request failed');

    $('outCard').style.display = 'block';
    $('stats').innerHTML = `
      <div class="stat"><b class="sent">${d.success_count ?? 0}</b>sent</div>
      <div class="stat"><b class="throttled">${d.throttled_count ?? 0}</b>throttled</div>
      <div class="stat"><b class="failed">${d.fail_count ?? 0}</b>failed</div>
      <div class="stat"><b>${d.duration_ms ?? 0}ms</b>duration</div>
      <div class="stat"><b>${d.amount_dispatched ?? d.planned_total ?? 0}</b>dispatched</div>`;

    const rows = d.results || (d.plan || []).flatMap((p, i) =>
      p.endpoints.map(n => ({ name: n, status: 'skipped', http: '-', ms: '-', note: 'round ' + i })));
    $('rows').innerHTML = rows.map((r, i) =>
      `<tr><td>${i + 1}</td><td>${r.name}</td><td class="${r.status}">${r.status}</td>
       <td>${r.http}</td><td>${r.ms}</td><td>${(r.note || '').slice(0, 90)}</td></tr>`).join('');
    if (d.advice) $('err').textContent = d.advice;
  } catch (e) {
    $('err').textContent = e.message;
  } finally {
    $('go').disabled = false;
    $('go').textContent = 'FIRE';
  }
};
</script>
</body>
</html>
