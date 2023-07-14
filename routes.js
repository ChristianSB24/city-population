const fs = require('fs');
const { convertPopulationDataToCSV } = require('./helpers')

const routes = async (fastify, options) => {
    const { populationData } = options;
  
    fastify.get('/api/population/state/:state/city/:city', (request, reply) => {
        const state = request.params.state.toLowerCase();
        const city = request.params.city.replace(/[-\s(),"']/g, '').toLowerCase();
        
        if (!populationData[state] || !populationData[state][city]) {
            reply.status(400).send({ error: 'Population data not found for the specified state and city.' });
        } else {
            reply.status(200).send({ population: populationData[state][city] });
        }
    });
    
    fastify.put('/api/population/state/:state/city/:city', (request, reply) => {
        const state = request.params.state.toLowerCase();
        const city = request.params.city.replace(/[-\s(),"']/g, '').toLowerCase();
        const population = parseInt(request.body);
        
        if (isNaN(population) || population < 0) {
            reply.status(400).send({ error: 'Invalid population value. Please provide a valid non-negative number.' });
        }
            
        if (!populationData[state]) {
            populationData[state] = {};
        }
            
        let isNewCity = false;
        
        if (!populationData[state][city]) isNewCity = true
        
        populationData[state][city] = population;
        
        const updatedCSVData = convertPopulationDataToCSV(populationData)
        reply.status(200).send()
    
        // Write the updated data onto the csv file asynchronously
        fs.writeFile('city_populations.csv', updatedCSVData, (err) => {
            if (err) {
                reply.status(500).send({ error: 'Failed to update population data.' });
            } else {
                reply.status(!isNewCity ? 200 : 201).send();
            }
        });
    });
};
  
module.exports = routes;
  