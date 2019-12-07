const pg = require('pg');

/* eslint-disable require-jsdoc */
const AgentsDao = require('../dao/AgentsDao');
const DataSetsDao = require('../dao/DataSetsDao');
const DataDao = require('../dao/DataDao');
const PredicatesDao = require('../dao/PredicatesDao');
const HypotesesDao = require('../dao/HypotesesDao');
const HypotesesHistDao = require('../dao/HypotesesHistDao');
const Processing = require('./Processing');
const SyncDbService = require('./SyncDbService');
const Operations = require('./classes/Operations');
const Hypotes = require('./classes/Hypotes');
const Combination = require('./classes/Combination');

/**
 * @class Aggregator
 * @description service logic here
 */

let aggregator = null;
class Aggregator {
    constructor(config) {
        const {schema} = config;
        const pool = new pg.Pool(config.db);
        this.pool = pool;
        this.config = config;
        this.agentsDao = new AgentsDao(pool, schema, this);
        this.dataSetsDao = new DataSetsDao(pool, schema, this);
        this.dataDao = new DataDao(pool, schema, this);
        this.predicatesDao = new PredicatesDao(pool, schema, this);
        this.hypotesesDao = new HypotesesDao(pool, schema, this);
        this.hypotesesHistDao = new HypotesesHistDao(pool, schema, this);
        this.syncDbService = new SyncDbService(this);
        this.Operations = Operations;
        this.Hypotes = Hypotes;
        this.Combination = Combination;
        this.Processing = Processing;
        aggregator = this;
    }
    static get aggregator() {
        if (!aggregator) {
            throw new Error('Aggregator not initialized');
        }
        return aggregator;
    }
}

module.exports = Aggregator;
