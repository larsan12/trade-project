/* eslint-disable require-jsdoc */
const Serilizable = require('./Serilizable');
const agg = require('../Aggregator').aggregator;

class Overlap extends Serilizable {
    constructor({time, step, value, hypotes}, isNew = true) {
        super();
        this.time = time;
        this.step = step;
        this.value = value;
        this.hypotes = hypotes;
        this.isNew = isNew;
    }

    getDbObject() {
        // TODO hypotes.id undefined
        return {
            time: this.time,
            step: this.step,
            value: this.value,
            hypotes_id: this.hypotes.id,
            agent_id: agg.agent.id,
        };
    }
}

module.exports = Overlap;
