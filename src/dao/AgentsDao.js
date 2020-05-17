/* eslint-disable camelcase, require-jsdoc */
const IDao = require('./IDao.js');
const BaseError = require('../components/base-error');
const {serializeObject} = require('../components/utils');
const logger = require('winston');
const assert = require('assert');

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
        const {dataSetsDao, predicatesDao, pool} = this.agg;
        const client = await pool.connect();
        try {
            const divergence = parseInt(div);
            const interval = parseInt(int);
            const dataSet = await dataSetsDao.getOne({company, interval});

            if (!dataSet) {
                throw new BaseError(`no data set for company ${company}, interval: ${interval}`);
            }

            let predicate;
            let agent;

            const serializedConfig = predicateConfig.config.sort();
            const predicateBody = {
                full_config: JSON.stringify(serializedConfig),
                common: predicateConfig.config.common || false,
                data_set_id: predicateConfig.config.common ? null : dataSet.id,
            };
            const predicates = await predicatesDao.get({where: predicateBody});

            if (predicates && predicates.length) {
                agent = await this.getOne(builder =>
                    builder.where({
                        full_config: serializeObject(config),
                        data_set_id: dataSet.id,
                    }).whereIn('predicate_id', predicates.map(predicate => predicate.id))
                );
                if (agent) {
                    if (predicateConfig.common) {
                        predicate = predicates.find(pr => agent.predicate_id === pr.id);
                        assert(predicate);
                    } else {
                        predicate = predicates.find(pr => pr.agent_id === agent.id && agent.predicate_id === pr.id);
                        assert(predicate);
                    }
                }
            }

            if (!predicate) {
                predicate = await predicatesDao.create(predicateBody, client);
            }

            // insert if not exist
            if (!agent) {
                agent = {
                    divergence,
                    full_config: serializeObject(config),
                    data_set_id: dataSet.id,
                    predicate_id: predicate.id,
                    last_index: 0,
                    profit: 1,
                };
                const {id} = await this.insert(agent, 'id', client);
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
        } catch (err) {
            logger.error(err);
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * @param {Object} agent - agent
     */
    async removeAgent({predicate, id}) {
        const {operationsDao, overlapsDao, hypotesesDao, predicatesDao} = this.agg;
        await operationsDao.delete({agent_id: id});
        await overlapsDao.delete({agent_id: id});
        await this.delete({id});
        if (!predicate.common) {
            await hypotesesDao.delete({predicate_id: predicate.id});
            await predicatesDao.delete({id: predicate.id});
        }
    }
}

module.exports = AgentsDao;
