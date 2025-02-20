/* eslint-disable require-jsdoc */
const BaseError = require('../components/base-error');
const predicates = require('../predicates');
const logger = require('winston');
const Aggregator = require('./Aggregator');
const assert = require('assert');

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
        if (this.agent.last_index > 0 || this.predicatesConf.common) {
            await this.loadState();
        }
        const data = await dataDao.get({
            where: {data_set_id: this.agent.data_set_id},
            offset: this.agent.last_index,
        });
        logger.info(`Start training, data length: ${data.length}`);
        await data.reduce(async (promise, row, i) => {
            await promise;
            if (i === 3000) {
                await this.saveState();
                await this.loadState();
            }
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
        const {
            dataDao,
            operationsDao,
            hypotesesDao,
            overlapsDao,
            Operation,
            Hypotes,
            Overlap,
            Combination,
        } = aggregator;
        const {processing} = this;

        // clear baskets
        Hypotes.basket = [];
        Overlap.basket = [];
        Operation.basket = [];

        /**
         * Load from DB
         */
        const data = this.agent.last_index - processing.maxDepth - processing.stepsAhead > 0 ?
            (await dataDao.get({
                where: {data_set_id: this.agent.data_set_id},
                offset: this.agent.last_index - processing.maxDepth - processing.stepsAhead,
                limit: processing.maxDepth + processing.stepsAhead,
            }))
            : (await dataDao.get({
                where: {data_set_id: this.agent.data_set_id},
                limit: this.agent.last_index,
            }));
        const operations = await operationsDao.get({where: {agent_id: this.agent.id, profit: null}});
        const hypoteses = await hypotesesDao.get({
            where: builder => builder
                .where({predicate_id: this.agent.predicate.id})
                .andWhere('steps_ahead', '<=', processing.stepsAhead),
        });
        const overlaps = await overlapsDao.getLastOverlaps(this.agent.id, processing.hypotesHistsLimit);

        processing.dataService = processing.dataService.init(data, this.agent.last_index - data.length);

        /**
         * Restore hypoteses and combs
         */

        const preCombs = {};
        hypoteses.forEach(hypotes => {
            const newHypotes = new Hypotes(hypotes, false);
            if (!preCombs[hypotes.comb_id]) {
                preCombs[hypotes.comb_id] = {
                    hypoteses: [],
                    all: hypotes.all,
                };
            }
            preCombs[hypotes.comb_id].hypoteses[newHypotes.step - 1] = newHypotes;
        });
        const combs = {};
        Object.keys(preCombs).forEach(comb_id => {
            const string = comb_id
                .split('-')
                .map((id, i) => processing.predicates[i].getString(id)).join(' & ');
            const comb = new Combination({
                id: comb_id,
                all: preCombs[comb_id].all,
                string,
                hypoteses: preCombs[comb_id].hypoteses,
            }, false);
            preCombs[comb_id].hypoteses.forEach(hypotes => {
                hypotes.comb = comb;
                hypotes.setSaved();
            });
            combs[comb.id] = comb;
        });
        processing.combs = combs;

        /**
         * Restore overlaps
         */

        const overlapsAgg = {};

        overlaps.forEach(obj => {
            if (!overlapsAgg[obj.hypotes_id]) {
                overlapsAgg[obj.hypotes_id] = [];
            }
            overlapsAgg[obj.hypotes_id].push(new Overlap(obj, false));
        });
        Object.keys(overlapsAgg).forEach(hypotesId => {
            overlapsAgg[hypotesId] = overlapsAgg[hypotesId].sort((a, b) => a.step - b.step);
        });

        Hypotes.basket.forEach(hypotes => {
            if (!this.predicatesConf.common) {
                assert(overlapsAgg[hypotes.id]);
            }
            hypotes.cumulationHist = overlapsAgg[hypotes.id];
            overlapsAgg[hypotes.id].forEach(overlap => {
                overlap.hypotes = hypotes;
            });
        });

        // restore operations
        if (operations.length) {
            const operation = new Operation(operations[0], false);
            operation.hypotes = Hypotes.basket.find(obj => obj.id === operations[0].hypotes_id);
            processing.currentOperation = operation;
        }
        logger.info('loaded');
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
            this.agent.profit = this.processing.profit;
            this.agent.last_index = this.processing.steps;
            if (this.predicatesConf.common) {
                await Hypotes.saveAll(hypotesesDao, ['id'], client, ['all', 'up', 'cumulation']);
            } else {
                await Hypotes.saveAll(hypotesesDao, ['id'], client);
            }
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
