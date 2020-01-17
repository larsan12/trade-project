/* eslint-disable require-jsdoc */
const Serilizable = require('./Serilizable');
const agg = require('../Aggregator');

class Operation extends Serilizable {
    constructor({from, to, hypotes, time}, isNew) {
        super(isNew);
        this.from = from;
        this.time = time;
        this.to = to;
        this.hypotes = hypotes;
    }

    getDbObject() {
        // TODO hypotes.id undefined
        if (!this.hypotes.id) {
            throw new Error(`hypotes.id is undefined`, this);
        }
        return {
            agent_id: agg.instance.agent.id,
            hypotes_id: this.hypotes.id,
            time: this.time,
            step: this.from,
            length: this.to - this.from,
            profit: this.profit,
        };
    }
}
module.exports = Operation;

