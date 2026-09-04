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
      if (id) {
        const [c] = await db`
          SELECT c.*, cc.name AS kategori_name,
                 (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id AND cm.status = 'active') AS jumlah_member
          FROM communities c
          LEFT JOIN community_categories cc ON cc.id = c.category_id
          WHERE c.id = ${Number(id)}`;
        if (!c) return res.status(404).json({ error: 'Community not found' });
        return res.status(200).json(c);
      }
      const rows = statusFilter
        ? await db`SELECT c.*, cc.name AS kategori_name, (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id AND cm.status = 'active') AS jumlah_member FROM communities c LEFT JOIN community_categories cc ON cc.id = c.category_id WHERE c.status = ${statusFilter} ORDER BY c.id`
        : await db`SELECT c.*, cc.name AS kategori_name, (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id AND cm.status = 'active') AS jumlah_member FROM communities c LEFT JOIN community_categories cc ON cc.id = c.category_id ORDER BY c.id`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { name, description, category_id, type, city, status, wa_link, admin, cover_image, rules, pic_name, pic_email, pic_phone, notes, submitted_at } = req.body;
      if (!name) return res.status(400).json({ error: 'name is required' });
      const VALID_STATUS = ['active', 'inactive', 'pending'];
      const safeStatus = VALID_STATUS.includes(status) ? status : 'pending';
      const [row] = await db`
        INSERT INTO communities (name, description, category_id, type, city, status, wa_link, admin, cover_image, rules, pic_name, pic_email, pic_phone, notes, submitted_at)
        VALUES (${name}, ${description ?? null}, ${category_id ?? null}, ${type ?? null}, ${city ?? null}, ${safeStatus}, ${wa_link ?? null}, ${admin ?? null}, ${cover_image ?? null}, ${JSON.stringify(rules ?? [])}, ${pic_name ?? null}, ${pic_email ?? null}, ${pic_phone ?? null}, ${notes ?? null}, ${submitted_at ?? null})
        RETURNING *`;
      return res.status(201).json(row);
    }

    if (req.method === 'PATCH' && id) {
      const { name, description, category_id, type, city, status, wa_link, admin, cover_image, rules, pic_name, pic_email, pic_phone, notes } = req.body;
      const [row] = await db`
        UPDATE communities SET
          name = COALESCE(${name ?? null}, name),
          description = COALESCE(${description ?? null}, description),
          category_id = COALESCE(${category_id ?? null}, category_id),
          type = COALESCE(${type ?? null}, type),
          city = COALESCE(${city ?? null}, city),
          status = COALESCE(${status ?? null}, status),
          wa_link = COALESCE(${wa_link ?? null}, wa_link),
          admin = COALESCE(${admin ?? null}, admin),
          cover_image = COALESCE(${cover_image ?? null}, cover_image),
          rules = COALESCE(${rules !== undefined ? JSON.stringify(rules) : null}::jsonb, rules),
          pic_name = COALESCE(${pic_name ?? null}, pic_name),
          pic_email = COALESCE(${pic_email ?? null}, pic_email),
          pic_phone = COALESCE(${pic_phone ?? null}, pic_phone),
          notes = COALESCE(${notes ?? null}, notes),
          updated_at = NOW()
        WHERE id = ${Number(id)}
        RETURNING *`;
      if (!row) return res.status(404).json({ error: 'Community not found' });
      return res.status(200).json(row);
    }

    if (req.method === 'DELETE' && id) {
      await db`DELETE FROM communities WHERE id = ${Number(id)}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
