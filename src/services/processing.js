/* eslint-disable require-jsdoc */
const Combinatorics = require('js-combinatorics');

// TODO count commulation for operations

class Algorithm {
    constructor(config, ...predicates) {
        this.availableData = []
        this.combs = []
        this.predicates = predicates
        this.config = config
        this.stepsAhead = config.stepsAhead
        this.trainLength = this.getTrainLength();
        this.profit = 1
        this.operations = []
        // for report
        this.comb_limit = config.comb_limit || 50
    }

    getTrainLength() {
        return 1886;
    }

    addRow(row) {
        this.availableData.push(row);
    }

    finishOperation() {
        const {currentOperation: operation} = this;
        operation.profit = this.getProfit(operation.from, operation.to);
        this.profit = this.profit * operation.profit;
        this.currentOperation = undefined;
    }

    getProfit(start, end) {
        return ((this.availableData[end].close - this.config.comission * 2)/ this.availableData[start].close)
    }

    /**
     * TODO
     * change getOperations and train order
     * check break
     */

    process(row) {
        this.addRow(row);
        const index = this.availableData.length - 1;
        if (index > this.trainLength) {
            if (this.currentOperation && this.currentOperation.to === index) {
                this.finishOperation();
            }
            if (!this.currentOperation) {
                this.currentOperation = this.getOperation(index);
            }
        }
        if (!this.availableData.slice(-this.stepsAhead).some(row => row.break)) {
            this.train(index - this.stepsAhead)
            if (index >= this.trainLength) {
                this.active = this.getActiveByTopCriteria(index);
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
                        commulation: curr.commulate_up[i],
                        commulationPerStep: (curr.commulate_up[i] - 1)/(curr.up[i] * i),
                        count: curr.all,
                        i: i,
                        comb: curr,
                    })
                }
            }
            return result
            }, [])

            // Use strategy

            result = result.sort((a, b) => b.commulationPerStep - a.commulationPerStep)

            const maxCount = step * this.config.density
            let currCount = 0
            let filteredResult = []
            while (currCount < maxCount && result.length > 0) {
                const curr = result.shift()
                currCount += curr.comb.all
                filteredResult.push(curr)
            }

            filteredResult = filteredResult.map(v => this.getActiveBody(v.comb, v.type, v.i))
            
            if (this.config.borders.length) {
                filteredResult = filteredResult.filter(v => !this.config.borders.some(b => !this.borderIsFine(v.commulate_hist, b)))
            }

            return filteredResult
    }

    borderIsFine(hist, cond) {
        const len = hist.length
        if (cond.border <= len) {
            const commulation = hist.slice(len - cond.border).reduce((a, b) => a * b)
            if (commulation < cond.moreThan) {
                return false
            }
        }
        return true
    }

    bordersIsFine(comb, i, type, bord) {
        let result = true
        const field = type == 'up' ? 'commulate_hist_up' : 'commulate_hist_down'
        const hist = comb[field][i]
        try {
            bord.forEach(cond => {
                if (!this.borderIsFine(hist, cond)) {
                    result = false
                    throw 'not okay'
                }
            })
        } catch (err) {
            if (err != 'not okay') {
                throw err
            }
        }

        return result
    }

    getActiveBody(comb, type, i) {
        return {
            type: type,
            probability: type == 'up' ? comb.up[i]/comb.all : comb.down[i]/comb.all,
            commulationPerStep: type == 'up' ? (comb.commulate_up[i] - 1)/(comb.up[i] * i) : (comb.commulate_down[i] - 1)/(comb.down[i] * i),
            all: comb.all,
            allSteps: type == 'up' ? (comb.up[i] * i) : (comb.down[i] * i),
            string: comb.string,
            commulate_hist: type == 'up' ? comb.commulate_hist_up[i] : comb.commulate_hist_down[i],
            stepsAhead: i,
            id: comb.id,
            comb
        }
    }

    isProfitable(start, end) {
        return this.getProfit(start, end) > 1
    }

    getCombIds(index) {
        try {
            return Combinatorics.cartesianProduct(...this.predicates.map(p => {
                const ids = p.getIds(index, this.availableData)
                if (!ids || !ids.length) {
                    throw new Error('no id')
                }
                return ids
            })).map(arr => arr.join('-'))
        } catch (err) {
            if (err.message === 'no id') {
                return []
            }
            throw err
        }
    }

    train(index) {
        this.getCombIds(index).forEach(combId => {
            if (!this.combs[combId]) {
                this.initCombinationFields(combId)
            }

            const c = this.combs[combId]
            c.all++

            for (let i = 1; i <= this.config.stepsAhead; i++) {
                if (this.availableData.length > index + i) {
                    if (this.isProfitable(index, index + i)) {
                        c.up[i]++
                    } else {
                        c.down[i]++
                    }

                    const toUp = this.getProfit(index, index + i)
                    const toDown = 1 / toUp

                    //TODO make hold on strategy
                    if (c.up_block[i] <= index) {
                        c.commulate_up[i] = c.commulate_up[i] * toUp
                        c.commulate_hist_up[i].push(toUp)
                        c.up_block[i] = index + i
                    }

                    if (c.down_block[i] <= index) {
                        c.commulate_down[i] = c.commulate_down[i] * toDown
                        c.commulate_hist_down[i].push(toDown)
                        c.up_block[i] = index + i
                    }
                } else {
                    console.log()
                }
            }
        })
    }

    getOperation(index) {
        const hypotes = this.getCombIds(index)
            .reduce((res, combId) => res.concat(this.active.filter(obj => obj.comb.id === combId)), [])
            .sort((a, b) => b.commulationPerStep - a.commulationPerStep)[0]
        if (!hypotes) {
            return
        }
        const steps = hypotes.stepsAhead
        const operation = {
            obj: hypotes,
            steps: steps,
            from: index,
            id: hypotes.id,
            to: index + steps,
        }
        this.operations.push(operation)
        return operation;
    }

    initCombinationFields(combId) {
        const result = {
            id: combId,
            all: 0,
            up: {},
            up_block: {},
            commulate_up: {},
            commulate_hist_up: {},
            down: {},
            down_block: {},
            commulate_down: {},
            commulate_hist_down: {},
            string: combId.split('-').map((id, i) => this.predicates[i].getString(id)).join(' & ')
        }
        for (let i = 1; i <= this.config.stepsAhead; i++) {
            result.up[i] = 0
            result.up_block[i] = 0
            result.commulate_up[i] = 1
            result.commulate_hist_up[i] = []

            result.down[i] = 0
            result.down_block[i] = 0
            result.commulate_down[i] = 1
            result.commulate_hist_down[i] = []
        }
        this.combs[combId] = result
    }

    getResultBody() {
        this.operations.forEach(v => {
            delete v.obj.comb
        })
        return {
            profit: this.profit,
            operations: this.operations,
            config: this.config,
            combs: Object.keys(this.combs)
                .sort((a, b) => this.combs[b].all - this.combs[a].all)
                .slice(0, this.comb_limit)
                .map(key => {
                    const v = this.combs[key]
                    return {
                        all: v.all,
                        commulate_down: v.commulate_down,
                        commulate_hist_down: v.commulate_hist_down,
                        commulate_hist_up: v.commulate_hist_up,
                        commulate_up: v.commulate_up,
                        down: v.down,
                        string: v.string,
                        up: v.up,
                        id: v.id
                    }
                })
        }
    }
}

module.exports = Algorithm;
