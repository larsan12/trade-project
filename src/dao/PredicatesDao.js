/* eslint-disable camelcase, require-jsdoc */
const IDao = require('./IDao.js');
const BaseError = require('../components/base-error');
const {serializeObject} = require('../components/utils');

/**
 * @class
 * @extends {IDao}
 */
class PredicatesDao extends IDao {
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

        let predicate = await this.getPredicate(where);

        // insert if not exist
        if (!predicate) {
            await this
                .predicates()
                .insert(where)
                .pool();
            predicate = await this.getPredicate(where);
        }

        return predicate;
    }

    async getPredicate(where) {
        const result = (await this
            .predicates()
            .select('*')
            .where(where)
            .pool())[0];
        return result;
    }
}

module.exports = PredicatesDao;
