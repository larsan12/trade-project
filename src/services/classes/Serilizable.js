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
    constructor() {
        if (!baskets[this.constructor.name]) {
            baskets[this.constructor.name] = [];
        }
        baskets[this.constructor.name].push(this);
    }
}

module.exports = Serilizable;

