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
            const comb = this.combs[key];
            // Check minCount
            if (comb.all > this.config.minCount) {
                comb.hypoteses.forEach(hypotes => {
                    result.push({
                        probability: hypotes.up / comb.all,
                        commulation: hypotes.commulate,
                        commulationPerStep: (hypotes.commulate - 1) / (hypotes.up * hypotes.step),
                        ...hypotes,
                    });
                });
            }
            return result;
        }, []);

        // Use strategy

        result = result.sort((a, b) => b.commulationPerStep - a.commulationPerStep);

        const maxCount = step * this.config.density;
        let currCount = 0;
        let filteredResult = [];
        // TODO фильтровать только для разных предикатов.
        while (currCount < maxCount && result.length > 0) {
            const curr = result.shift();
            currCount += curr.comb.all;
            filteredResult.push(curr);
        }

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
            const comb = this.combs[combId];
            comb.all++;
            comb.hypoteses.forEach(hypotes => {
                if (this.data.length > index + hypotes.step) {
                    if (this.isProfitable(index, index + hypotes.step)) {
                        hypotes.up++;
                    }
                    const commulation = this.getProfit(index, index + hypotes.step);

                    // TODO make hold on strategy
                    if (hypotes.block <= index) {
                        hypotes.commulate = hypotes.commulate * commulation;
                        hypotes.commulateHist.push(commulation);
                        hypotes.block = index + hypotes.step;
                    }
                } else {
                    throw new BaseError('unexpected empty data');
                }
            });
        });
    }

    getOperation(index) {
        const hypotes = this.getCombIds(index)
            .reduce((res, combId) => res.concat(this.active.filter(obj => obj.comb.id === combId)), [])
            .sort((a, b) => b.commulationPerStep - a.commulationPerStep)[0];
        if (!hypotes) {
            return;
        }
        const operation = {
            hypotes,
            from: index,
            id: hypotes.id,
            to: index + hypotes.step,
        };
        this.operations.push(operation);
        return operation;
    }

    initCombinationFields(combId) {
        const string = combId.split('-').map((id, i) => this.predicates[i].getString(id)).join(' & ');
        this.combs[combId] = new Combination(combId, string, this.config.stepsAhead);
    }

    getResultBody(combLimit = 50) {
        return {
            profit: this.profit,
            operations: this.operations,
            config: this.config,
            combs: Object.keys(this.combs)
                .sort((a, b) => this.combs[b].all - this.combs[a].all)
                .slice(0, combLimit)
                .map(key => {
                    const comb = this.combs[key];
                    return {
                        all: comb.all,
                    };
                }),
        };
    }
}

module.exports = Processing;
