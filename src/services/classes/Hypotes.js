/* eslint-disable require-jsdoc */
const Serilizable = require('./Serilizable');
const agg = require('../Aggregator').aggregator;

class Hypotes extends Serilizable {
    saveState() {
        const obj = {
            comb_id: this.comb.id,
            predicate_id: agg.agent.predicate_id,
            steps_ahead: this.step,
            string: this.string,
            all: this.comb.all,
            up: this.up,
            block: this.block,
            cumulation: this.cumulation,
            cumulationHist: [...this.cumulationHist],
        };
        this.prevState = obj;
    }

    constructor(comb, step, source) {
        super();
        this.comb = comb;
        this.step = step;
        this.init(source);
    }

    init(source) {
        if (source) {
            this.build(source);
            this.fixState();
        } else {
            this.isNew = true;
            this.setDefault();
        }
    }

    setDefault() {
        this.cumulationHist = [];
        this.up = 0;
        this.block = 0;
        this.cumulation = 1;
    }

    build(source) {
        // TODO
        this.is = 1;
    }
}

module.exports = Hypotes;
