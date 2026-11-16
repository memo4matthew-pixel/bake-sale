// Moderator actions. The password is checked here on the server, never in the browser.
// Change it in Vercel with the MOD_PASSWORD environment variable.
import { mutate, load, readBody, text, number, findItem, period } from './_lib/store.js';

const PASSWORD = process.env.MOD_PASSWORD || 'perezsux';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const b = readBody(req);
  if (String(b.password ?? '') !== PASSWORD) {
    return res.status(401).json({ error: 'Wrong moderator password.' });
  }
  try {
    if (b.action === 'login') return res.status(200).json({ ok: true, state: await load() });

    const { state } = await mutate((s) => {
      switch (b.action) {
        case 'setInfo': {
          const date = String(b.date ?? '').trim();
          if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Pick a valid date.');
          s.date = date;
          s.lockbox = text(b.lockbox, 20, 'Lockbox code');
          s.goal = number(b.goal, { min: 1, max: 100000, label: 'Goal' });
          return;
        }
        case 'setTotal':
          s.total = number(b.total, { min: 0, max: 100000, label: 'Money total' });
          return;
        case 'recalcTotal':
          s.total = Math.round(s.items.reduce((sum, it) => sum + it.sold * it.price, 0) * 100) / 100;
          return;
        case 'setItem': {
          const it = findItem(s, b.id);
          it.name = text(b.name, 60, 'Item name');
          it.price = number(b.price, { min: 0, max: 1000, label: 'Price' });
          it.stock = number(b.stock, { min: 0, max: 5000, int: true, label: 'Left in stock' });
          it.sold = number(b.sold, { min: 0, max: 5000, int: true, label: 'Sold' });
          return;
        }
        case 'deleteItem':
          findItem(s, b.id);
          s.items = s.items.filter((x) => x.id !== b.id);
          return;
        case 'removeVolunteer': {
          const p = period(b.period);
          s.periods[p] = s.periods[p].filter((v) => v.id !== b.id);
          return;
        }
        default:
          throw new Error('Unknown action.');
      }
    });
    res.status(200).json({ ok: true, state });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
