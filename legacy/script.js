/* eslint-disable no-console */
/* eslint-disable require-jsdoc */
const fs = require('fs');
const {Pool} = require('pg');
const {db, schema} = require('../src/config');
const client = new Pool(db);

const getData = () => {
    const res = JSON.parse(fs.readFileSync('./legacy/sberTrainVol1.json').toString());
    return res;
};

const data = getData();
(async () => {
    await client.query(`INSERT INTO ${schema}.data_sets (company, interval) VALUES ('sber_test', 300)`, []);
    const rows = `${data.map(row =>
        `(1,${row.open},${row.min},${row.max},${row.close},${row.volume},to_timestamp(${row.time}))`
    ).join(',\n')};`;
    const req = `INSERT INTO ${schema}.data (data_set_id, open, min, max, close, volume, time) VALUES ${rows}`;
    const result = await client.query(req, []);
})()
    .then(() => {
        console.log('success');
    })
    .catch(console.trace);
