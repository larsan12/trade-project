/* eslint-disable camelcase, require-jsdoc */
const IDao = require('./IDao.js');
const BaseError = require('../components/base-error');

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
}

module.exports = OverlapsDao;
