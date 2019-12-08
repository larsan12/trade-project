/* eslint-disable require-jsdoc */
const Serilizable = require('./Serilizable');
const agg = require('../Aggregator').aggregator;

class Operation extends Serilizable {
    constructor({from, to, hypotes, time}, isNew = true) {
        super();
        this.from = from;
        this.time = time;
        this.to = to;
        this.hypotes = hypotes;
        this.isNew = isNew;
    }

    getDbObject() {
        // TODO hypotes.id undefined
        return {
            agent_id: agg.agent.id,
            hypotes_id: this.hypotes.id,
            time: this.time,
            from: this.from,
            steps: this.to - this.from,
            profit: this.profit,
        };
    }
}
module.exports = Operation;

