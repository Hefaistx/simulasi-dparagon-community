import { sql, createTables, seedIfEmpty } from './_db.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const db = sql();
    await createTables();
    await seedIfEmpty();

    const [
      events,
      communities,
      organizers,
      sponsors,
      stories,
      reviews,
      banners,
      kategoriKomunitas,
      kategoriEvent,
      venues,
      participants,
      agenda,
      eventOrganizers,
      eventSponsors,
      storyImages,
      communityMembers,
    ] = await Promise.all([
      db`SELECT e.*,
           v.name AS venue_name, v.address AS venue_address, v.city AS venue_city,
           ec.name AS kategori_name,
           c.name AS community_name,
           (SELECT COUNT(*) FROM participants p WHERE p.event_id = e.id) AS pendaftar
         FROM events e
         LEFT JOIN venues v ON v.id = e.venue_id
         LEFT JOIN event_categories ec ON ec.id = e.category_id
         LEFT JOIN communities c ON c.id = e.community_id
         ORDER BY e.id`,

      db`SELECT c.*,
           cc.name AS kategori_name,
           (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id AND cm.status = 'active') AS jumlah_member
         FROM communities c
         LEFT JOIN community_categories cc ON cc.id = c.category_id
         ORDER BY c.id`,

      db`SELECT * FROM organizers ORDER BY id`,

      db`SELECT * FROM sponsors ORDER BY id`,

      db`SELECT s.*,
           e.name AS event_name,
           co.name AS community_name
         FROM stories s
         LEFT JOIN events e ON e.id = s.event_id
         LEFT JOIN communities co ON co.id = s.community_id
         ORDER BY s.id`,

      db`SELECT r.*,
           u.name AS user_name, u.email AS user_email
         FROM reviews r
         LEFT JOIN users u ON u.id = r.user_id
         ORDER BY r.id`,

      db`SELECT b.* FROM banners b ORDER BY b."order"`,

      db`SELECT * FROM community_categories ORDER BY id`,

      db`SELECT * FROM event_categories ORDER BY id`,

      db`SELECT * FROM venues ORDER BY id`,

      db`SELECT p.*,
           e.name AS event_name
         FROM participants p
         LEFT JOIN events e ON e.id = p.event_id
         ORDER BY p.id`,

      db`SELECT * FROM event_agenda ORDER BY event_id, "order"`,

      db`SELECT eo.event_id, eo.organizer_id, o.name AS organizer_name
         FROM event_organizers eo
         JOIN organizers o ON o.id = eo.organizer_id`,

      db`SELECT es.event_id, es.sponsor_id, s.name AS sponsor_name
         FROM event_sponsors es
         JOIN sponsors s ON s.id = es.sponsor_id`,

      db`SELECT * FROM story_images ORDER BY story_id, "order"`,

      db`SELECT cm.*, u.email AS user_email, u.name AS user_name
         FROM community_members cm
         LEFT JOIN users u ON u.id = cm.user_id
         WHERE cm.status = 'active'`,
    ]);

    // Resolve banner titles and images
    const bannersResolved = await Promise.all(
      banners.map(async (b) => {
        let title = '', image = '';
        if (b.type === 'event') {
          const ev = events.find((e) => e.id === b.info_id);
          title = ev?.name ?? '';
          image = ev?.cover_image ?? '';
        } else if (b.type === 'story') {
          const st = stories.find((s) => s.id === b.info_id);
          title = st?.title ?? '';
          image = st?.cover_image ?? '';
        } else if (b.type === 'community') {
          const co = communities.find((c) => c.id === b.info_id);
          title = co?.name ?? '';
          image = co?.cover_image ?? '';
        }
        return { ...b, title, image };
      })
    );

    // Attach organizers, sponsors, agenda to events
    const eventsEnriched = events.map((e) => ({
      ...e,
      organizers: eventOrganizers.filter((eo) => eo.event_id === e.id),
      sponsors: eventSponsors.filter((es) => es.event_id === e.id),
      agenda: agenda.filter((a) => a.event_id === e.id),
    }));

    // Attach images to stories
    const storiesEnriched = stories.map((s) => ({
      ...s,
      images: storyImages.filter((si) => si.story_id === s.id),
    }));

    return res.status(200).json({
      events: eventsEnriched,
      komunitas: communities,
      organizers,
      sponsors,
      stories: storiesEnriched,
      reviews,
      banners: bannersResolved,
      kategoriKomunitas,
      kategoriEvent,
      venue: venues,
      partisipan: participants,
      communityMembers,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
