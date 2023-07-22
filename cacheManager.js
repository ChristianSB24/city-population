// cacheManager.js
const NodeCache = require('node-cache');
const myCache = new NodeCache();

function set(key, value, ttl) {
    return myCache.set(key, value, ttl);
}

function get(key) {
    return myCache.get(key);
}

function del(key) {
    return myCache.del(key);
}

module.exports = {
    set,
    get,
    del,
};
