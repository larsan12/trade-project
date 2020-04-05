/* eslint-disable require-jsdoc */
const Serilizable = require('./Serilizable');
const agg = require('../Aggregator');

class Operation extends Serilizable {
    constructor(obj, isNew = true) {
        super(isNew);
        if (isNew) {
            const {from, to, hypotes, time} = obj;
            this.from = from;
            this.time = time;
            this.to = to;
            this.hypotes = hypotes;
        } else {
            this.loadStateFromDb(obj);
        }
    }

    loadStateFromDb({hypotes, length, step}) {

    }

    getDbObject() {
        // TODO hypotes.id undefined
        if (!this.hypotes.id) {
            throw new Error(`hypotes.id is undefined`, this);
        }
        return {
            agent_id: agg.instance.agent.id,
            hypotes_id: this.hypotes.id,
            time: this.time,
            step: this.from,
            length: this.to - this.from,
            profit: this.profit,
        };
    }

    setSaved() {
        this.isNew = false;
        this.copy = {
            profit: this.profit,
        };
    }

    getUpdateValues() {
        if (!this.copy.profit && this.profit) {
            return [
                agg.instance.agent.id,
                `to_timestamp(${(new Date(this.time)).getTime() / 1000})`,
                this.profit,
            ];
        }
        return false;
    }

    static getUpdateParams() {
        const keys = agg.instance.operationsDao.defaultParams.key;
        const req = `
            profit = bulk.profit
        `;
        const bulkFields = [...keys, 'profit'];
        return {req, bulkFields};
    }
}
Operation.needUpdates = true;
module.exports = Operation;

