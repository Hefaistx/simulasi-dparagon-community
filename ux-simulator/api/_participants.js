import { sql, createTables, seedIfEmpty } from './_db.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = sql();
  await createTables();
  await seedIfEmpty();

  const { id, event_id, email } = req.query;

  try {
    if (req.method === 'GET') {
      let rows;
      if (event_id) {
        rows = await db`SELECT p.*, e.name AS event_name FROM participants p LEFT JOIN events e ON e.id = p.event_id WHERE p.event_id = ${Number(event_id)} ORDER BY p.id`;
      } else if (email) {
        rows = await db`SELECT p.*, e.name AS event_name, e.start_date, e.cover_image, v.name AS venue_name
          FROM participants p
          LEFT JOIN events e ON e.id = p.event_id
          LEFT JOIN venues v ON v.id = e.venue_id
          WHERE p.email = ${email} ORDER BY p.id`;
      } else {
        rows = await db`SELECT p.*, e.name AS event_name FROM participants p LEFT JOIN events e ON e.id = p.event_id ORDER BY p.id`;
      }
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { user_id, name, email: pEmail, phone, event_id: evId, payment_status, price } = req.body;
      if (!name || !pEmail || !evId) return res.status(400).json({ error: 'name, email, event_id are required' });

      // Check quota
      const [event] = await db`SELECT quota FROM events WHERE id = ${Number(evId)}`;
      if (!event) return res.status(404).json({ error: 'Event not found' });
      const [{ count }] = await db`SELECT COUNT(*) FROM participants WHERE event_id = ${Number(evId)}`;
      if (event.quota > 0 && Number(count) >= event.quota) {
        return res.status(409).json({ error: 'Kuota penuh' });
      }

      // Check duplicate
      const existing = await db`SELECT id FROM participants WHERE event_id = ${Number(evId)} AND email = ${pEmail}`;
      if (existing.length > 0) return res.status(409).json({ error: 'Sudah terdaftar di event ini' });

      const [row] = await db`
        INSERT INTO participants (user_id, name, email, phone, event_id, payment_status, price)
        VALUES (${user_id ?? null}, ${name}, ${pEmail}, ${phone ?? null}, ${Number(evId)}, ${payment_status ?? 'Pending'}, ${price ?? 0})
        RETURNING *`;
      return res.status(201).json(row);
    }

    if (req.method === 'PATCH' && id) {
      const { payment_status, checkin_status } = req.body;
      const [row] = await db`
        UPDATE participants SET
          payment_status = COALESCE(${payment_status ?? null}, payment_status),
          checkin_status = COALESCE(${checkin_status ?? null}, checkin_status)
        WHERE id = ${Number(id)}
        RETURNING *`;
      if (!row) return res.status(404).json({ error: 'Participant not found' });
      return res.status(200).json(row);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
