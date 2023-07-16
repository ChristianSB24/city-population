const db = require('./database');

const analyzePopulationData = (state, city) => {
    let isNewState = false;
    let isNewCity = false;
    let oldPopulation = null;

    if (!global.populationData[state]) {
        isNewState = true;
        global.populationData[state] = {};
    }

    if (!global.populationData[state][city]) {
        isNewCity = true
    } else {
        oldPopulation = global.populationData[state][city]
    }

    return { isNewState, isNewCity, oldPopulation }
}

// Promisified the synchronous db.prepare function to not block the event loop.
const updateDatabase = (sql, values) => {
    return new Promise((resolve, reject) => {
        try {
            db.prepare(sql).run(values);
            resolve();
        } catch (err) {
            console.error('Error executing database query:', err);
            reject(err);
        }
    });
};

const sendResponse = (res, statusCode, message = {}) => {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(message));
};

module.exports = { analyzePopulationData, updateDatabase, sendResponse }