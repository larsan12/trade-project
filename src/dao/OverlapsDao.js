/* eslint-disable camelcase, require-jsdoc */
const IDao = require('./IDao.js');
const BaseError = require('../components/base-error');
const agg = require('../services/Aggregator');

/**
 * @class
 * @extends {IDao}
 */
class OverlapsDao extends IDao {
    constructor(...args) {
        super(...args, 'overlaps', {
            order: ['time', 'asc'],
            key: ['hypotes_id', 'agent_id', 'time'],
        });
    }

    async getLastOverlaps(agentId, count) {
        const {queries, pool} = agg.instance;
        const result = await pool.query(queries.getLastOverlaps, [agentId, count]);
        return result.rows;
    }
}

module.exports = OverlapsDao;
