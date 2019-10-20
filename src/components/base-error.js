/**
 * @class BaseError
 */
class BaseError extends Error {
    /**
     * @param {string} message - for react forms
     * @param {object} error - error object
     * @param {number} code? - ustom code
     */
    constructor(message, error, code = 500) {
        super();
        this.code = code;
        this.error = error;
        this.message = message;
    }
}

module.exports = BaseError;
