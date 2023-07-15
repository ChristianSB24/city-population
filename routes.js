const db = require('./database')

const routes = async (fastify, options) => {
    const { populationData } = options;
  
    fastify.get('/api/population/state/:state/city/:city', (request, reply) => {
        const state = request.params.state.toLowerCase();
        const city = request.params.city.toLowerCase();
        
        if (!populationData[state] || !populationData[state][city]) {
            reply.status(400).send({ error: 'Population data not found for the specified state and city.' });
        } else {
            reply.status(200).send({ population: populationData[state][city] });
        }
    });
    
    fastify.put('/api/population/state/:state/city/:city', async (request, reply) => {
        const state = request.params.state.toLowerCase();
        const city = request.params.city.toLowerCase();
        const population = parseInt(request.body);
        
        if (isNaN(population) || population < 0) {
            reply.status(400).send({ error: 'Invalid population value. Please provide a valid non-negative number.' });
        }
        
        if (!populationData[state]) {
            populationData[state] = {};
        }

        let isNewCity = false;
        let sql = 'UPDATE cities SET population = $population WHERE state = $state AND city = $city'
            
        if (!populationData[state][city]) {
            isNewCity = true
            sql = 'INSERT INTO cities VALUES ($state, $city, $population)'
        }
        
        const oldPopulation = populationData[state][city]
        
        // Update in-memory data and then update database
        populationData[state][city] = population;

        try {
            db.prepare(sql).run({state, city, population});
        } catch (err) {
            console.error('err', err)
            population[state][city] = oldPopulation
            reply.status(500).send({ error: 'Internal Server Error' });
        }

        reply.status(!isNewCity ? 200 : 201).send()
    });
};
  
module.exports = routes;
  