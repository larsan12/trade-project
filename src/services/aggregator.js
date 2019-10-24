/* eslint-disable require-jsdoc */
const AgentsDao = require('../dao/AgentsDao');
const DataSetsDao = require('../dao/DataSetsDao');
const PredicatesDao = require('../dao/PredicatesDao');
const HypotesesDao = require('../dao/HypotesesDao');
const HypotesesHistDao = require('../dao/HypotesesHistDao');

/**
 * @class Aggregator
 * @description service logic here
 */
class Aggregator {
    constructor(pool, config) {
        const {schema} = config;
        this.pool = pool;
        this.config = config;
        this.agentsDao = new AgentsDao(pool, schema, this);
        this.dataSetsDao = new DataSetsDao(pool, schema, this);
        this.predicatesDao = new PredicatesDao(pool, schema, this);
        this.hypotesesDao = new HypotesesDao(pool, schema, this);
        this.hypotesesHistDao = new HypotesesHistDao(pool, schema, this);
    }
}

module.exports = Aggregator;
