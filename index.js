const http = require('http');

const db = require('./database');
const routes = require('./routes');

const PORT = 5555;

const rows = db.prepare('SELECT * FROM cities').all();

global.populationData = {};
for (const item of rows) {
  const { state, city, population } = item;
  if (!global.populationData[state]) {
    global.populationData[state] = {};
  }
  global.populationData[state][city] = population;
}

const server = new http.Server({
  maxConnections: 5000,
  keepAliveTimeout: 5000,
  headersTimeout: 30000
});

// Create an HTTP server
server.on('request', (req, res) => {
  // Route requests based on the URL path
  if (req.method === 'GET' && req.url.startsWith('/api/population/state/')) {
    routes.getPopulation(req, res);
  } else if (req.method === 'PUT' && req.url.startsWith('/api/population/state/')) {
    routes.updatePopulation(req, res);
  } else {
    res.statusCode = 404;
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
})
