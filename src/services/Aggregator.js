/* eslint-disable global-require */
/* eslint-disable require-jsdoc */
const pg = require('pg');

/**
 * @class Aggregator
 * @description service logic here
 */

let aggregator = null;
class Aggregator {
    constructor(agent, config) {
        const {schema} = config;
        const pool = new pg.Pool(config.db);
        this.pool = pool;
        this.config = config;
        aggregator = this;

        const AgentsDao = require('../dao/AgentsDao');
        const DataSetsDao = require('../dao/DataSetsDao');
        const DataDao = require('../dao/DataDao');
        const PredicatesDao = require('../dao/PredicatesDao');
        const HypotesesDao = require('../dao/HypotesesDao');
        const OverlapsDao = require('../dao/OverlapsDao');
        const OperationsDao = require('../dao/OperationsDao');
        const queries = require('../dao/queries');

        const Processing = require('./Processing');
        const Operation = require('./classes/Operation');
        const Hypotes = require('./classes/Hypotes');
        const Combination = require('./classes/Combination');
        const Overlap = require('./classes/Overlap');
        const DataService = require('./DataService');

        const daoInject = [pool, schema, this];
        this.agentService = agent;
        this.agentsDao = new AgentsDao(...daoInject);
        this.dataSetsDao = new DataSetsDao(...daoInject);
        this.dataDao = new DataDao(...daoInject);
        this.predicatesDao = new PredicatesDao(...daoInject);
        this.hypotesesDao = new HypotesesDao(...daoInject);
        this.overlapsDao = new OverlapsDao(...daoInject);
        this.operationsDao = new OperationsDao(...daoInject);
        this.dataService = new DataService();
        this.Operation = Operation;
        this.Hypotes = Hypotes;
        this.Combination = Combination;
        this.Overlap = Overlap;
        this.Processing = Processing;
        this.queries = queries;
    }
    static get instance() {
        if (!aggregator) {
            throw new Error('Aggregator not initialized');
        }
        return aggregator;
    }
}

module.exports = Aggregator;
