/* eslint-disable require-jsdoc */
const basket = [];

class Hypotes {
    static get basket() {
        return basket;
    }

    constructor(comb, step, source) {
        this.comb = comb;
        this.step = step;
        this.init(source);
        Hypotes.basket.push(this);
    }

    init(source) {
        if (source) {
            this.build(source);
            this.fixState();
        } else {
            this.isNew = true;
            this.setDefault();
        }
    }

    setDefault() {
        this.commulateHist = [];
        this.up = 0;
        this.block = 0;
        this.commulate = 1;
    }

    build(source) {
        // TODO
        this.is = 1;
    }
}

module.exports = Hypotes;
