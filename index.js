const fastify = require('fastify')();
const fs = require('fs');

const { parseCSV, convertCSVtoPopulationData } = require('./helpers');
const routes = require('./routes');

const PORT = 5555;

const fileData = fs.readFileSync('city_populations.csv', 'utf8');

const parsedData = parseCSV(fileData)

// Set population data in-memory for fast retrieval
const populationData = convertCSVtoPopulationData(parsedData)

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
