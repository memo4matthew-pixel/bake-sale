// Public actions anyone on the site can do.
import { mutate, readBody, text, number, newId, findItem, period } from './_lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const b = readBody(req);
  try {
    const { state, extra } = await mutate((s) => {
      switch (b.action) {
        case 'addItem': {
          if (s.items.length >= 100) throw new Error('Too many items on the list.');
          const item = {
            id: newId(),
            name: text(b.name, 60, 'Item name'),
            price: number(b.price, { min: 0, max: 1000, label: 'Price' }),
            stock: number(b.stock, { min: 0, max: 5000, int: true, label: 'Quantity' }),
            sold: 0,
          };
          s.items.push(item);
          return { id: item.id };
        }
        case 'undoAdd': {
          const it = findItem(s, b.id);
          if (it.sold > 0) throw new Error(`"${it.name}" already has sales, so it can't be undone. Ask a moderator.`);
          s.items = s.items.filter((x) => x.id !== it.id);
          return { removed: it.name };
        }
        case 'sell': {
          const it = findItem(s, b.id);
          if (it.stock <= 0) throw new Error(`"${it.name}" is sold out.`);
          it.stock -= 1;
          it.sold += 1;
          s.total = Math.round((s.total + it.price) * 100) / 100;
          return {};
        }
        case 'addVolunteer': {
          const p = period(b.period);
          if (s.periods[p].length >= 30) throw new Error('That period is full.');
          const v = { id: newId(), name: text(b.name, 40, 'Name') };
          s.periods[p].push(v);
          return { id: v.id };
        }
        case 'removeVolunteer': {
          const p = period(b.period);
          s.periods[p] = s.periods[p].filter((v) => v.id !== b.id);
          return {};
        }
        default:
          throw new Error('Unknown action.');
      }
    });
    res.status(200).json({ ok: true, state, ...extra });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
