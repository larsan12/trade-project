/* eslint-disable camelcase, require-jsdoc */
const IDao = require('./IDao.js');
const BaseError = require('../components/base-error');

/**
 * @class
 * @extends {IDao}
 */
class HypotesesHistDao extends IDao {
    async createHypotesHist({
        hypotes_id,
        agent_id,
        time,
        value,
    }) {
        const hypotesHist = {
            hypotes_id,
            agent_id,
            time,
            value,
        };
        await this
            .hypotesesHist()
            .insert(hypotesHist)
            .pool();

        return hypotesHist;
    }
}

module.exports = HypotesesHistDao;
