/* eslint-disable require-jsdoc */
const AgentsDao = require('../dao/AgentsDao');
const DataSetsDao = require('../dao/DataSetsDao');

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
    }
}

module.exports = Aggregator;
