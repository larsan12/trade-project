/* eslint-disable require-jsdoc */
const Serilizable = require('./Serilizable');
const agg = require('../Aggregator.js');

class Hypotes extends Serilizable {
    constructor(params, isNew = true) {
        super(isNew);
        if (isNew) {
            const {comb, string, step, up = 0, block = 0, cumulation = 1} = params;
            this.comb = comb;
            this.step = step;
            this.cumulationHist = [];
            this.up = up;
            this.string = string;
            this.block = block;
            this.cumulation = cumulation;
        } else {
            // restore from DB
            const {string, steps_ahead, up, block, cumulation} = params;
            this.step = steps_ahead;
            this.cumulationHist = [];
            this.up = up;
            this.string = string;
            this.block = block;
            this.cumulation = cumulation;
        }
    }

    set all(val) {
        this.comb.all = val;
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

    static getUpdateParams(common) {
        const keys = agg.instance.hypotesesDao.defaultParams.key;
        let req = `
            up = t.up + bulk.up,
            "all" = t."all" + bulk."all",
            cumulation = t.cumulation * bulk.cumulation
        `;
        if (!common) {
            req = `${req},
            block = bulk.block
            `;
        }
        const bulkFields = [...keys, 'up', 'all', 'cumulation'];
        if (!common) {
            bulkFields.push('block');
        }
        return {req, bulkFields};
    }

    getUpdateValues(common) {
        if (this.copy.up !== this.up ||
            this.copy.all !== this.comb.all ||
            this.cumulation !== this.copy.cumulation ||
            this.block !== this.copy.block || common) {
            const keys = agg.instance.hypotesesDao.defaultParams.key;
            const obj = this.getDbObject();
            let values = [];
            keys.forEach(key => {
                values.push(obj[key] || this[key]);
            });
            values = values.concat([
                this.up - this.copy.up,
                this.comb.all - this.copy.all,
                this.cumulation / this.copy.cumulation,
            ]);
            if (!common) {
                values.push(this.block);
            }
            return values;
        }
        return false;
    }
}
Hypotes.needUpdates = true;
module.exports = Hypotes;
