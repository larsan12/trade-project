/* eslint-disable camelcase, require-jsdoc */
const IDao = require('./IDao.js');
const BaseError = require('../components/base-error');

/**
 * @class
 * @extends {IDao}
 */
class DataSetsDao extends IDao {
    constructor(...args) {
        super(...args, 'dataSets', {
            order: ['id', 'asc'],
            key: ['id'],
        });
    }
}

module.exports = DataSetsDao;
