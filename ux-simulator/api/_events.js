import { sql, createTables, seedIfEmpty } from './_db.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = sql();
  await createTables();
  await seedIfEmpty();

  const { id, action } = req.query;

  try {
    // GET /api/events or GET /api/events?id=X
    if (req.method === 'GET') {
      if (id) {
        const [event] = await db`
          SELECT e.*, v.name AS venue_name, ec.name AS kategori_name,
                 (SELECT COUNT(*) FROM participants p WHERE p.event_id = e.id) AS pendaftar
          FROM events e
          LEFT JOIN venues v ON v.id = e.venue_id
          LEFT JOIN event_categories ec ON ec.id = e.category_id
          WHERE e.id = ${Number(id)}`;
        if (!event) return res.status(404).json({ error: 'Event not found' });
        const organizers = await db`SELECT eo.*, o.name AS organizer_name FROM event_organizers eo JOIN organizers o ON o.id = eo.organizer_id WHERE eo.event_id = ${Number(id)}`;
        const sponsors = await db`SELECT es.*, s.name AS sponsor_name FROM event_sponsors es JOIN sponsors s ON s.id = es.sponsor_id WHERE es.event_id = ${Number(id)}`;
        const agenda = await db`SELECT * FROM event_agenda WHERE event_id = ${Number(id)} ORDER BY "order"`;
        return res.status(200).json({ ...event, organizers, sponsors, agenda });
      }
      const events = await db`
        SELECT e.*, v.name AS venue_name, ec.name AS kategori_name,
               (SELECT COUNT(*) FROM participants p WHERE p.event_id = e.id) AS pendaftar
        FROM events e
        LEFT JOIN venues v ON v.id = e.venue_id
        LEFT JOIN event_categories ec ON ec.id = e.category_id
        ORDER BY e.id`;
      return res.status(200).json(events);
    }

    // POST /api/events
    if (req.method === 'POST') {
      const { name, description, category_id, venue_id, status, start_date, end_date, start_time, end_time, quota, price, cover_image, community_id, facilities, rules } = req.body;
      if (!name) return res.status(400).json({ error: 'name is required' });
      const [event] = await db`
        INSERT INTO events (name, description, category_id, venue_id, status, start_date, end_date, start_time, end_time, quota, price, cover_image, community_id, facilities, rules)
        VALUES (${name}, ${description ?? null}, ${category_id ?? null}, ${venue_id ?? null}, ${status ?? 'Draft'}, ${start_date ?? null}, ${end_date ?? null}, ${start_time ?? null}, ${end_time ?? null}, ${quota ?? 0}, ${price ?? 0}, ${cover_image ?? null}, ${community_id ?? null}, ${JSON.stringify(facilities ?? [])}, ${JSON.stringify(rules ?? [])})
        RETURNING *`;
      return res.status(201).json(event);
    }

    // PATCH /api/events?id=X&action=status  →  update status only
    if (req.method === 'PATCH' && id && action === 'status') {
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: 'status is required' });
      const [event] = await db`UPDATE events SET status = ${status}, updated_at = NOW() WHERE id = ${Number(id)} RETURNING *`;
      if (!event) return res.status(404).json({ error: 'Event not found' });
      return res.status(200).json(event);
    }

    // PATCH /api/events?id=X&action=agenda  →  replace agenda for event
    if (req.method === 'PATCH' && id && action === 'agenda') {
      const { agenda } = req.body; // array of { time, activity, order }
      await db`DELETE FROM event_agenda WHERE event_id = ${Number(id)}`;
      const inserted = [];
      for (const a of agenda ?? []) {
        const [row] = await db`INSERT INTO event_agenda (event_id, time, activity, "order") VALUES (${Number(id)}, ${a.time ?? null}, ${a.activity ?? null}, ${a.order ?? 0}) RETURNING *`;
        inserted.push(row);
      }
      return res.status(200).json(inserted);
    }

    // PATCH /api/events?id=X  →  update event data
    if (req.method === 'PATCH' && id) {
      const { name, description, category_id, venue_id, status, start_date, end_date, start_time, end_time, quota, price, cover_image, community_id, facilities, rules } = req.body;
      const [event] = await db`
        UPDATE events SET
          name = COALESCE(${name ?? null}, name),
          description = COALESCE(${description ?? null}, description),
          category_id = COALESCE(${category_id ?? null}, category_id),
          venue_id = COALESCE(${venue_id ?? null}, venue_id),
          status = COALESCE(${status ?? null}, status),
          start_date = COALESCE(${start_date ?? null}, start_date),
          end_date = COALESCE(${end_date ?? null}, end_date),
          start_time = COALESCE(${start_time ?? null}, start_time),
          end_time = COALESCE(${end_time ?? null}, end_time),
          quota = COALESCE(${quota ?? null}, quota),
          price = COALESCE(${price ?? null}, price),
          cover_image = COALESCE(${cover_image ?? null}, cover_image),
          community_id = COALESCE(${community_id ?? null}, community_id),
          facilities = COALESCE(${facilities !== undefined ? JSON.stringify(facilities) : null}::jsonb, facilities),
          rules = COALESCE(${rules !== undefined ? JSON.stringify(rules) : null}::jsonb, rules),
          updated_at = NOW()
        WHERE id = ${Number(id)}
        RETURNING *`;
      if (!event) return res.status(404).json({ error: 'Event not found' });
      return res.status(200).json(event);
    }

    // DELETE /api/events?id=X
    if (req.method === 'DELETE' && id) {
      await db`DELETE FROM events WHERE id = ${Number(id)}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
