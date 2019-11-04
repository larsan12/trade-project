/* eslint-disable require-jsdoc */
const BaseError = require('../components/base-error');
const addedDiff = require("deep-object-diff").addedDiff;
const updatedDiff = require("deep-object-diff").updatedDiff;

class SyncDbService {
    constructor(agg) {
        this.aggregator = agg;
        this.agentService = agg.agentService;
    }
}

module.exports = SyncDbService;
