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

  // type = 'community-categories' | 'event-categories' | 'venues'
  const { type, id } = req.query;

  const tableMap = {
    'community-categories': 'community_categories',
    'event-categories': 'event_categories',
    'venues': 'venues',
  };
  const table = tableMap[type];
  if (!table) return res.status(400).json({ error: `type must be one of: ${Object.keys(tableMap).join(', ')}` });

  try {
    if (req.method === 'GET') {
      let rows;
      if (table === 'venues') {
        rows = id
          ? await db`SELECT * FROM venues WHERE id = ${Number(id)}`
          : await db`SELECT * FROM venues ORDER BY id`;
      } else if (table === 'community_categories') {
        rows = id
          ? await db`SELECT * FROM community_categories WHERE id = ${Number(id)}`
          : await db`SELECT * FROM community_categories ORDER BY id`;
      } else {
        rows = id
          ? await db`SELECT * FROM event_categories WHERE id = ${Number(id)}`
          : await db`SELECT * FROM event_categories ORDER BY id`;
      }
      return res.status(200).json(id ? rows[0] ?? null : rows);
    }

    if (req.method === 'POST') {
      const { name, description, address, capacity, city, maps_link } = req.body;
      if (!name) return res.status(400).json({ error: 'name is required' });
      let row;
      if (table === 'venues') {
        [row] = await db`INSERT INTO venues (name, address, capacity, city, maps_link) VALUES (${name}, ${address ?? null}, ${capacity ?? null}, ${city ?? null}, ${maps_link ?? null}) RETURNING *`;
      } else if (table === 'community_categories') {
        [row] = await db`INSERT INTO community_categories (name, description) VALUES (${name}, ${description ?? null}) RETURNING *`;
      } else {
        [row] = await db`INSERT INTO event_categories (name, description) VALUES (${name}, ${description ?? null}) RETURNING *`;
      }
      return res.status(201).json(row);
    }

    if (req.method === 'PATCH' && id) {
      const body = req.body;
      let row;
      if (table === 'venues') {
        [row] = await db`UPDATE venues SET name = COALESCE(${body.name ?? null}, name), address = COALESCE(${body.address ?? null}, address), capacity = COALESCE(${body.capacity ?? null}, capacity), city = ${body.city ?? null}, maps_link = COALESCE(${body.maps_link ?? null}, maps_link) WHERE id = ${Number(id)} RETURNING *`;
      } else if (table === 'community_categories') {
        [row] = await db`UPDATE community_categories SET name = COALESCE(${body.name ?? null}, name), description = COALESCE(${body.description ?? null}, description) WHERE id = ${Number(id)} RETURNING *`;
      } else {
        [row] = await db`UPDATE event_categories SET name = COALESCE(${body.name ?? null}, name), description = COALESCE(${body.description ?? null}, description) WHERE id = ${Number(id)} RETURNING *`;
      }
      if (!row) return res.status(404).json({ error: 'Record not found' });
      return res.status(200).json(row);
    }

    if (req.method === 'DELETE' && id) {
      if (table === 'venues') await db`DELETE FROM venues WHERE id = ${Number(id)}`;
      else if (table === 'community_categories') await db`DELETE FROM community_categories WHERE id = ${Number(id)}`;
      else await db`DELETE FROM event_categories WHERE id = ${Number(id)}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
