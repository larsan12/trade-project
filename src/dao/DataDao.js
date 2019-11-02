/* eslint-disable camelcase, require-jsdoc */
const IDao = require('./IDao.js');
const BaseError = require('../components/base-error');

/**
 * @class
 * @extends {IDao}
 */
class DataDao extends IDao {
    async getData(where, offset) {
        let req = this.data()
            .select('*')
            .where(where)
            .orderBy('time', 'asc');
        if (offset) {
            req = req.offset(offset);
        }
        const result = await req.pool();
        return result;
    }
}

module.exports = DataDao;
