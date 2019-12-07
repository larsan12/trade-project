/* eslint-disable require-jsdoc */
const Serilizable = require('./Serilizable');
const Hypotes = require('./Hypotes');

class Combination extends Serilizable {
    constructor(id, string, steps, source) {
        super();
        this.id = id;
        this.string = string;
        this.steps = steps;
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
        this.all = 0;
        this.hypoteses = [];
        for (let i = 1; i <= this.steps; i++) {
            // TODO source
            this.hypoteses.push(new Hypotes(this, i, null, this.agg));
        }
    }

    build(source) {
        // TODO
        this.is = 1;
    }
}

module.exports = Combination;
