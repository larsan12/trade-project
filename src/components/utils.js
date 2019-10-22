
/**
 * @param {*} obj - object or array
 * @description - returns object with sorted keys
 * @returns {*} - the same as obj
 */
const sortObject = obj => {
    let result;
    if (typeof obj === 'object') {
        if (Array.isArray(obj)) {
            result = obj.map(val =>
                sortObject(val)
            );
            result = result.sort((a, b) =>
                JSON.stringify(a) < JSON.stringify(b)
            );
        } else {
            result = Object.keys(obj).sort().reduce((res, key) => {
                res[key] = sortObject(obj[key]);
                return res;
            }, {});
        }
        return result;
    }
    return obj;
};

/**
 * @param {*} obj - object or array
 * @description - returns equal string for equal objects
 * @returns {string} - json string
 */
const serializeObject = obj => JSON.stringify(sortObject(obj));

module.exports.sortObject = sortObject;
module.exports.serializeObject = serializeObject;
