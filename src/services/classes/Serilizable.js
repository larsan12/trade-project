/* eslint-disable require-jsdoc */

const baskets = {};
class Serilizable {
    static get basket() {
        if (baskets[this.name]) {
            return baskets[this.name];
        }
        baskets[this.name] = [];
        return baskets[this.name];
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

