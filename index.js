const http = require('http');
const cluster = require('cluster')
const os = require('os')

const workers = os.cpus().length

const cache = require('./cacheManager')
const db = require('./database');
const routes = require('./routes');

const PORT = 5555;

// Get all data from database to initialize in-memory cache
const rows = db.prepare('SELECT * FROM cities').all();

for (const item of rows) {
  const state = item.state.toLowerCase()
  const city = item.city.toLowerCase()
  const population = item.population
  const obj = { state: state, city: city, population: population }

  cache.set(`${state}-${city}`, obj, 10000);
}

// Opted to use a custom server since it is faster than any REST framework, including Fastify.
const server = new http.Server({
  maxConnections: 5000,
  keepAliveTimeout: 5000,
  headersTimeout: 30000
});

if (cluster.isMaster) {
  for (let i = 0; i < workers; i++) {
    cluster.fork()
  }

  cluster.on('exit', (worker, code, signal) => {
    console.error('Worker died: ' + worker.id + ', code: ' + code + ', signal: ' + signal)
    cluster.fork()
  })
} else {
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
}