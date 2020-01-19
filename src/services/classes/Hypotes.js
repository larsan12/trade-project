/* eslint-disable require-jsdoc */
const Serilizable = require('./Serilizable');
const agg = require('../Aggregator.js');
const knex = require('knex')({client: 'pg'});

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

    setSaved() {
        this.isNew = false;
        this.copy = {
            all: this.comb.all,
            up: this.up,
            cumulation: this.cumulation,
            block: this.block,
        };
    }

    getFieldsToUpdate(keys) {
        if (this.copy.up !== this.up ||
            this.copy.all !== this.comb.all ||
            this.cumulation !== this.copy.cumulation ||
            this.block !== this.copy.block) {
            const obj = this.getDbObject();
            const result = {
                up: knex.raw(`?? + ${this.up - this.copy.up}`, ['up']),
                all: knex.raw(`?? + ${this.comb.all - this.copy.all}`, ['all']),
                cumulation: knex.raw(`?? * ${this.cumulation / this.copy.cumulation}`, ['cumulation']),
                block: this.block,
            };
            keys.forEach(key => {
                result[key] = obj[key] || this[key];
            });
            return result;
        }
        return false;
    }
}
Hypotes.needUpdates = true;
module.exports = Hypotes;
