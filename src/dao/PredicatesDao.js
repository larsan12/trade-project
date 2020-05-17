/* eslint-disable camelcase, require-jsdoc */
const IDao = require('./IDao.js');
const BaseError = require('../components/base-error');

/**
 * @class
 * @extends {IDao}
 */
class PredicatesDao extends IDao {
    constructor(...args) {
        super(...args, 'predicates', {
            order: ['id', 'asc'],
            key: ['id'],
        });
    }
    async create(body, client) {
        const {id} = await this.insert(body, 'id', client);
        return {
            id,
            ...body,
        };
    }
}

module.exports = PredicatesDao;
