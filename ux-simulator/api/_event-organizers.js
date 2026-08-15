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

  const { event_id, organizer_id } = req.query;

  try {
    if (req.method === 'GET') {
      const rows = event_id
        ? await db`SELECT eo.*, o.name AS organizer_name FROM event_organizers eo JOIN organizers o ON o.id = eo.organizer_id WHERE eo.event_id = ${Number(event_id)}`
        : await db`SELECT eo.*, o.name AS organizer_name FROM event_organizers eo JOIN organizers o ON o.id = eo.organizer_id`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { event_id: evId, organizer_id: orgId } = req.body;
      if (!evId || !orgId) return res.status(400).json({ error: 'event_id and organizer_id are required' });
      const ev = await db`SELECT id FROM events WHERE id = ${Number(evId)}`;
      if (!ev.length) return res.status(404).json({ error: 'Event not found' });
      const org = await db`SELECT id FROM organizers WHERE id = ${Number(orgId)}`;
      if (!org.length) return res.status(404).json({ error: 'Organizer not found' });
      await db`INSERT INTO event_organizers (event_id, organizer_id) VALUES (${Number(evId)}, ${Number(orgId)}) ON CONFLICT DO NOTHING`;
      return res.status(201).json({ event_id: Number(evId), organizer_id: Number(orgId) });
    }

    if (req.method === 'DELETE') {
      if (!event_id || !organizer_id) return res.status(400).json({ error: 'event_id and organizer_id query params required' });
      await db`DELETE FROM event_organizers WHERE event_id = ${Number(event_id)} AND organizer_id = ${Number(organizer_id)}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
