/* eslint-disable require-jsdoc */
const Serilizable = require('./Serilizable');
const agg = require('../Aggregator');

class Overlap extends Serilizable {
    constructor({time, step, value, hypotes}, isNew = true) {
        super(isNew);
        this.time = time;
        this.step = step;
        this.value = value;
        this.hypotes = hypotes;
    }

    getDbObject() {
        // TODO hypotes.id undefined
        return {
            time: this.time,
            step: this.step,
            value: this.value,
            hypotes_id: this.hypotes.id,
            agent_id: agg.instance.agent.id,
        };
    }
}

module.exports = Overlap;
