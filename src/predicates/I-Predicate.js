/**
 * @class IPredicate
 * @description parent for all predicates
 */
class IPredicate {
    /**
     * @param {string} field - open|close|min|max|volume|time or different
     * @param {number} depth - depht of analysing
     */
    constructor(field, depth) {
        this.field = field;
        this.depth = depth;
    }
    /**
     * @param {*} index - index from data
     * @param {*} data - data for analysing
     * @returns {Array<string>} - array of combinations ids
     */
    getIds(index, data) {
        const {depth} = this;
        if (index - depth + 1 < 0) {
            return false;
        }
        if (index >= data.length) {
            throw new Error('index out of available data');
        }
        const row = data.slice(index - depth + 1, index + 1);
        // check break
        // break ставится, если с предыдущими данными есть разрыв
        if (row.slice(1).some(val => val.break)) {
            return false;
        }
        return this.defineIds(row);
    }
    /**
     * @description method should be overrided in child
     * @throws {Error}
     */
    defineIds() {
        throw new Error('should be override');
    }
}

module.exports = IPredicate;
