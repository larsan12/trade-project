/* eslint-disable camelcase, require-jsdoc */
const IDao = require('./IDao.js');
const BaseError = require('../components/base-error');
const {serializeObject} = require('../components/utils');

/**
 * @class
 * @extends {IDao}
 */
class AgentsDao extends IDao {
    constructor(...args) {
        super(...args, 'agents', {
            order: ['id', 'asc'],
            key: ['id'],
        });
    }

    async createAgentIfNotExist({
        company,
        divergence: div,
        interval: int,
        ...config
    }, predicateConfig) {
        const divergence = parseInt(div);
        const interval = parseInt(int);
        const {dataSetsDao, predicatesDao} = this.agg;

        const predicate = await predicatesDao.getOrCreatePredicate(predicateConfig.config, predicateConfig.common);
        const dataSet = await dataSetsDao.getOne({company, interval});
        if (!dataSet) {
            throw new BaseError(`no data set for company ${company}, interval: ${interval}`);
        }

        let agent = await this.getOne({
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
            const {id} = this.insert(agent, 'id');
            agent.id = id;
        }

        if (agent.divergence !== divergence) {
            await this.update({id: agent.id, divergence});
            agent.divergence = divergence;
        }

        if (!predicateConfig.common) {
            await predicatesDao.update({
                id: predicate.id,
                data_set_id: dataSet.id,
                agent_id: agent.id,
            });
        }

        delete agent.full_config;
        return {
            ...agent,
            config,
            company,
            interval,
            divergence,
            predicate,
        };
    }

    /**
     * @param {Object} agent - agent
     */
    async removeAgent({predicate, id}) {
        if (predicate.common) {
            const {operationsDao, overlapsDao, hypotesesDao, predicatesDao} = this.agg;
            await operationsDao.delete({agent_id: id});
            await overlapsDao.delete({agent_id: id});
            await hypotesesDao.delete({predicate_id: predicate.id});
            await predicatesDao.delete({id: predicate.id});
        }
        await this.delete({id});
    }
}

module.exports = AgentsDao;
