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
        const [story] = await db`SELECT * FROM stories WHERE id = ${Number(id)}`;
        if (!story) return res.status(404).json({ error: 'Story not found' });
        const images = await db`SELECT * FROM story_images WHERE story_id = ${Number(id)} ORDER BY "order"`;
        return res.status(200).json({ ...story, images });
      }
      const rows = statusFilter
        ? await db`SELECT s.*, e.name AS event_name, c.name AS community_name FROM stories s LEFT JOIN events e ON e.id = s.event_id LEFT JOIN communities c ON c.id = s.community_id WHERE s.status = ${statusFilter} ORDER BY s.id`
        : await db`SELECT s.*, e.name AS event_name, c.name AS community_name FROM stories s LEFT JOIN events e ON e.id = s.event_id LEFT JOIN communities c ON c.id = s.community_id ORDER BY s.id`;
      const images = await db`SELECT * FROM story_images ORDER BY story_id, "order"`;
      return res.status(200).json(rows.map((s) => ({ ...s, images: images.filter((i) => i.story_id === s.id) })));
    }

    if (req.method === 'POST') {
      const { title, type, event_id, community_id, category, tags, cover_image, content, author, published_at, publish_end_date, submitter_email, submitter_phone, status, images } = req.body;
      if (!title) return res.status(400).json({ error: 'title is required' });
      const [story] = await db`
        INSERT INTO stories (title, type, event_id, community_id, category, tags, cover_image, content, author, published_at, publish_end_date, submitter_email, submitter_phone, status)
        VALUES (${title}, ${type ?? 'general'}, ${event_id ?? null}, ${community_id ?? null}, ${category ?? null}, ${JSON.stringify(tags ?? [])}, ${cover_image ?? null}, ${content ?? null}, ${author ?? null}, ${published_at ?? null}, ${publish_end_date ?? null}, ${submitter_email ?? null}, ${submitter_phone ?? null}, ${status ?? 'draft'})
        RETURNING *`;
      const savedImages = [];
      for (const [i, img] of (images ?? []).entries()) {
        const [row] = await db`INSERT INTO story_images (story_id, image_url, "order") VALUES (${story.id}, ${img.url ?? img}, ${i}) RETURNING *`;
        savedImages.push(row);
      }
      return res.status(201).json({ ...story, images: savedImages });
    }

    if (req.method === 'PATCH' && id) {
      const { title, type, event_id, community_id, category, tags, cover_image, content, author, published_at, publish_end_date, submitter_email, submitter_phone, status, images } = req.body;
      const [story] = await db`
        UPDATE stories SET
          title = COALESCE(${title ?? null}, title),
          type = COALESCE(${type ?? null}, type),
          event_id = COALESCE(${event_id ?? null}, event_id),
          community_id = COALESCE(${community_id ?? null}, community_id),
          category = COALESCE(${category ?? null}, category),
          tags = COALESCE(${tags !== undefined ? JSON.stringify(tags) : null}::jsonb, tags),
          cover_image = COALESCE(${cover_image ?? null}, cover_image),
          content = COALESCE(${content ?? null}, content),
          author = COALESCE(${author ?? null}, author),
          published_at = COALESCE(${published_at ?? null}, published_at),
          publish_end_date = COALESCE(${publish_end_date ?? null}, publish_end_date),
          submitter_email = COALESCE(${submitter_email ?? null}, submitter_email),
          submitter_phone = COALESCE(${submitter_phone ?? null}, submitter_phone),
          status = COALESCE(${status ?? null}, status)
        WHERE id = ${Number(id)}
        RETURNING *`;
      if (!story) return res.status(404).json({ error: 'Story not found' });
      if (images !== undefined) {
        await db`DELETE FROM story_images WHERE story_id = ${Number(id)}`;
        for (const [i, img] of images.entries()) {
          await db`INSERT INTO story_images (story_id, image_url, "order") VALUES (${Number(id)}, ${img.url ?? img}, ${i})`;
        }
      }
      const savedImages = await db`SELECT * FROM story_images WHERE story_id = ${Number(id)} ORDER BY "order"`;
      return res.status(200).json({ ...story, images: savedImages });
    }

    if (req.method === 'DELETE' && id) {
      await db`DELETE FROM stories WHERE id = ${Number(id)}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
