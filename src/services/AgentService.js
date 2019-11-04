/* eslint-disable require-jsdoc */
const BaseError = require('../components/base-error');
const predicatess = require('../predicates');

class AgentService {
    constructor(aggregator) {
        this.aggregator = aggregator;
        this.promises = [];
    }

    async syncDb() {
        await Promise.all(this.promises);
        this.promises = [];
    }

    getPredicates(predicatesConf) {
        return predicatesConf.map(([predicateName, ...args]) => new predicatess[predicateName](...args));
    }

    async init(processingConfig, predicatesConf) {
        this.processingConfig = processingConfig;
        this.predicatesConf = predicatesConf;
        const {agentsDao, Processing, syncDbService} = this.aggregator;
        this.agent = await agentsDao.createAgentIfNotExist(
            processingConfig,
            predicatesConf
        );
        this.predicatess = this.getPredicates(predicatesConf);
        this.processing = new Processing(processingConfig, this.predicatess, syncDbService);
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
        const {dataDao, agentsDao} = this.aggregator;
        const data = await dataDao.get({data_set_id: this.agent.data_set_id}, this.agent.last_index);
        data.forEach((row, i) => {
            if (i > 0 && !this.isTimeInRange(data[i - 1], row)) {
                row.break = true;
            }
            this.processing.process(row);
        });
        await agentsDao.update({id: this.agent.id}, {last_index: this.agent.last_index + data.length});
        const result = this.processing.getResultBody();
        return result;
    }
}

module.exports = AgentService;
