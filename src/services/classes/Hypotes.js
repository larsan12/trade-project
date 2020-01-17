/* eslint-disable require-jsdoc */
const Serilizable = require('./Serilizable');
const agg = require('../Aggregator.js');

class Hypotes extends Serilizable {
    constructor({comb, string, step, up = 0, block = 0, cumulation = 1, id}, isNew) {
        super(isNew);
        this.comb = comb;
        this.step = step;
        this.cumulationHist = [];
        this.up = up;
        this.string = string;
        this.block = block;
        this.cumulation = cumulation;
        this.id = id;
    }

    getDbObject() {
        return {
            comb_id: this.comb.id,
            predicate_id: agg.instance.agent.predicate_id,
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
