const logger = require('./components/logger');
const Aggregator = require('./services/Aggregator');
const config = require('./config.json');
const aggregator = new Aggregator(config);
const agentService = require('./services/AgentService');

const test = async () => {
    const config = {
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
    const predicateConfig = [
        ['Compare', 'open', 3],
        ['Compare', 'close', 3],
    ];

    await agentService.init(config, predicateConfig);
};

test()
    .then(logger.info)
    .catch(logger.trace)
    .then(process.exit);
