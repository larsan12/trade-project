/* eslint-disable camelcase, require-jsdoc */
const IDao = require('./IDao.js');
const BaseError = require('../components/base-error');

/**
 * @class
 * @extends {IDao}
 */
class AgentsDao extends IDao {
    async getDataSet(company, interval) {
        const result = await this.dataSets()
            .select('*')
            .where({company, interval})
            .pool();

        return result[0];
    }
}

module.exports = AgentsDao;
