const fs = require('fs')
const { Pool } = require('pg')
const knex = require('knex')({client: 'pg'});


const client = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'main',
    password: 'postgres',
    port: 5432,
  })

async function getData() {
    const res = JSON.parse(fs.readFileSync('./testDataMining/data/sberTrainVol1.json').toString())
    return res
}

getData().then(async data => {
    const rows = data.map(row => 
        `(1,${row.open},${row.min},${row.max},${row.close},${row.volume},to_timestamp(${row.time}))`
       ).join(',\n') + ';';
    const req = `INSERT INTO test.data (data_set_id, open, min, max, close, volume, time) VALUES ${rows}`;
    const result = await client.query(req, []);
})
.then(() => {
    console.log('success')
})
.catch(err => {
    console.trace(err)
})