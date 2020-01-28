const logger = require('./components/logger');
const config = require('./config.json');
const AgentService = require('./services/AgentService');

const test = async () => {
    const algConfig = {
        company: 'sber_test',
        divergence: 300 * 0.08,
        interval: 300,
        // algo:
        noDown: true,
        density: 0.3,
        minCount: 10,
        borders: [
            {
                border: 5,
                moreThan: 1,
            },
            {
                border: 20,
                moreThan: 1,
            },
        ],
        trainVolume: 0.2,
        stepsAhead: 3,
        comission: 0.00034,
    };
    const predicateConfig = {
        config: [
            ['Compare', 'open', 3],
            ['Compare', 'close', 3],
        ],
        common: false,
    };

    const agentService = new AgentService(config);

    await agentService.init(algConfig, predicateConfig);
};

test()
    .then(() => logger.info('finished'))
    .catch(logger.trace)
    .then(process.exit);
