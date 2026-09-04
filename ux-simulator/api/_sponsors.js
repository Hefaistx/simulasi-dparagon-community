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
        ? await db`SELECT * FROM sponsors WHERE status = ${statusFilter} ORDER BY id`
        : await db`SELECT * FROM sponsors ORDER BY id`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { name, description, email, phone, website, pic, notes, submitted_at, sub_type, sponsorship_start, sponsorship_end, benefit, event_description, attachment, attachment_name } = req.body;
      if (!name) return res.status(400).json({ error: 'name is required' });
      const [row] = await db`
        INSERT INTO sponsors (name, description, email, phone, website, pic, status, notes, submitted_at, sub_type, sponsorship_start, sponsorship_end, benefit, event_description, attachment, attachment_name)
        VALUES (${name}, ${description ?? null}, ${email ?? null}, ${phone ?? null}, ${website ?? null}, ${pic ?? null}, 'pending', ${notes ?? null}, ${submitted_at ?? null}, ${sub_type ?? 'pengajuan'}, ${sponsorship_start ?? null}, ${sponsorship_end ?? null}, ${benefit ?? null}, ${event_description ?? null}, ${attachment ?? null}, ${attachment_name ?? null})
        RETURNING *`;
      return res.status(201).json(row);
    }

    if (req.method === 'PATCH' && id) {
      const { name, description, email, phone, website, pic, status, notes, sub_type, sponsorship_start, sponsorship_end, benefit, event_description, attachment, attachment_name } = req.body;
      const [row] = await db`
        UPDATE sponsors SET
          name = COALESCE(${name ?? null}, name),
          description = COALESCE(${description ?? null}, description),
          email = COALESCE(${email ?? null}, email),
          phone = COALESCE(${phone ?? null}, phone),
          website = COALESCE(${website ?? null}, website),
          pic = COALESCE(${pic ?? null}, pic),
          status = COALESCE(${status ?? null}, status),
          notes = COALESCE(${notes ?? null}, notes),
          sub_type = COALESCE(${sub_type ?? null}, sub_type),
          sponsorship_start = COALESCE(${sponsorship_start ?? null}, sponsorship_start),
          sponsorship_end = COALESCE(${sponsorship_end ?? null}, sponsorship_end),
          benefit = COALESCE(${benefit ?? null}, benefit),
          event_description = COALESCE(${event_description ?? null}, event_description),
          attachment = COALESCE(${attachment ?? null}, attachment),
          attachment_name = COALESCE(${attachment_name ?? null}, attachment_name),
          updated_at = NOW()
        WHERE id = ${Number(id)}
        RETURNING *`;
      if (!row) return res.status(404).json({ error: 'Sponsor not found' });
      return res.status(200).json(row);
    }

    if (req.method === 'DELETE' && id) {
      await db`DELETE FROM sponsors WHERE id = ${Number(id)}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
