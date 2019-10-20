const IPredicate = require('./I-Predicate');

/**
 * @class
 */
class Compare extends IPredicate {
    /**
     * @param {*} id - id of predicate from defineIds
     * @returns {string} - string of predicate
     */
    getString(id) {
        const {field} = this;
        const result = [];
        for (let i = 1; i < id.length - 1; i++) {
            result.push(`(v${id[i - 1]}.${field} <= v${id[i]}.${field}) & 
            (v${id[i]}.${field} <= v${id[i + 1]}.${field})`);
        }
        return result.join(' & ');
    }

    /**
     * @param {Array.<object>} row - trades information
     * @returns {Array.<string>} - string of predicate
     */
    defineIds(row) {
        const {field} = this;
        let id = row
            .map((val, i) => ({
                tempId: i,
                val: parseFloat(val[field]),
            }))
            .sort((a, b) => a.val - b.val);

        if (id.length > (new Set(id.map(val => val.val))).size) {
            return [];
        }
        id = id.reduce((res, curr) => res + curr.tempId, '');
        return [id];
    }
}

module.exports = Compare;
