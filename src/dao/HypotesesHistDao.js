/* eslint-disable camelcase, require-jsdoc */
const IDao = require('./IDao.js');
const BaseError = require('../components/base-error');

/**
 * @class
 * @extends {IDao}
 */
class HypotesesHistDao extends IDao {
    constructor(...args) {
        super(...args, 'hypotesesHist', {order: ['time', 'asc']});
    }
}

module.exports = HypotesesHistDao;
