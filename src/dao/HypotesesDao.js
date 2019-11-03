/* eslint-disable camelcase, require-jsdoc */
const IDao = require('./IDao.js');
const BaseError = require('../components/base-error');

/**
 * @class
 * @extends {IDao}
 */
class HypotesesDao extends IDao {
    constructor(...args) {
        super(...args, 'hypoteses');
    }
}

module.exports = HypotesesDao;
