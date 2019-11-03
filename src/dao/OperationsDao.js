/* eslint-disable camelcase, require-jsdoc */
const IDao = require('./IDao.js');
const BaseError = require('../components/base-error');

/**
 * @class
 * @extends {IDao}
 */
class OperationsDao extends IDao {
    constructor(...args) {
        super(...args, 'operations', {order: ['time', 'asc']});
    }
}

module.exports = OperationsDao;
