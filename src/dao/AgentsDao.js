/* eslint-disable camelcase, require-jsdoc */
const IDao = require('./IDao.js');
const BaseError = require('../components/base-error');

/**
 * @class
 * @extends {IDao}
 */
class AgentsDao extends IDao {
    async createAgentIfNotExist(company, config, int, div) {
        const divergence = parseInt(div);
        const interval = parseInt(int);
        const {dataSetsDao} = this.agg;
        const dataSet = await dataSetsDao.getDataSet(company, interval);
        if (!dataSet) {
            throw new BaseError(`no data set for company ${company}, interval: ${interval}`);
        }
        const fields = {
            id: 'agents.id',
            divergence: 'agents.divergence',
            data_set_id: 'agents.data_set_id',
        };
        let agent = (await this
            .agents()
            .select(fields)
            .where({
                full_config: JSON.stringify(config),
                data_set_id: dataSet.id,
            })
            .pool())[0];

        // insert if not exist
        if (!agent) {
            agent = {
                divergence,
                full_config: JSON.stringify(config),
                data_set_id: dataSet.id,
            };
            await this
                .agents()
                .insert(agent)
                .pool();
        }

        if (agent.divergence !== divergence) {
            await this
                .agents()
                .where({id: agent.id})
                .update({divergence})
                .pool();
            agent.divergence = divergence;
        }

        delete agent.full_config;
        return {
            ...agent,
            config,
            company,
            interval,
            divergence,
        };
    }
}

module.exports = AgentsDao;
