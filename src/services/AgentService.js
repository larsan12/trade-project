/* eslint-disable require-jsdoc */
const BaseError = require('../components/base-error');
const predicates = require('../predicates');
const logger = require('winston');
const Aggregator = require('./Aggregator');

let aggregator;

class AgentService {
    constructor(config) {
        aggregator = new Aggregator(this, config);
    }

    getPredicates(predicatesConf) {
        return predicatesConf.map(([predicateName, ...args]) => new predicates[predicateName](...args));
    }

    async init(processingConfig, predicatesConf) {
        this.processingConfig = processingConfig;
        this.predicatesConf = predicatesConf;
        const {agentsDao, Processing} = aggregator;
        this.agent = await agentsDao.createAgentIfNotExist(
            processingConfig,
            predicatesConf
        );
        aggregator.agent = this.agent;
        logger.info(`Agent init with config: $1 and predicates $2:`, processingConfig, predicatesConf);
        this.predicates = this.getPredicates(predicatesConf.config);
        this.processing = new Processing(processingConfig, this.predicates, this.agent);
        await this.train();
    }

    isTimeInRange(prev, curr) {
        const {divergence, interval} = this.processingConfig;
        const currTime = (new Date(curr.time)).getTime() / 1000;
        const prevTime = (new Date(prev.time)).getTime() / 1000;
        const expected = prevTime + interval;
        return currTime < expected + divergence && currTime > expected - divergence;
    }

    async train() {
        const {dataDao, agentsDao} = aggregator;
        if (this.agent.last_index > 0) {
            await this.loadState();
        }
        const data = await dataDao.get({data_set_id: this.agent.data_set_id}, this.agent.last_index);
        logger.info(`Start training, data length: ${data.length}`);
        await data.reduce(async (promise, row, i) => {
            await promise;
            if (i > 0 && !this.isTimeInRange(data[i - 1], row)) {
                row.break = true;
            }
            await this.processing.process(row);
        }, Promise.resolve());
        const result = this.processing.getResultBody();
        await this.saveState();
        logger.info(`Training finished with profit: ${result.profit}`);
        await agentsDao.removeAgent(this.agent);
    }

    async loadState() {
        const {dataDao, operationsDao, hypotesesDao} = aggregator;
        const {processing} = this;
        const data = await dataDao.get({data_set_id: this.agent.data_set_id},
            this.agent.last_index - processing.maxDepth);
        const operations = await operationsDao.get({agent_id: this.agent.id});
        const hypoteses = await hypotesesDao.delete({predicate_id: this.agent.predicate.id});
        // TODO
    }

    async saveState() {
        const {
            agentsDao,
            hypotesesDao,
            Operation,
            operationsDao,
            Hypotes,
            overlapsDao,
            Overlap,
            pool,
        } = aggregator;
        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            await agentsDao.update({
                id: this.agent.id,
                last_index: this.processing.steps,
                profit: this.processing.profit,
            }, client);
            await Hypotes.saveAll(hypotesesDao, ['id'], client);
            await Operation.saveAll(operationsDao, null, client);
            await Overlap.saveAll(overlapsDao, null, client);
            await client.query('COMMIT');
        } catch (err) {
            logger.error(err);
            await client.query('ROLLBACK');
        } finally {
            client.release();
        }
    }
}

module.exports = AgentService;
