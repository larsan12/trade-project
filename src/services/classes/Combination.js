/* eslint-disable require-jsdoc */
const basket = [];
class Combination {
    static get basket() {
        return basket;
    }

    constructor(id, string, steps, source) {
        this.id = id;
        this.string = string;
        this.steps = steps;
        this.init(source);
        Combination.basket.push(this);
        this.fieldsCompare = [
            'all',
            'up',
            'block',
            'commulate',
            'commulateHist',
        ];
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
        this.all = 0;
        this.up = {};
        this.block = {};
        this.commulate = {};
        this.commulateHist = {};
        for (let i = 1; i <= this.steps; i++) {
            this.up[i] = 0;
            this.block[i] = 0;
            this.commulate[i] = 1;
            this.commulateHist[i] = [];
        }
    }

    build(source) {
        // TODO
        this.is = 1;
    }

    fixState() {

    }
}

module.exports = Combination;
