/* eslint-disable camelcase, require-jsdoc */
const IDao = require('./IDao.js');
const BaseError = require('../components/base-error');

/**
 * @class
 * @extends {IDao}
 */
class HypotesesDao extends IDao {
    async createHypotes({
        comb_id,
        predicate_id,
        steps_ahead,
        string,
        all,
        up,
        block,
        commulation,
    }) {
        const hypotes = {
            comb_id,
            predicate_id,
            steps_ahead,
            string: string || '',
            all: all || 0,
            up: up || 0,
            block: block || 0,
            commulation: commulation || 1,
        };
        const {id} = (await this
            .hypoteses()
            .returning('id')
            .insert(hypotes)
            .pool())[0];
        return {
            ...hypotes,
            id,
        };
    }

    async getHypotes({
        comb_id,
        predicate_id,
        steps_ahead,
        id,
    }) {
        const where = id ? {id} : {comb_id, predicate_id, steps_ahead};
        const result = (await this
            .hypoteses()
            .select('*')
            .where(where)
            .pool())[0];
        return result;
    }
}

module.exports = HypotesesDao;
