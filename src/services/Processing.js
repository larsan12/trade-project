/* eslint-disable require-jsdoc */
const Combinatorics = require('js-combinatorics');
const BaseError = require('../components/base-error');

// TODO count commulation for operations

class Processing {
    constructor(config, predicates) {
        this.data = [];
        this.combs = [];
        this.predicates = predicates;
        this.config = config;
        this.stepsAhead = config.stepsAhead;
        this.trainLength = this.getTrainLength();
        this.profit = 1;
        this.operations = [];
    }

    getTrainLength() {
        return 1886;
    }

    finishOperation() {
        const {currentOperation: operation} = this;
        operation.profit = this.getProfit(operation.from, operation.to);
        this.profit = this.profit * operation.profit;
        this.currentOperation = null;
    }

    getProfit(start, end) {
        return ((this.data[end].close - this.config.comission * 2) / this.data[start].close);
    }

    process(row) {
        this.data.push(row);
        const index = this.data.length - 1;
        if (!this.data.slice(-this.stepsAhead).some(row => row.break)) {
            this.train(index - this.stepsAhead);
            if (index > this.trainLength) {
                this.active = this.getActiveByTopCriteria(index);
            }
        }
        if (index > this.trainLength) {
            if (this.currentOperation && this.currentOperation.to === index) {
                this.finishOperation();
            }
            if (!this.currentOperation) {
                this.currentOperation = this.getOperation(index);
            }
        }
    }

    getActiveByTopCriteria(step) {
        // generate hypoteses
        let result = Object.keys(this.combs).reduce((result, key) => {
            const curr = this.combs[key];
            // Check minCount
            if (curr.all > this.config.minCount) {
                for (let i = 1; i <= this.config.stepsAhead; i++) {
                    result.push({
                        type: 'up',
                        probability: curr.up[i] / curr.all,
                        commulation: curr.commulateUp[i],
                        commulationPerStep: (curr.commulateUp[i] - 1) / (curr.up[i] * i),
                        count: curr.all,
                        i,
                        comb: curr,
                    });
                }
            }
            return result;
        }, []);

        // Use strategy

        result = result.sort((a, b) => b.commulationPerStep - a.commulationPerStep);

        const maxCount = step * this.config.density;
        let currCount = 0;
        let filteredResult = [];
        while (currCount < maxCount && result.length > 0) {
            const curr = result.shift();
            currCount += curr.comb.all;
            filteredResult.push(curr);
        }

        filteredResult = filteredResult.map(v => this.getActiveBody(v.comb, v.type, v.i));

        if (this.config.borders.length) {
            filteredResult = filteredResult
                .filter(v => !this.config.borders.some(b => !this.borderIsFine(v.commulateHist, b)));
        }

        return filteredResult;
    }

    borderIsFine(hist, cond) {
        const len = hist.length;
        if (cond.border <= len) {
            const commulation = hist.slice(len - cond.border).reduce((a, b) => a * b);
            if (commulation < cond.moreThan) {
                return false;
            }
        }
        return true;
    }

    bordersIsFine(comb, i, type, bord) {
        let result = true;
        const field = type === 'up' ? 'commulateHistUp' : 'commulateHistDown';
        const hist = comb[field][i];
        try {
            bord.forEach(cond => {
                if (!this.borderIsFine(hist, cond)) {
                    result = false;
                    throw 'not okay';
                }
            });
        } catch (err) {
            if (err !== 'not okay') {
                throw err;
            }
        }

        return result;
    }

    getActiveBody(comb, type, i) {
        return {
            type,
            probability: type === 'up' ? comb.up[i] / comb.all : comb.down[i] / comb.all,
            commulationPerStep: type === 'up' ? (comb.commulateUp[i] - 1) / (comb.up[i] * i) : (comb.commulateDown[i] - 1) / (comb.down[i] * i),
            all: comb.all,
            allSteps: type === 'up' ? (comb.up[i] * i) : (comb.down[i] * i),
            string: comb.string,
            commulateHist: type === 'up' ? comb.commulateHistUp[i] : comb.commulateHistDown[i],
            stepsAhead: i,
            id: comb.id,
            comb,
        };
    }

    isProfitable(start, end) {
        return this.getProfit(start, end) > 1;
    }

    getCombIds(index) {
        try {
            return Combinatorics.cartesianProduct(...this.predicates.map(p => {
                const ids = p.getIds(index, this.data);
                if (!ids || !ids.length) {
                    throw new Error('no id');
                }
                return ids;
            })).map(arr => arr.join('-'));
        } catch (err) {
            if (err.message === 'no id') {
                return [];
            }
            throw err;
        }
    }

    train(index) {
        this.getCombIds(index).forEach(combId => {
            if (!this.combs[combId]) {
                this.initCombinationFields(combId);
            }

            const c = this.combs[combId];
            c.all++;

            for (let i = 1; i <= this.config.stepsAhead; i++) {
                if (this.data.length > index + i) {
                    if (this.isProfitable(index, index + i)) {
                        c.up[i]++;
                    } else {
                        c.down[i]++;
                    }

                    const toUp = this.getProfit(index, index + i);
                    const toDown = 1 / toUp;

                    // TODO make hold on strategy
                    if (c.upBlock[i] <= index) {
                        c.commulateUp[i] = c.commulateUp[i] * toUp;
                        c.commulateHistUp[i].push(toUp);
                        c.upBlock[i] = index + i;
                    }

                    if (c.downBock[i] <= index) {
                        c.commulateDown[i] = c.commulateDown[i] * toDown;
                        c.commulateHistDown[i].push(toDown);
                        c.upBlock[i] = index + i;
                    }
                } else {
                    throw new BaseError('unexpected empty data');
                }
            }
        });
    }

    getOperation(index) {
        const hypotes = this.getCombIds(index)
            .reduce((res, combId) => res.concat(this.active.filter(obj => obj.comb.id === combId)), [])
            .sort((a, b) => b.commulationPerStep - a.commulationPerStep)[0];
        if (!hypotes) {
            return;
        }
        const steps = hypotes.stepsAhead;
        const operation = {
            obj: hypotes,
            steps,
            from: index,
            id: hypotes.id,
            to: index + steps,
        };
        this.operations.push(operation);
        return operation;
    }

    initCombinationFields(combId) {
        const result = {
            id: combId,
            all: 0,
            up: {},
            upBlock: {},
            commulateUp: {},
            commulateHistUp: {},
            down: {},
            downBock: {},
            commulateDown: {},
            commulateHistDown: {},
            string: combId.split('-').map((id, i) => this.predicates[i].getString(id)).join(' & '),
        };
        for (let i = 1; i <= this.config.stepsAhead; i++) {
            result.up[i] = 0;
            result.upBlock[i] = 0;
            result.commulateUp[i] = 1;
            result.commulateHistUp[i] = [];

            result.down[i] = 0;
            result.downBock[i] = 0;
            result.commulateDown[i] = 1;
            result.commulateHistDown[i] = [];
        }
        this.combs[combId] = result;
    }

    getResultBody(combLimit = 50) {
        this.operations.forEach(v => {
            delete v.obj.comb;
        });
        return {
            profit: this.profit,
            operations: this.operations,
            config: this.config,
            combs: Object.keys(this.combs)
                .sort((a, b) => this.combs[b].all - this.combs[a].all)
                .slice(0, combLimit)
                .map(key => {
                    const v = this.combs[key];
                    return {
                        all: v.all,
                        commulateDown: v.commulateDown,
                        commulateHistDown: v.commulateHistDown,
                        commulateHistUp: v.commulateHistUp,
                        commulateUp: v.commulateUp,
                        down: v.down,
                        string: v.string,
                        up: v.up,
                        id: v.id,
                    };
                }),
        };
    }
}

module.exports = Processing;
