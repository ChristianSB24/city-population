const fastify = require('fastify')();

const db = require('./database')
const routes = require('./routes');

const PORT = 5555;

const rows = db.prepare('SELECT * FROM cities').all();

// Set population data in-memory for fast retrieval
const populationData = {};
for (const item of rows) {
  const { state, city, population } = item;
  if (!populationData[state]) {
    populationData[state] = {};
  }
  populationData[state][city] = population;
}

// Register routes with populationData as an option
fastify.register(routes, { populationData });

// Start the server
fastify.listen({port: PORT}, (err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server is running on http://localhost:${PORT}`);
});
