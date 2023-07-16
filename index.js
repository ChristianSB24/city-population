const http = require('http');

const db = require('./database');
const routes = require('./routes');

const PORT = 5555;

// Get all data from database to initialize in-memory cache
const rows = db.prepare('SELECT * FROM cities').all();

// Generally, global variables are to be avoided, but in this case it is appropriate for it to serve
// as a cache. In a production setting this would be replaced by a tool like Redis.
global.populationData = {};
for (const item of rows) {
  const { state, city, population } = item;
  if (!global.populationData[state]) {
    global.populationData[state] = {};
  }
  global.populationData[state][city] = population;
}

// Opted to use a custom server since it is faster than any REST framework, including Fastify.
const server = new http.Server({
  maxConnections: 5000,
  keepAliveTimeout: 5000,
  headersTimeout: 30000
});

server.on('request', (req, res) => {
  const { url } = req

  const match = /^\/api\/population\/state\/([^/]+)\/city\/([^/]+)$/.exec(url);
  const params = { state: decodeURIComponent(match?.[1]), city: decodeURIComponent(match?.[2]) }
  if (req.method === 'GET' && match) {
    routes.getPopulation(req, res, params);
  } else if (req.method === 'PUT' && match) {
    routes.updatePopulation(req, res, params);
  } else {
    res.statusCode = 404;
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
})
