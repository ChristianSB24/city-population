const db = require('./database');

const _updateDatabase = (sql, values) => {
    return new Promise((resolve, reject) => {
        try {
            db.prepare(sql).run(values)
            return resolve()
        } catch (err) {
            return reject(err)
        }
    })
}

const _getLowerCaseStateAndCity = (url) => {
    const match = /^\/api\/population\/state\/([^/]+)\/city\/([^/]+)$/.exec(url);
    return {lowerCaseState: match[1].toLowerCase(), lowerCaseCity: match[2].toLowerCase()}
}

const getPopulation = (req, res) => {
    const { url } = req;
    const {lowerCaseState, lowerCaseCity} = _getLowerCaseStateAndCity(url)

    if (!global.populationData[lowerCaseState] || !global.populationData[lowerCaseState][lowerCaseCity]) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Population data not found for the specified state and city.' }));
    } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ population: global.populationData[lowerCaseState][lowerCaseCity] }));
    }
}

const updatePopulation = (req, res) => {
    const { url } = req;
    const {lowerCaseState, lowerCaseCity} = _getLowerCaseStateAndCity(url)

    let body = [];
    req.on('data', (chunk) => {
        body.push(chunk);
    }).on('end', () => {
        body = Buffer.concat(body).toString();

        const newPopulation = parseInt(body);
        
        if (isNaN(newPopulation) || newPopulation < 0) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'Invalid population value. Please provide a valid non-negative number.' }));
        }

        let isNewState = false;
        let isNewCity = false;
        let oldPopulation;
        
        if (!global.populationData[lowerCaseState]) {
            isNewState = true;
            global.populationData[lowerCaseState] = {};
        }
        
        if (!global.populationData[lowerCaseState][lowerCaseCity]) {
            isNewCity = true
        } else {
            oldPopulation = global.populationData[lowerCaseState][lowerCaseCity]
        }
        
        // Return immediately if the population is the same
        if (oldPopulation === newPopulation) {
            res.statusCode = 200;
            return res.end();
        }
        
        // If new population then update in-memory data and then update database
        global.populationData[lowerCaseState][lowerCaseCity] = newPopulation;

        try {
            // To squeeze a bit more performance I use a write-behind caching strategy
            // where the cache is updated immediately but the database is updated after
            // a set amount of time. Since it is a promise and I don't await it, execution of the
            // code will continue and the update happens in the background.
            if (isNewCity) {
                _updateDatabase('INSERT INTO cities VALUES ($state, $city, $population)', {state: lowerCaseState, city: lowerCaseCity, population: newPopulation})
            } else {
                _updateDatabase('UPDATE cities SET population = $population WHERE state = $state AND city = $city', {state: lowerCaseState, city: lowerCaseCity, population: newPopulation})
            }

            res.statusCode = isNewCity ? 201 : 200;
            return res.end();
        } catch (err) {
            console.error('err', err)
            // Clear cache of data that wasn't able to be inserted into database
            if (isNewCity) {
                delete global.populationData[lowerCaseState][lowerCaseCity]
                if (isNewState) delete global.populationData[lowerCaseState]
            } else {
                global.populationData[lowerCaseState][city] = oldPopulation
            }

            res.statusCode = 500;
            return res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
    });
}

module.exports = { getPopulation, updatePopulation };
