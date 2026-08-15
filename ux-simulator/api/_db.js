import { neon } from '@neondatabase/serverless';
import { SEED_DATA } from './_seed-data.js';

export const sql = () => neon(process.env.DATABASE_URL);

let tablesCreated = false;
let seeded = false;

export async function createTables() {
  if (tablesCreated) return;
  const db = sql();
  await db`CREATE TABLE IF NOT EXISTS community_categories (id SERIAL PRIMARY KEY, name TEXT NOT NULL, description TEXT)`;
  await db`CREATE TABLE IF NOT EXISTS event_categories (id SERIAL PRIMARY KEY, name TEXT NOT NULL, description TEXT)`;
  await db`CREATE TABLE IF NOT EXISTS venues (id SERIAL PRIMARY KEY, name TEXT NOT NULL, address TEXT, capacity INTEGER, city TEXT, maps_link TEXT)`;
  await db`ALTER TABLE venues DROP COLUMN IF EXISTS type`;
  await db`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, phone TEXT, city TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`;
  await db`CREATE TABLE IF NOT EXISTS communities (id SERIAL PRIMARY KEY, name TEXT NOT NULL, description TEXT, category_id INTEGER REFERENCES community_categories(id), type TEXT, city TEXT, status TEXT DEFAULT 'active', wa_link TEXT, admin TEXT, cover_image TEXT, rules JSONB DEFAULT '[]', pic_name TEXT, pic_email TEXT, pic_phone TEXT, notes TEXT, submitted_at DATE, created_at TIMESTAMPTZ DEFAULT NOW())`;
  await db`CREATE TABLE IF NOT EXISTS community_members (id SERIAL PRIMARY KEY, community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, joined_at TIMESTAMPTZ DEFAULT NOW(), status TEXT DEFAULT 'active', UNIQUE(community_id, user_id))`;
  await db`CREATE TABLE IF NOT EXISTS organizers (id SERIAL PRIMARY KEY, name TEXT NOT NULL, description TEXT, email TEXT, phone TEXT, website TEXT, pic TEXT, status TEXT DEFAULT 'active', notes TEXT, submitted_at DATE)`;
  await db`CREATE TABLE IF NOT EXISTS sponsors (id SERIAL PRIMARY KEY, name TEXT NOT NULL, description TEXT, email TEXT, phone TEXT, website TEXT, pic TEXT, status TEXT DEFAULT 'active', notes TEXT, submitted_at DATE)`;
  await db`CREATE TABLE IF NOT EXISTS events (id SERIAL PRIMARY KEY, name TEXT NOT NULL, description TEXT, category_id INTEGER REFERENCES event_categories(id), venue_id INTEGER REFERENCES venues(id), status TEXT DEFAULT 'Draft', start_date DATE, end_date DATE, start_time TIME, end_time TIME, quota INTEGER, price INTEGER DEFAULT 0, cover_image TEXT, community_id INTEGER REFERENCES communities(id), facilities JSONB DEFAULT '[]', rules JSONB DEFAULT '[]', created_at TIMESTAMPTZ DEFAULT NOW())`;
  await db`CREATE TABLE IF NOT EXISTS event_organizers (event_id INTEGER REFERENCES events(id) ON DELETE CASCADE, organizer_id INTEGER REFERENCES organizers(id) ON DELETE CASCADE, PRIMARY KEY (event_id, organizer_id))`;
  await db`CREATE TABLE IF NOT EXISTS event_sponsors (event_id INTEGER REFERENCES events(id) ON DELETE CASCADE, sponsor_id INTEGER REFERENCES sponsors(id) ON DELETE CASCADE, PRIMARY KEY (event_id, sponsor_id))`;
  await db`CREATE TABLE IF NOT EXISTS event_agenda (id SERIAL PRIMARY KEY, event_id INTEGER REFERENCES events(id) ON DELETE CASCADE, time TIME, activity TEXT, "order" INTEGER DEFAULT 0)`;
  await db`CREATE TABLE IF NOT EXISTS participants (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, event_id INTEGER REFERENCES events(id) ON DELETE CASCADE, payment_status TEXT DEFAULT 'Pending', checkin_status TEXT DEFAULT 'Belum', booked_at TIMESTAMPTZ DEFAULT NOW(), price INTEGER DEFAULT 0)`;
  await db`CREATE TABLE IF NOT EXISTS stories (id SERIAL PRIMARY KEY, title TEXT NOT NULL, type TEXT DEFAULT 'general', event_id INTEGER REFERENCES events(id), community_id INTEGER REFERENCES communities(id), category TEXT, tags JSONB DEFAULT '[]', cover_image TEXT, content TEXT, author TEXT, published_at DATE, status TEXT DEFAULT 'draft', created_at TIMESTAMPTZ DEFAULT NOW())`;
  await db`CREATE TABLE IF NOT EXISTS story_images (id SERIAL PRIMARY KEY, story_id INTEGER REFERENCES stories(id) ON DELETE CASCADE, image_url TEXT NOT NULL, "order" INTEGER DEFAULT 0)`;
  await db`CREATE TABLE IF NOT EXISTS reviews (id SERIAL PRIMARY KEY, event_id INTEGER REFERENCES events(id) ON DELETE CASCADE, user_id INTEGER REFERENCES users(id), rating INTEGER CHECK (rating BETWEEN 1 AND 5), comment TEXT, status TEXT DEFAULT 'pending', submitted_at TIMESTAMPTZ DEFAULT NOW())`;
  await db`CREATE TABLE IF NOT EXISTS banners (id SERIAL PRIMARY KEY, type TEXT NOT NULL, info_id INTEGER NOT NULL, status TEXT DEFAULT 'active', "order" INTEGER DEFAULT 0)`;
  tablesCreated = true;
}

export async function seedIfEmpty() {
  if (seeded) return;
  if (process.env.DISABLE_AUTO_SEED === 'true') { seeded = true; return; }
  const db = sql();
  const [{ count }] = await db`SELECT COUNT(*) FROM community_categories`;
  if (Number(count) > 0) { seeded = true; return; }
  await seed(db);
  seeded = true;
}

export async function seed(db) {
  const d = SEED_DATA;

  // community_categories
  for (const c of d.communityCategories) {
    await db`INSERT INTO community_categories (id, name, description) VALUES (${c.id}, ${c.name}, ${c.description}) ON CONFLICT DO NOTHING`;
  }
  await db`SELECT setval('community_categories_id_seq', (SELECT MAX(id) FROM community_categories))`;

  // event_categories
  for (const c of d.eventCategories) {
    await db`INSERT INTO event_categories (id, name, description) VALUES (${c.id}, ${c.name}, ${c.description}) ON CONFLICT DO NOTHING`;
  }
  await db`SELECT setval('event_categories_id_seq', (SELECT MAX(id) FROM event_categories))`;

  // venues
  for (const v of d.venues) {
    await db`INSERT INTO venues (id, name, address, capacity, city, maps_link) VALUES (${v.id}, ${v.name}, ${v.address}, ${v.capacity}, ${v.city}, ${v.maps_link ?? null}) ON CONFLICT DO NOTHING`;
  }
  await db`SELECT setval('venues_id_seq', (SELECT MAX(id) FROM venues))`;

  // users
  for (const u of d.users) {
    await db`INSERT INTO users (id, name, email, phone, city) VALUES (${u.id}, ${u.name}, ${u.email}, ${u.phone ?? null}, ${u.city ?? null}) ON CONFLICT DO NOTHING`;
  }
  await db`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`;

  // communities
  for (const c of d.communities) {
    await db`INSERT INTO communities (id, name, description, category_id, type, city, status, wa_link, admin, cover_image, rules, pic_name, pic_email, pic_phone, notes, submitted_at)
      VALUES (${c.id}, ${c.name}, ${c.description ?? null}, ${c.category_id ?? null}, ${c.type ?? null}, ${c.city ?? null}, ${c.status ?? 'active'}, ${c.wa_link ?? null}, ${c.admin ?? null}, ${c.cover_image ?? null}, ${JSON.stringify(c.rules ?? [])}, ${c.pic_name ?? null}, ${c.pic_email ?? null}, ${c.pic_phone ?? null}, ${c.notes ?? null}, ${c.submitted_at ?? null})
      ON CONFLICT DO NOTHING`;
  }
  await db`SELECT setval('communities_id_seq', (SELECT MAX(id) FROM communities))`;

  // organizers
  for (const o of d.organizers) {
    await db`INSERT INTO organizers (id, name, description, email, phone, website, pic, status, notes, submitted_at)
      VALUES (${o.id}, ${o.name}, ${o.description ?? null}, ${o.email ?? null}, ${o.phone ?? null}, ${o.website ?? null}, ${o.pic ?? null}, ${o.status ?? 'active'}, ${o.notes ?? null}, ${o.submitted_at ?? null})
      ON CONFLICT DO NOTHING`;
  }
  await db`SELECT setval('organizers_id_seq', (SELECT MAX(id) FROM organizers))`;

  // sponsors
  for (const s of d.sponsors) {
    await db`INSERT INTO sponsors (id, name, description, email, phone, website, pic, status, notes, submitted_at)
      VALUES (${s.id}, ${s.name}, ${s.description ?? null}, ${s.email ?? null}, ${s.phone ?? null}, ${s.website ?? null}, ${s.pic ?? null}, ${s.status ?? 'active'}, ${s.notes ?? null}, ${s.submitted_at ?? null})
      ON CONFLICT DO NOTHING`;
  }
  await db`SELECT setval('sponsors_id_seq', (SELECT MAX(id) FROM sponsors))`;

  // events
  for (const e of d.events) {
    await db`INSERT INTO events (id, name, description, category_id, venue_id, status, start_date, end_date, start_time, end_time, quota, price, cover_image, community_id, facilities, rules)
      VALUES (${e.id}, ${e.name}, ${e.description ?? null}, ${e.category_id ?? null}, ${e.venue_id ?? null}, ${e.status ?? 'Draft'}, ${e.start_date ?? null}, ${e.end_date ?? null}, ${e.start_time ?? null}, ${e.end_time ?? null}, ${e.quota ?? 0}, ${e.price ?? 0}, ${e.cover_image ?? null}, ${e.community_id ?? null}, ${JSON.stringify(e.facilities ?? [])}, ${JSON.stringify(e.rules ?? [])})
      ON CONFLICT DO NOTHING`;
  }
  await db`SELECT setval('events_id_seq', (SELECT MAX(id) FROM events))`;

  // event_organizers
  for (const eo of d.eventOrganizers) {
    await db`INSERT INTO event_organizers (event_id, organizer_id) VALUES (${eo.event_id}, ${eo.organizer_id}) ON CONFLICT DO NOTHING`;
  }

  // event_sponsors
  for (const es of d.eventSponsors) {
    await db`INSERT INTO event_sponsors (event_id, sponsor_id) VALUES (${es.event_id}, ${es.sponsor_id}) ON CONFLICT DO NOTHING`;
  }

  // event_agenda
  for (const a of d.eventAgenda) {
    await db`INSERT INTO event_agenda (id, event_id, time, activity, "order") VALUES (${a.id}, ${a.event_id}, ${a.time ?? null}, ${a.activity ?? null}, ${a.order ?? 0}) ON CONFLICT DO NOTHING`;
  }
  if (d.eventAgenda.length > 0) {
    await db`SELECT setval('event_agenda_id_seq', (SELECT MAX(id) FROM event_agenda))`;
  }

  // participants
  for (const p of d.participants) {
    await db`INSERT INTO participants (id, user_id, name, email, phone, event_id, payment_status, checkin_status, booked_at, price)
      VALUES (${p.id}, ${p.user_id ?? null}, ${p.name}, ${p.email}, ${p.phone ?? null}, ${p.event_id}, ${p.payment_status ?? 'Pending'}, ${p.checkin_status ?? 'Belum'}, ${p.booked_at ?? new Date().toISOString()}, ${p.price ?? 0})
      ON CONFLICT DO NOTHING`;
  }
  if (d.participants.length > 0) {
    await db`SELECT setval('participants_id_seq', (SELECT MAX(id) FROM participants))`;
  }

  // stories
  for (const s of d.stories) {
    await db`INSERT INTO stories (id, title, type, event_id, community_id, category, tags, cover_image, content, author, published_at, status)
      VALUES (${s.id}, ${s.title}, ${s.type ?? 'general'}, ${s.event_id ?? null}, ${s.community_id ?? null}, ${s.category ?? null}, ${JSON.stringify(s.tags ?? [])}, ${s.cover_image ?? null}, ${s.content ?? null}, ${s.author ?? null}, ${s.published_at ?? null}, ${s.status ?? 'draft'})
      ON CONFLICT DO NOTHING`;
  }
  if (d.stories.length > 0) {
    await db`SELECT setval('stories_id_seq', (SELECT MAX(id) FROM stories))`;
  }

  // reviews
  for (const r of d.reviews) {
    await db`INSERT INTO reviews (id, event_id, user_id, rating, comment, status, submitted_at)
      VALUES (${r.id}, ${r.event_id}, ${r.user_id ?? null}, ${r.rating}, ${r.comment ?? null}, ${r.status ?? 'pending'}, ${r.submitted_at ?? new Date().toISOString()})
      ON CONFLICT DO NOTHING`;
  }
  if (d.reviews.length > 0) {
    await db`SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews))`;
  }

  // banners
  for (const b of d.banners) {
    await db`INSERT INTO banners (id, type, info_id, status, "order") VALUES (${b.id}, ${b.type}, ${b.info_id}, ${b.status ?? 'active'}, ${b.order ?? 0}) ON CONFLICT DO NOTHING`;
  }
  if (d.banners.length > 0) {
    await db`SELECT setval('banners_id_seq', (SELECT MAX(id) FROM banners))`;
  }
}
