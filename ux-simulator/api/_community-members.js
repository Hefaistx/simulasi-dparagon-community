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

  const { id, community_id } = req.query;

  try {
    if (req.method === 'GET') {
      if (community_id) {
        const rows = await db`
          SELECT cm.*, u.name AS user_name, u.email AS user_email
          FROM community_members cm
          LEFT JOIN users u ON u.id = cm.user_id
          WHERE cm.community_id = ${Number(community_id)}
          ORDER BY cm.id`;
        return res.status(200).json(rows);
      }
      const rows = await db`SELECT * FROM community_members ORDER BY id`;
      return res.status(200).json(rows);
    }

    // POST: join community
    if (req.method === 'POST') {
      const { community_id: cId, user_id } = req.body;
      if (!cId || !user_id) return res.status(400).json({ error: 'community_id and user_id are required' });
      const [row] = await db`
        INSERT INTO community_members (community_id, user_id, status)
        VALUES (${cId}, ${user_id}, 'active')
        ON CONFLICT (community_id, user_id) DO UPDATE SET status = 'active'
        RETURNING *`;
      return res.status(201).json(row);
    }

    // PATCH: update status (leave)
    if (req.method === 'PATCH' && id) {
      const { status } = req.body;
      const [row] = await db`UPDATE community_members SET status = ${status} WHERE id = ${Number(id)} RETURNING *`;
      if (!row) return res.status(404).json({ error: 'Member not found' });
      return res.status(200).json(row);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
