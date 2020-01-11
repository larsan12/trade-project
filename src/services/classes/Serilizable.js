/* eslint-disable require-jsdoc */
const IDao = require('../../dao/IDao');

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
     */
    static async saveAll(dao, returning) {
        if (!baskets[this.name] || !baskets[this.name].length) {
            return;
        }
        const data = baskets[this.name].map(d => d.getDbObject());
        if (returning) {
            const returnings = await dao.insert(data, returning);
            returnings.forEach((v, i) => {
                const obj = baskets[this.name][i];
                obj[returning] = v[returning];
            });
        } else {
            await dao.insert(data);
        }
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

    constructor() {
        if (!baskets[this.constructor.name]) {
            baskets[this.constructor.name] = [];
        }
        baskets[this.constructor.name].push(this);
    }
}

module.exports = Serilizable;

