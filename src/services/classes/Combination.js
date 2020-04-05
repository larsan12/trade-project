/* eslint-disable require-jsdoc */
const Hypotes = require('./Hypotes');
const assert = require('assert');

class Combination {
    constructor({id, string, steps, all = 0, hypoteses}, isNew = true) {
        this.id = id;
        this.string = string;
        this.all = all;
        if (isNew) {
            assert(steps);
            this.hypoteses = [];
            for (let i = 1; i <= steps; i++) {
                // TODO source
                this.hypoteses.push(new Hypotes({
                    comb: this,
                    step: i,
                    string: `${string} --> v(t).close < v(t + ${i}).close`,
                }));
            }
        } else {
            assert(hypoteses);
            this.hypoteses = hypoteses;
        }
    }
}

module.exports = Combination;
