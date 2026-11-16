import { load, hasDb } from './_lib/store.js';

export default async function handler(req, res) {
  try {
    const state = await load();
    res.status(200).json({ state, dbConnected: hasDb });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
