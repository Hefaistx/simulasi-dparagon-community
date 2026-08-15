import { sql, createTables, seed } from './_db.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const secret = req.headers['x-seed-secret'] ?? req.query.secret;
  const expected = process.env.SEED_SECRET;
  if (!expected || secret !== expected) {
    return res.status(403).json({ error: 'Forbidden — SEED_SECRET mismatch' });
  }

  try {
    const db = sql();
    await createTables();

    // Wipe all data and re-seed
    await db`TRUNCATE banners, reviews, story_images, stories, participants, event_agenda, event_sponsors, event_organizers, events, sponsors, organizers, community_members, communities, users, venues, event_categories, community_categories RESTART IDENTITY CASCADE`;
    await seed(db);

    return res.status(200).json({ ok: true, message: 'Seeded successfully' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
