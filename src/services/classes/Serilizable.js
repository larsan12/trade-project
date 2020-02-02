/* eslint-disable no-undefined */
/* eslint-disable require-jsdoc */
const IDao = require('../../dao/IDao');
const logger = require('winston');
const assert = require('assert');

const baskets = {};
class Serilizable {
    static get basket() {
        if (baskets[this.name]) {
            return baskets[this.name];
        }
        baskets[this.name] = [];
        return baskets[this.name];
    }

    /**
     * @param {IDao} dao - IDao child
     * @param {String} returning - returning from db with saving in class
     * @param {Object} client - pg client for transactions
     * @param {String} returningUpdate - returning from db with updating in class
     * @description if returningUpdate defined, then it updates every row in db(even if nothing update)
     * and set returning value, getUpdateValues(false) should return only rows with changed fields,
     * getUpdateValues(true) should return all rows
     */
    static async saveAll(dao, returning, client, returningUpdate) {
        if (!baskets[this.name] || !baskets[this.name].length) {
            logger.info(`saveAll ${this.name}: No data to save`);
            return;
        }

        // SAVE NEW
        let index = baskets[this.name].findIndex(obj => obj.isNew);
        if (index >= 0) {
            const data = baskets[this.name]
                .slice(index)
                .map(d => d.getDbObject());
            logger.info(`saveAll new ${this.name} - ${data.length} rows`);
            if (returning) {
                const result = await dao.insert(data, returning, client);
                const basketLen = baskets[this.name].length;
                result.reverse().forEach((v, i) => {
                    const obj = baskets[this.name][basketLen - i - 1];
                    returning.forEach(key => {
                        obj[key] = v[key];
                    });
                });
            } else {
                await dao.insert(data, null, client);
            }
        }

        // UPDATE OLD
        index = index === -1 ? baskets[this.name].length : index;
        if (this.needUpdates) {
            if (returningUpdate) {
                const data = baskets[this.name]
                    .slice(0, index)
                    .map(d => d.getUpdateValues(true))
                    .filter(v => v);

                assert.strictEqual(data.length, index);

                if (data.length) {
                    logger.info(`saveAll update ${this.name} - ${data.length} rows`);
                    const result = await dao.bulkUpdate(this.getUpdateParams(true), data, client);
                    result.forEach((v, i) => {
                        const obj = baskets[this.name][i];
                        assert.strictEqual(obj.id, v.id);
                        returningUpdate.forEach(key => {
                            obj[key] = v[key];
                        });
                    });
                }
            } else {
                const data = baskets[this.name]
                    .slice(0, index)
                    .map(d => d.getUpdateValues())
                    .filter(v => v);
                if (data.length) {
                    logger.info(`saveAll update ${this.name} - ${data.length} rows`);
                    await dao.bulkUpdate(this.getUpdateParams(), data, client);
                }
            }
        }

        baskets[this.name].forEach(obj => obj.setSaved());
    }

    setSaved() {
        this.isNew = false;
    }

    getDbObject() {
        throw new Error('getDbObject must be override');
    }

    saveState() {
        this.prevState = this.getDbObject();
    }

    getDiff() {
        const diff = {};
        const currState = this.getDbObject();
        if (this.isNew) {
            return currState;
        }
        Object.keys(this.prevState).forEach(field => {
            if (currState[field] !== this.prevState[field] && currState[field]) {
                diff[field] = currState[field];
            }
        });
        return Object.keys(diff).length && diff;
    }

    constructor(isNew = true) {
        this.isNew = isNew;
        if (!baskets[this.constructor.name]) {
            baskets[this.constructor.name] = [];
        }
        baskets[this.constructor.name].push(this);
    }
}

module.exports = Serilizable;

