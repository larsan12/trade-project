/* eslint-disable require-jsdoc */
const Serilizable = require('./Serilizable');
const agg = require('../Aggregator').aggregator;

class Operation extends Serilizable {
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

    saveState() {
        this.prevState = this.getDbObject();
    }

    getDiff() {
        const diff = {};
        const currState = this.getDbObject();
        Object.keys(this.prevState).forEach(field => {
            if (currState[field] !== this.prevState[field] && currState[field]) {
                diff[field] = currState[field];
            }
        });
        return Object.keys(diff).length && diff;
    }

    constructor(from, to, hypotes, time) {
        super();
        this.from = from;
        this.time = time;
        this.to = to;
        this.hypotes = hypotes;
    }
}
module.exports = Operation;

