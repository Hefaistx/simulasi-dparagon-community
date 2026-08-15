import { createServer } from 'node:http';
import apiHandler from '../api/index.js';

const PORT = process.env.PORT || 3001;

function buildReq(req, body) {
  const url = new URL(req.url, 'http://localhost');
  const resource = url.pathname.replace(/^\/api\//, '').split('/')[0];
  const query = Object.fromEntries(url.searchParams);
  query._resource = resource;
  req.query = query;
  req.body = body;
  return req;
}

function buildRes(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
  };
  return res;
}

const server = createServer((req, res) => {
  buildRes(res);
  if (!req.url.startsWith('/api/')) {
    res.status(404).json({ error: 'Not an /api route' });
    return;
  }

  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', async () => {
    let body = null;
    if (chunks.length) {
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { body = null; }
    }
    try {
      await apiHandler(buildReq(req, body), res);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Local API dev server ready on http://localhost:${PORT}`);
});
