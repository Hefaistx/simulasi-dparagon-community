import eventsHandler from './_events.js';
import communitiesHandler from './_communities.js';
import storiesHandler from './_stories.js';
import reviewsHandler from './_reviews.js';
import bannersHandler from './_banners.js';
import participantsHandler from './_participants.js';
import organizersHandler from './_organizers.js';
import sponsorsHandler from './_sponsors.js';
import masterHandler from './_master.js';
import usersHandler from './_users.js';
import communityMembersHandler from './_community-members.js';
import eventOrganizersHandler from './_event-organizers.js';
import eventSponsorsHandler from './_event-sponsors.js';
import seedHandler from './_seed.js';
import dataHandler from './_data.js';

const routes = {
  events: eventsHandler,
  communities: communitiesHandler,
  stories: storiesHandler,
  reviews: reviewsHandler,
  banners: bannersHandler,
  participants: participantsHandler,
  organizers: organizersHandler,
  sponsors: sponsorsHandler,
  master: masterHandler,
  users: usersHandler,
  'community-members': communityMembersHandler,
  'event-organizers': eventOrganizersHandler,
  'event-sponsors': eventSponsorsHandler,
  seed: seedHandler,
  data: dataHandler,
};

export default async function handler(req, res) {
  const resource = req.query._resource;
  const h = routes[resource];
  if (!h) return res.status(404).json({ error: `Unknown resource: ${resource}` });
  return h(req, res);
}
