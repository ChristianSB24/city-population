const fastify = require('fastify')();
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

if (cluster.isMaster) {
  for (let i = 0; i < workers; i++) {
    cluster.fork()
  }

  cluster.on('exit', (worker, code, signal) => {
    console.error('Worker died: ' + worker.id + ', code: ' + code + ', signal: ' + signal)
    cluster.fork()
  })
} else {
  // Register routes with populationData as an option
  fastify.register(routes);

  // Start the server
  fastify.listen({ port: PORT }, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}