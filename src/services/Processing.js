/* eslint-disable max-nested-callbacks */
/* eslint-disable require-jsdoc */
const Combinatorics = require('js-combinatorics');
const BaseError = require('../components/base-error');
const Combination = require('./classes/Combination');
const Operation = require('./classes/Operation');
const Overlap = require('./classes/Overlap');
const agg = require('./Aggregator.js');


class Processing {
    constructor(config, predicates, syncDbService, agent) {
        this.syncDbService = syncDbService;
        this.predicates = predicates;
        this.config = config;
        this.stepsAhead = config.stepsAhead;
        this.data = [];
        this.combs = [];
        this.trainLength = this.getTrainLength();
        this.profit = agent.profit;
        this.steps = agent.last_index;
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

    getTime(ind) {
        return this.data[ind] && this.data[ind].time;
    }

    async process(row) {
        this.data.push(row);
        this.steps++;
        if (this.steps === 4000) {
            await agg.instance.agentService.saveState();
        }
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
                        commulation: hypotes.cumulation,
                        commulationPerStep: (hypotes.cumulation - 1) / (hypotes.up * hypotes.step),
                        ...hypotes,
                        hypotes,
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
                .filter(v => !this.config.borders.some(b => !this.borderIsFine(v.cumulationHist, b)));
        }

        return filteredResult;
    }

    borderIsFine(hist, cond) {
        const len = hist.length;
        if (cond.border <= len) {
            const commulation = hist.slice(len - cond.border).reduce((a, b) => a * b.value, 1);
            if (commulation < cond.moreThan) {
                return false;
            }
        }
        return true;
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
                        hypotes.cumulation = hypotes.cumulation * commulation;
                        hypotes.cumulationHist.push(new Overlap({
                            time: this.getTime(index),
                            step: index,
                            value: commulation,
                            hypotes,
                        }));
                        hypotes.block = index + hypotes.step;
                    }
                } else {
                    throw new BaseError('unexpected empty data');
                }
            });
        });
    }

    getOperation(index) {
        const active = this.getCombIds(index)
            .reduce((res, combId) => res.concat(this.active.filter(obj => obj.comb.id === combId)), [])
            .sort((a, b) => b.commulationPerStep - a.commulationPerStep)[0];
        if (!active) {
            return;
        }
        const operation = new Operation({
            from: index,
            to: index + active.step,
            hypotes: active.hypotes,
            time: this.getTime(index),
        });
        return operation;
    }

    initCombinationFields(combId) {
        const string = combId.split('-').map((id, i) => this.predicates[i].getString(id)).join(' & ');
        this.combs[combId] = new Combination({
            id: combId,
            string,
            steps: this.config.stepsAhead,
        });
    }

    getResultBody() {
        return {
            profit: this.profit,
            Operation,
            Combination,
            Overlap,
        };
    }
}

module.exports = Processing;
