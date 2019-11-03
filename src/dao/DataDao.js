/* eslint-disable camelcase, require-jsdoc */
const IDao = require('./IDao.js');
const BaseError = require('../components/base-error');

/**
 * @class
 * @extends {IDao}
 */
class DataDao extends IDao {
    constructor(...args) {
        super(...args, 'data', {order: ['time', 'asc']});
    }
}

module.exports = DataDao;
