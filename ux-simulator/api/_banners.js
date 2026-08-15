import { sql, createTables, seedIfEmpty } from './_db.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function resolveBanner(db, b) {
  let title = '', image = '';
  if (b.type === 'event') {
    const [ev] = await db`SELECT name, cover_image FROM events WHERE id = ${b.info_id}`;
    title = ev?.name ?? ''; image = ev?.cover_image ?? '';
  } else if (b.type === 'story') {
    const [st] = await db`SELECT title, cover_image FROM stories WHERE id = ${b.info_id}`;
    title = st?.title ?? ''; image = st?.cover_image ?? '';
  } else if (b.type === 'community') {
    const [co] = await db`SELECT name, cover_image FROM communities WHERE id = ${b.info_id}`;
    title = co?.name ?? ''; image = co?.cover_image ?? '';
  }
  return { ...b, title, image };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = sql();
  await createTables();
  await seedIfEmpty();

  const { id, action } = req.query;

  try {
    if (req.method === 'GET') {
      const rows = await db`SELECT * FROM banners ORDER BY "order"`;
      const resolved = await Promise.all(rows.map((b) => resolveBanner(db, b)));
      return res.status(200).json(resolved);
    }

    if (req.method === 'POST') {
      const { type, info_id, status, order } = req.body;
      if (!type || !info_id) return res.status(400).json({ error: 'type and info_id are required' });
      const maxOrder = await db`SELECT COALESCE(MAX("order"), -1) + 1 AS next FROM banners`;
      const [row] = await db`
        INSERT INTO banners (type, info_id, status, "order")
        VALUES (${type}, ${info_id}, ${status ?? 'active'}, ${order ?? maxOrder[0].next})
        RETURNING *`;
      return res.status(201).json(await resolveBanner(db, row));
    }

    // PATCH /api/banners?action=reorder  →  body: [{ id, order }]
    if (req.method === 'PATCH' && action === 'reorder') {
      const { items } = req.body;
      for (const item of items ?? []) {
        await db`UPDATE banners SET "order" = ${item.order} WHERE id = ${item.id}`;
      }
      const rows = await db`SELECT * FROM banners ORDER BY "order"`;
      return res.status(200).json(await Promise.all(rows.map((b) => resolveBanner(db, b))));
    }

    // PATCH /api/banners?id=X  →  toggle status or update
    if (req.method === 'PATCH' && id) {
      const { status, order } = req.body;
      const [row] = await db`
        UPDATE banners SET
          status = COALESCE(${status ?? null}, status),
          "order" = COALESCE(${order ?? null}, "order")
        WHERE id = ${Number(id)}
        RETURNING *`;
      if (!row) return res.status(404).json({ error: 'Banner not found' });
      return res.status(200).json(await resolveBanner(db, row));
    }

    if (req.method === 'DELETE' && id) {
      await db`DELETE FROM banners WHERE id = ${Number(id)}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
