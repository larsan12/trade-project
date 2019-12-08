/* eslint-disable require-jsdoc */
const Serilizable = require('./Serilizable');
const agg = require('../Aggregator').aggregator;

class Hypotes extends Serilizable {
    constructor({comb, step, up = 0, block = 0, cumulation = 1, id}, isNew = true) {
        super();
        this.comb = comb;
        this.step = step;
        this.cumulationHist = [];
        this.up = up;
        this.block = block;
        this.cumulation = cumulation;
        this.id = id;
        this.isNew = isNew;
    }

    getDbObject() {
        return {
            comb_id: this.comb.id,
            predicate_id: agg.agent.predicate_id,
            steps_ahead: this.step,
            string: this.string,
            all: this.comb.all,
            up: this.up,
            block: this.block,
            cumulation: this.cumulation,
        };
    }
}

module.exports = Hypotes;
