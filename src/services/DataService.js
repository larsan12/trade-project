/* eslint-disable require-jsdoc */


class DataService {
    init(data, firstIndex) {
        this.data = data;
        this.firstIndex = firstIndex;
        return this;
    }

    get length() {
        return this.data.length + this.firstIndex;
    }

    get(i) {
        return this.data[i - this.firstIndex];
    }

    push(i) {
        this.data.push(i);
    }

    concat(arr) {
        this.data.concat(arr);
    }

    slice(...args) {
        const args2 = args.map(arg => (arg > 0 ? (arg - this.firstIndex) : arg));
        return this.data.slice(...args);
    }
}

module.exports = DataService;
