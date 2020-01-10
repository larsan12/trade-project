/* eslint-disable require-jsdoc */
const Hypotes = require('./Hypotes');

class Combination {
    constructor({id, string, steps, all = 0}, isNew = true) {
        this.id = id;
        this.string = string;
        this.steps = steps;
        this.all = all;
        this.isNew = true;
        if (isNew) {
            this.hypoteses = [];
            for (let i = 1; i <= this.steps; i++) {
                // TODO source
                this.hypoteses.push(new Hypotes({
                    comb: this,
                    step: i,
                    string: `${string} --> v(t).close < v(t + ${i}).close`,
                }));
            }
        }
    }
}

module.exports = Combination;
