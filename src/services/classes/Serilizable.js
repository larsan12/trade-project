/* eslint-disable no-undefined */
/* eslint-disable require-jsdoc */
const IDao = require('../../dao/IDao');
const logger = require('winston');

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
     */
    static async saveAll(dao, returning, client) {
        if (!baskets[this.name] || !baskets[this.name].length) {
            logger.info(`saveAll ${this.name}: No data to save`);
            return;
        }

        // SAVE NEW
        const index = baskets[this.name].findIndex(obj => obj.isNew);
        if (index >= 0) {
            const data = baskets[this.name]
                .slice(index)
                .map(d => d.getDbObject());
            logger.info(`saveAll ${this.name} new - ${data.length} rows`);
            if (returning) {
                const returnings = await dao.insert(data, returning, client);
                const basketLen = baskets[this.name].length;
                returnings.reverse().forEach((v, i) => {
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
        if (this.needUpdates) {
            const data = baskets[this.name]
                .slice(0, index)
                .map(d => d.getFieldsToUpdate(dao.defaultParams.key))
                .filter(v => v);
            logger.info(`saveAll ${this.name} update - ${data.length} rows`);
            // TODO multiple update bulk
            await Promise.all(data.map(row => dao.update(row, client)));
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

