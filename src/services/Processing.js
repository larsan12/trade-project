/* eslint-disable max-nested-callbacks */
/* eslint-disable require-jsdoc */
const Combinatorics = require('js-combinatorics');
const BaseError = require('../components/base-error');
const Combination = require('./classes/Combination');

class Processing {
    constructor(config, predicates, syncDbService) {
        this.syncDbService = syncDbService;
        this.predicates = predicates;
        this.config = config;
        this.stepsAhead = config.stepsAhead;
        this.data = [];
        this.combs = [];
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
                        probability: curr.up[i] / curr.all,
                        commulation: curr.commulate[i],
                        commulationPerStep: (curr.commulate[i] - 1) / (curr.up[i] * i),
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

        filteredResult = filteredResult.map(v => this.getActiveBody(v.comb, v.i));

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

    getActiveBody(comb, i) {
        return {
            probability: comb.up[i] / comb.all,
            commulationPerStep: (comb.commulate[i] - 1) / (comb.up[i] * i),
            all: comb.all,
            allSteps: comb.up[i] * i,
            string: comb.string,
            commulateHist: comb.commulateHist[i],
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
                    }

                    const toUp = this.getProfit(index, index + i);
                    const toDown = 1 / toUp;

                    // TODO make hold on strategy
                    if (c.block[i] <= index) {
                        c.commulate[i] = c.commulate[i] * toUp;
                        c.commulateHist[i].push(toUp);
                        c.block[i] = index + i;
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
        const string = combId.split('-').map((id, i) => this.predicates[i].getString(id)).join(' & ');
        this.combs[combId] = new Combination(combId, string, this.config.stepsAhead);
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
                        commulateHist: v.commulateHist,
                        commulate: v.commulate,
                        down: v.all - v.up,
                        string: v.string,
                        up: v.up,
                        id: v.id,
                    };
                }),
        };
    }
}

module.exports = Processing;
