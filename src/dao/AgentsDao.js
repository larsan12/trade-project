/* eslint-disable camelcase, require-jsdoc */
const IDao = require('./IDao.js');
const BaseError = require('../components/base-error');
const {serializeObject} = require('../components/utils');

/**
 * @class
 * @extends {IDao}
 */
class AgentsDao extends IDao {
    async createAgentIfNotExist({
        company,
        divergence: div,
        interval: int,
        ...config
    }, predicateConfig) {
        const divergence = parseInt(div);
        const interval = parseInt(int);
        const {dataSetsDao, predicatesDao} = this.agg;

        const predicate = await predicatesDao.getOrCreatePredicate(predicateConfig);
        const dataSet = await dataSetsDao.getDataSet(company, interval);
        if (!dataSet) {
            throw new BaseError(`no data set for company ${company}, interval: ${interval}`);
        }

        let agent = await this.getAgent({
            full_config: serializeObject(config),
            data_set_id: dataSet.id,
            predicate_id: predicate.id,
        });

        // insert if not exist
        if (!agent) {
            agent = {
                divergence,
                full_config: serializeObject(config),
                data_set_id: dataSet.id,
                predicate_id: predicate.id,
                last_index: 0,
            };
            const {id} = (await this
                .agents()
                .returning('id')
                .insert(agent)
                .pool())[0];
            agent.id = id;
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

    async getAgent(where) {
        const result = (await this
            .agents()
            .select('*')
            .where(where)
            .pool())[0];

        return result;
    }

    async updateAgent(id, updatedFields) {
        await this
            .agents()
            .where({id})
            .update(updatedFields)
            .pool();
    }
}

module.exports = AgentsDao;
