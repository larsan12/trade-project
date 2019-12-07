/* eslint-disable require-jsdoc */
const BaseError = require('../components/base-error');
const {addedDiff, updatedDiff} = require('deep-object-diff');

class SyncDbService {
    constructor(agg) {
        this.aggregator = agg;
        this.agentService = agg.agentService;
    }
}

module.exports = SyncDbService;
