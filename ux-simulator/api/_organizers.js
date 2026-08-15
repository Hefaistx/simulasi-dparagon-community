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

  const { id, status: statusFilter } = req.query;

  try {
    if (req.method === 'GET') {
      const rows = statusFilter
        ? await db`SELECT * FROM organizers WHERE status = ${statusFilter} ORDER BY id`
        : await db`SELECT * FROM organizers ORDER BY id`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { name, description, email, phone, website, pic, notes, submitted_at } = req.body;
      if (!name) return res.status(400).json({ error: 'name is required' });
      const [row] = await db`
        INSERT INTO organizers (name, description, email, phone, website, pic, status, notes, submitted_at)
        VALUES (${name}, ${description ?? null}, ${email ?? null}, ${phone ?? null}, ${website ?? null}, ${pic ?? null}, 'pending', ${notes ?? null}, ${submitted_at ?? null})
        RETURNING *`;
      return res.status(201).json(row);
    }

    if (req.method === 'PATCH' && id) {
      const { name, description, email, phone, website, pic, status, notes } = req.body;
      const [row] = await db`
        UPDATE organizers SET
          name = COALESCE(${name ?? null}, name),
          description = COALESCE(${description ?? null}, description),
          email = COALESCE(${email ?? null}, email),
          phone = COALESCE(${phone ?? null}, phone),
          website = COALESCE(${website ?? null}, website),
          pic = COALESCE(${pic ?? null}, pic),
          status = COALESCE(${status ?? null}, status),
          notes = COALESCE(${notes ?? null}, notes)
        WHERE id = ${Number(id)}
        RETURNING *`;
      if (!row) return res.status(404).json({ error: 'Organizer not found' });
      return res.status(200).json(row);
    }

    if (req.method === 'DELETE' && id) {
      await db`DELETE FROM organizers WHERE id = ${Number(id)}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
