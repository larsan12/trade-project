const pg = require('pg');
const config = require('./config.json');
const pool = new pg.Pool(config.db);

const Aggregator = require('./services/aggregator');

const aggregator = new Aggregator(pool, config);
const {agentsDao} = aggregator;

const test = async () => {
    const config = {
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
    const agent = await agentsDao.createAgentIfNotExist('sber_test', config, predicateConfig, 300, 300 * 0.08);
    return agent;
};

test()
    .then(console.log)
    .catch(console.trace);
