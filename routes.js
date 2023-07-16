const { analyzePopulationData, updateDatabase, sendResponse } = require('./helpers')

const getPopulation = (req, res, params) => {
    const lowerCaseState = params.state.toLowerCase()
    const lowerCaseCity = params.city.toLowerCase()

    if (global.populationData[lowerCaseState] && global.populationData[lowerCaseState][lowerCaseCity]) {
        return sendResponse(res, 200, { population: global.populationData[lowerCaseState][lowerCaseCity] })
    } else {
        return sendResponse(res, 400, { error: 'Population data not found for the specified state and city.' })
    }
}

const updatePopulation = (req, res, params) => {
    let body = [];
    req.on('data', (chunk) => {
        body.push(chunk);
    }).on('end', async () => {
        body = Buffer.concat(body).toString();
        const lowerCaseState = params.state.toLowerCase()
        const lowerCaseCity = params.city.toLowerCase()

        const newPopulation = Number.parseInt(body, 10);

        if (isNaN(newPopulation) || newPopulation < 0) {
            return sendResponse(res, 400, { error: 'Invalid population value. Please provide a valid non-negative number.' })
        }

        const { isNewState, isNewCity, oldPopulation } = analyzePopulationData(lowerCaseState, lowerCaseCity)

        // Return immediately if the population is the same
        if (oldPopulation === newPopulation) {
            return sendResponse(res, 200)
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
            return sendResponse(res, 400, { error: 'Bad request' })
        }

        return sendResponse(res, isNewCity ? 201 : 200)
    });
}

module.exports = { getPopulation, updatePopulation };
