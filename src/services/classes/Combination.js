/* eslint-disable require-jsdoc */
const Hypotes = require('./Hypotes');

const basket = [];
class Combination {
    static get basket() {
        return basket;
    }

    constructor(id, string, steps, source) {
        this.id = id;
        this.string = string;
        this.steps = steps;
        this.init(source);
        Combination.basket.push(this);
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
            this.hypoteses.push(new Hypotes(this, i, null));
        }
    }

    build(source) {
        // TODO
        this.is = 1;
    }
}

module.exports = Combination;
