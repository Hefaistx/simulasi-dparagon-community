import { sql, createTables, seedIfEmpty } from './_db.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = sql();
  await createTables();
  await seedIfEmpty();

  const { id, email } = req.query;

  try {
    if (req.method === 'GET') {
      if (email) {
        const [row] = await db`SELECT * FROM users WHERE email = ${email}`;
        return res.status(200).json(row ?? null);
      }
      if (id) {
        const [row] = await db`SELECT * FROM users WHERE id = ${Number(id)}`;
        return res.status(200).json(row ?? null);
      }
      const rows = await db`SELECT * FROM users ORDER BY id`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { name, email: pEmail, phone, city } = req.body;
      if (!name || !pEmail) return res.status(400).json({ error: 'name and email are required' });
      const [row] = await db`
        INSERT INTO users (name, email, phone, city)
        VALUES (${name}, ${pEmail}, ${phone ?? null}, ${city ?? null})
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(EXCLUDED.phone, users.phone), city = COALESCE(EXCLUDED.city, users.city)
        RETURNING *`;
      return res.status(201).json(row);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
