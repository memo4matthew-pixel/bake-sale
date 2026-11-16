// Shared storage for the bake sale.
// Uses Upstash Redis (add it in Vercel: Storage -> Upstash for Redis -> Connect to project).
// Without a database it falls back to memory, which is fine for testing but resets often.
import { randomUUID } from 'node:crypto';

const DB_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const DB_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'bakesale:state';
const LOCK = 'bakesale:lock';

export const hasDb = Boolean(DB_URL && DB_TOKEN);
export const newId = () => randomUUID();

export function defaultState() {
  return {
    date: '',
    lockbox: '710',
    goal: 200,
    total: 0,
    items: [],
    periods: [[], [], [], [], [], []],
    updatedAt: Date.now(),
  };
}

let memory = null;

async function redis(command) {
  const r = await fetch(DB_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${DB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const j = await r.json();
  if (j.error) throw new Error('Database error: ' + j.error);
  return j.result;
}

export async function load() {
  if (!hasDb) return structuredClone(memory ?? (memory = defaultState()));
  const raw = await redis(['GET', KEY]);
  const base = defaultState();
  if (!raw) return base;
  const s = { ...base, ...JSON.parse(raw) };
  if (!Array.isArray(s.periods) || s.periods.length !== 6) s.periods = base.periods;
  return s;
}

async function save(s) {
  s.updatedAt = Date.now();
  if (!hasDb) { memory = structuredClone(s); return; }
  await redis(['SET', KEY, JSON.stringify(s)]);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Load -> change -> save, with a short lock so two people pressing "minus"
// at the same moment don't overwrite each other.
export async function mutate(fn) {
  const token = newId();
  let locked = !hasDb;
  for (let i = 0; i < 40 && !locked; i++) {
    locked = (await redis(['SET', LOCK, token, 'NX', 'PX', '4000'])) === 'OK';
    if (!locked) await sleep(75);
  }
  if (!locked) throw new Error('The site is busy, try again.');
  try {
    const s = await load();
    const extra = fn(s) || {};
    await save(s);
    return { state: s, extra };
  } finally {
    if (hasDb) {
      const holder = await redis(['GET', LOCK]);
      if (holder === token) await redis(['DEL', LOCK]);
    }
  }
}

// ---- input helpers ----
export function text(v, max, label) {
  const s = String(v ?? '').trim().replace(/\s+/g, ' ');
  if (!s) throw new Error(`${label} is required.`);
  if (s.length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
  return s;
}

export function number(v, { min = 0, max = 100000, int = false, label = 'Value' } = {}) {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`${label} must be a number.`);
  if (int && !Number.isInteger(n)) throw new Error(`${label} must be a whole number.`);
  if (n < min || n > max) throw new Error(`${label} must be between ${min} and ${max}.`);
  return int ? n : Math.round(n * 100) / 100;
}

export function readBody(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === 'string') { try { return JSON.parse(b); } catch { return {}; } }
  return b;
}

export function findItem(s, id) {
  const it = s.items.find((x) => x.id === id);
  if (!it) throw new Error('That item no longer exists.');
  return it;
}

export function period(p) {
  const n = Number(p);
  if (!Number.isInteger(n) || n < 0 || n > 5) throw new Error('Pick a period from 1st to 6th.');
  return n;
}
