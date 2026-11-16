// Shared helpers for every page.
const $ = (sel, el = document) => el.querySelector(sel);

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const money = (n) => '$' + Number(n || 0).toFixed(2);

async function api(path, body) {
  const opts = body
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : { cache: 'no-store' };
  const r = await fetch(path, opts);
  const j = await r.json().catch(() => ({ error: 'The server sent a bad response.' }));
  if (!r.ok || j.error) throw new Error(j.error || 'Request failed.');
  return j;
}

const act = (body) => api('/api/action', body);

function fmtDate(d) {
  if (!d) return 'Date to be announced';
  const [y, m, day] = d.split('-').map(Number);
  if (!y || !m || !day) return d;
  return new Date(y, m - 1, day).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

let toastTimer;
function toast(msg, bad = false) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'show' + (bad ? ' bad' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = bad ? 'bad' : ''), 2800);
}

// Remember things this device added (for undo / removing your own sign-up).
function mine(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function setMine(key, list) {
  try { localStorage.setItem(key, JSON.stringify(list.slice(-200))); } catch {}
}

// Refresh every few seconds so everyone sees the same numbers.
function poll(fn, ms = 4000) {
  const run = () => fn().catch(() => {});
  run();
  setInterval(() => { if (!document.hidden) run(); }, ms);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) run(); });
}

function dbBanner(connected) {
  if (connected || $('#dbwarn')) return;
  const w = document.createElement('div');
  w.id = 'dbwarn';
  w.className = 'warn';
  w.innerHTML = '<b>No database connected yet.</b> Changes are only kept temporarily. In Vercel, add <i>Storage → Upstash for Redis</i> to this project, then redeploy.';
  $('main').prepend(w);
}
