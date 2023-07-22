const cache = require('./cacheManager')
const { analyzePopulationData, updateDatabase, sendResponse } = require('./helpers')

const routes = async (fastify) => {
    fastify.get('/api/population/state/:state/city/:city', (request, reply) => {
        const lowerCaseState = request.params.state.toLowerCase()
        const lowerCaseCity = request.params.city.toLowerCase()
        // const city = cache.get(`${lowerCaseState}-${lowerCaseCity}`);

        if (true) {
            reply.status(200).send({ population: 'test' });
        } else {
            reply.status(400).send({ error: 'Population data not found for the specified state and city.' });
        }
    });

    fastify.put('/api/population/state/:state/city/:city', async (request, reply) => {
        const lowerCaseState = params.state.toLowerCase()
        const lowerCaseCity = params.city.toLowerCase()

        const newPopulation = Number.parseInt(body, 10);

        if (isNaN(newPopulation) || newPopulation < 0) {
            return reply.status(400).send({ error: 'Invalid population value. Please provide a valid non-negative number.' });
        }

        const { isNewState, isNewCity, oldPopulation } = analyzePopulationData(lowerCaseState, lowerCaseCity)

        // Return immediately if the population is the same
        if (oldPopulation === newPopulation) {
            return reply.status(200).send();
        }

        const sql = isNewCity ?
            'INSERT INTO cities VALUES ($city, $state, $population)' :
            'UPDATE cities SET population = $population WHERE state = $state AND city = $city'
        try {
            // Update cache and then immediately after update the database
            // This is done since the cache is the primary data store
            global.populationData[lowerCaseState][lowerCaseCity] = newPopulation
            await updateDatabase(sql, { city: lowerCaseCity, state: lowerCaseState, population: newPopulation })
        } catch (err) {
            // Rollback changes to the cache
            if (isNewCity) {
                delete global.populationData[lowerCaseState][lowerCaseCity]
                if (isNewState) delete global.populationData[lowerCaseState]
            } else {
                global.populationData[lowerCaseState][lowerCaseCity] = oldPopulation
            }
            return reply.status(400).send({ error: 'Bad request' });
        }
        return reply.status(isNewCity ? 201 : 200).send();
    });
};

module.exports = routes;
