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

        let predicate = await this.getOne(where);

        // insert if not exist
        if (!predicate) {
            const {id} = await this.insert(where, 'id');
            predicate = {
                ...where,
                id,
            };
        }

        return predicate;
    }
}

module.exports = PredicatesDao;
