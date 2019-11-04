/* eslint-disable require-jsdoc */

class Combination {
    constructor(id, string, steps, source) {
        this.id = id;
        this.string = string;
        this.steps = steps;
        if (!source) {
            this.init();
        }
    }

    init() {
        this.all = 0;
        this.up = {};
        this.block = {};
        this.commulateUp = {};
        this.commulateHistUp = {};
        this.down = {};
        this.downBock = {};
        this.commulateDown = {};
        this.commulateHistDown = {};
        for (let i = 1; i <= this.steps; i++) {
            this.up[i] = 0;
            this.block[i] = 0;
            this.commulateUp[i] = 1;
            this.commulateHistUp[i] = [];
            this.down[i] = 0;
            this.commulateDown[i] = 1;
            this.commulateHistDown[i] = [];
        }
    }
}

module.exports = Combination;
