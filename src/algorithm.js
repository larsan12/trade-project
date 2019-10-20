/* eslint-disable require-jsdoc */
const Combinatorics = require('js-combinatorics');


class Algorithm {
    constructor(config, data, ...predicates) {
        this.availableData = [];
        this.combs = [];
        this.predicates = predicates;
        this.config = config;
        this.data = data;
        this.stepsAhead = config.stepsAhead;
        // for report
        this.comb_limit = config.comb_limit || 50;
    }

    processing() {
        console.log('Start processing');
        this.train();
        this.checkHypotheses();
        return this.getResultBody();
    }

    pushNewData(numberRows) {
        this.availableData = this.availableData.concat(
            this.data.slice(this.availableData.length, this.availableData.length + numberRows)
        );
    }

    // break у данных, если с предыдущими данными есть разрыв
    getNextIndex(ind) {
        let i = ind + 1
        // check break flag
        while(this.data.slice(i + 1, i + this.stepsAhead + 1).some(val => val.break)) {
            const lastBreak = this.data.slice(i + 1, i + this.stepsAhead + 1).map(v => v.break).lastIndexOf(true)
            i = (lastBreak !== - 1 ? lastBreak : 1) + i + 1
        }
        if (i % 100 === 0) {
            console.log(`progress: ${i}/${this.data.length}`)
        }
        this.pushNewData(i - ind)
        return i
    }

    train() {
        console.log('Start training')
        const len = parseInt(this.data.length * this.config.trainVolume)
        this.pushNewData(this.stepsAhead + 1)
        let i = 0
        while (i <= len) {
            this.processRow(i)
            i = this.getNextIndex(i)
        }
        // set active
        this.active = this.getActiveByTopCriteria(len)
    }

    checkHypotheses() {
        this.profit = 1
        this.operations = []
        this.pushNewData(1)
        let i = this.availableData.length - this.stepsAhead
        while (i < this.data.length) {
            if (!this.nextStepFrom || this.nextStepFrom <= i) {
                this.checkRow(i)
            }
            this.processRow(i - this.stepsAhead * 2, false)
            i = this.getNextIndex(i)
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

    getProfit(start, end) {
        return ((this.data[end].close - this.config.comission * 2)/ this.data[start].close)
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

    processRow(index, isTrain = true) {
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

        // remove unactual active hypoteses
        if (!isTrain) {
            this.active = this.getActiveByTopCriteria(index)
        }
    }

    checkRow(index) {
        const hypotes = this.getCombIds(index)
            .reduce((res, combId) => res.concat(this.active.filter(obj => obj.comb.id === combId)), [])
            .sort((a, b) => b.commulationPerStep - a.commulationPerStep)[0]
        if (!hypotes) {
            return
        }
        const steps = hypotes.stepsAhead
        const operation = {
            profit: this.getProfit(index, index + steps),
            obj: hypotes,
            steps: steps,
            from: index,
            id: hypotes.id,
            to: index + steps,
        }
        this.profit = this.profit * operation.profit
        this.operations.push(operation)
        this.nextStepFrom = index + steps
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

module.exports = Algorithm