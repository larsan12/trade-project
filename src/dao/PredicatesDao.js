/* eslint-disable camelcase, require-jsdoc */
const IDao = require('./IDao.js');
const BaseError = require('../components/base-error');
const {serializeObject} = require('../components/utils');

/**
 * @class
 * @extends {IDao}
 */
class PredicatesDao extends IDao {
    constructor(...args) {
        super(...args, 'predicates');
    }
    async getOrCreatePredicate(config, common, dataSetId) {
        const serializedConfig = config.sort();
        const where = {
            full_config: JSON.stringify(serializedConfig),
        };
        if (typeof common === 'boolean') {
            where.common = common;
        }
        if (dataSetId) {
            where.dataSetId = dataSetId;
        }

        const predicate = (await this.get(where))[0] || {};

        // insert if not exist
        if (!predicate) {
            const {id} = await this.insert(where, 'id')
            predicate.id = id;
        }

        return predicate;
    }
}

module.exports = PredicatesDao;
