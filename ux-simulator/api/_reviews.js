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

  const { id, event_id, status: statusFilter } = req.query;

  try {
    if (req.method === 'GET') {
      let rows;
      if (event_id) {
        rows = statusFilter
          ? await db`SELECT r.*, u.name AS user_name FROM reviews r LEFT JOIN users u ON u.id = r.user_id WHERE r.event_id = ${Number(event_id)} AND r.status = ${statusFilter} ORDER BY r.id`
          : await db`SELECT r.*, u.name AS user_name FROM reviews r LEFT JOIN users u ON u.id = r.user_id WHERE r.event_id = ${Number(event_id)} ORDER BY r.id`;
      } else {
        rows = await db`SELECT r.*, u.name AS user_name, u.email AS user_email FROM reviews r LEFT JOIN users u ON u.id = r.user_id ORDER BY r.id`;
      }
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { event_id: evId, user_id, rating, comment } = req.body;
      if (!evId || !rating) return res.status(400).json({ error: 'event_id and rating are required' });
      const [row] = await db`
        INSERT INTO reviews (event_id, user_id, rating, comment, status)
        VALUES (${evId}, ${user_id ?? null}, ${rating}, ${comment ?? null}, 'pending')
        RETURNING *`;
      return res.status(201).json(row);
    }

    if (req.method === 'PATCH' && id) {
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: 'status is required' });
      const [row] = await db`UPDATE reviews SET status = ${status} WHERE id = ${Number(id)} RETURNING *`;
      if (!row) return res.status(404).json({ error: 'Review not found' });
      return res.status(200).json(row);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
