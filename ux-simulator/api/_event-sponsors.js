import { sql, createTables, seedIfEmpty } from './_db.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = sql();
  await createTables();
  await seedIfEmpty();

  const { event_id, sponsor_id } = req.query;

  try {
    if (req.method === 'GET') {
      const rows = event_id
        ? await db`SELECT es.*, s.name AS sponsor_name FROM event_sponsors es JOIN sponsors s ON s.id = es.sponsor_id WHERE es.event_id = ${Number(event_id)}`
        : await db`SELECT es.*, s.name AS sponsor_name FROM event_sponsors es JOIN sponsors s ON s.id = es.sponsor_id`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { event_id: evId, sponsor_id: spId } = req.body;
      if (!evId || !spId) return res.status(400).json({ error: 'event_id and sponsor_id are required' });
      const ev = await db`SELECT id FROM events WHERE id = ${Number(evId)}`;
      if (!ev.length) return res.status(404).json({ error: 'Event not found' });
      const sp = await db`SELECT id FROM sponsors WHERE id = ${Number(spId)}`;
      if (!sp.length) return res.status(404).json({ error: 'Sponsor not found' });
      await db`INSERT INTO event_sponsors (event_id, sponsor_id) VALUES (${Number(evId)}, ${Number(spId)}) ON CONFLICT DO NOTHING`;
      return res.status(201).json({ event_id: Number(evId), sponsor_id: Number(spId) });
    }

    if (req.method === 'DELETE') {
      if (!event_id || !sponsor_id) return res.status(400).json({ error: 'event_id and sponsor_id query params required' });
      await db`DELETE FROM event_sponsors WHERE event_id = ${Number(event_id)} AND sponsor_id = ${Number(sponsor_id)}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
