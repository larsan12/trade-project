const knex = require('knex')({client: 'pg'});
const queries = require('./queries');
const BaseError = require('../components/base-error');
const logger = require('winston');

/**
 * @class
 */
class IDao {
    /**
     * @constructor
     * @param {Object} pool - pool
     * @param {string} schema - schema
     * @param {Object} agg - aggregator
     * @param {String} table - table
     * @param {Object} defaultParams - defaultParams
     */
    constructor(pool, schema, agg, table, defaultParams = {}) {
        this.schema = schema;
        this.pool = pool;
        this.knex = knex;
        this.queries = queries;
        this.agg = agg;
        this.tableName = table;

        /*
         * create and decorate knex instances
         */
        this.agents = () => this.decorate(knex.withSchema(this.schema).from('agents'));
        this.dataSets = () => this.decorate(knex.withSchema(this.schema).from('data_sets'));
        this.predicates = () => this.decorate(knex.withSchema(this.schema).from('predicates'));
        this.data = () => this.decorate(knex.withSchema(this.schema).from('data'));
        this.hypoteses = () => this.decorate(knex.withSchema(this.schema).from('hypoteses'));
        this.hypotesesHist = () => this.decorate(knex.withSchema(this.schema).from('hypoteses_hist'));
        this.operations = () => this.decorate(knex.withSchema(this.schema).from('operations'));
        this.overlaps = () => this.decorate(knex.withSchema(this.schema).from('overlaps'));

        if (table) {
            this.table = () => this[table]();
        }

        this.defaultParams = defaultParams;
    }
    /**
     * @param {Object} where - where
     * @param {Number} offset - offset
     * @param {Array} order - order
     * @returns {Promise.<Array>} - array of objects
     */
    async get(where, offset, order) {
        if (!this.table) {
            throw new BaseError('set default table in constructor');
        }
        let req = this.table().select('*').where(where);
        if ((this.defaultParams && this.defaultParams.order) || order) {
            const orderObj = this.defaultParams.order || order;
            req = req.orderBy(orderObj[0], orderObj[1]);
        }
        if (offset) {
            req = req.offset(offset);
        }
        const result = await req.pool();
        return result;
    }

    /**
     * @param {Object} where - where
     * @param {Number} offset - offset
     * @param {Array} order - order
     * @returns {Promise.<Object>} - object
     */
    async getOne(where, offset, order) {
        if (!this.table) {
            throw new BaseError('set default table in constructor');
        }
        const result = await this.get(where, offset, order);
        return result.length ? result[0] : null;
    }

    /**
     * @param {Object} data - data
     * @param {Object|String} returning - returning
     * @param {Object} client - pg client for transactions
     * @returns {Promise} - empty
     */
    async insert(data, returning, client) {
        if (!this.table) {
            throw new BaseError('set default table in constructor');
        }
        let req = this.table();
        if (returning) {
            req = req.returning(returning);
        }
        const res = await req.insert(data).pool(client);
        if (returning) {
            if (Array.isArray(data)) {
                return res;
            }
            return res[0];
        }
    }

    /**
     * @param {*} data - data
     * @param {Object} client - pg client for transactions
     * @returns {Promise} - empty
     */
    async update(data, client) {
        const where = {};
        const fields = {};
        if (!this.defaultParams.key) {
            throw new BaseError('set key in constructor');
        }
        if (!this.table) {
            throw new BaseError('set default table in constructor');
        }
        Object.keys(data).forEach(key => {
            if (this.defaultParams.key.includes(key)) {
                where[key] = data[key];
            } else {
                fields[key] = data[key];
            }
        });
        await this.table()
            .where(where)
            .update(fields)
            .pool(client);
        return true;
    }

    /**
     * @param {Object} req - req - string, bulkFields - array of fields
     * @param {Array} data - data
     * @param {Object} client - pg client for transactions
     * @returns {Promise} - empty
     */
    async bulkUpdate({req, bulkFields}, data, client) {
        if (!this.defaultParams.key) {
            throw new BaseError('set key in constructor');
        }
        if (!this.table) {
            throw new BaseError('set default table in constructor');
        }
        const values = data.map(row => `(${row.join(', ')})`).join(`,\n`);
        const where = [];
        this.defaultParams.key.forEach(key => {
            where.push(`t.${key} = bulk.${key}`);
        });
        const query = `
            UPDATE ${this.schema}.${this.tableName} as t
            SET
                ${req}
            FROM (
                VALUES ${values}
            ) AS bulk(${bulkFields.map(val => `"${val}"`).join(', ')})
            WHERE ${where.join(', ')} 
            RETURNING t.*;
        `;
        const pgClient = client || this.pool;
        const result = await pgClient.query(query);
        return result && result.rows;
    }

    /**
     * @param {*} where - where
     */
    async delete(where) {
        if (!this.table) {
            throw new BaseError('set default table in constructor');
        }
        await this
            .table()
            .where(where)
            .del()
            .pool();
    }

    /**
     * @param {Object} query - knex query builder
     * @returns {Object} knex query builder with method pool for postgres query pooling
     */
    decorate(query) {
        const that = this;
        query.pool = function pool(client) {
            return that.poolQuery(this, client);
        };
        query.parseParams = function parseParams(params) {
            return that.parseParams(this, params);
        };
        query.getCount = async function getCount(params, fieldsMapping) {
            return (await this
                .count('*')
                .parseParams(params, fieldsMapping)
                .pool())[0].count;
        };
        return query;
    }

    /**
     * @param {Object} query - knex queryBuilder
     * @param {Object} params - search and filter params
     * @param {String} params.limit - limit
     * @param {String} params.offset - offset
     * @param {String} params.sortName - column for sorting
     * @param {String} params.sortOrder - asc or desc
     * @param {String} params.columnFilters - convertible to array of objects, example: '[{"key":"login","type":"like","value":"5"}]'
     * @param {Object} fieldsMapping - key-value for fields mapping to resolve conflicts
     * @returns {Object} knex query builder with search and filter params
     */
    parseParams(query, params, fieldsMapping = {}) {
        /* eslint-disable no-param-reassign */
        const limit = parseInt(params.limit) || 10;
        const offset = parseInt(params.offset) || 0;
        const getField = field => fieldsMapping[field] || field;

        if (params.sortName) {
            query = query.orderBy(getField(params.sortName), getField(params.sortOrder) || 'desc');
        }

        if (params.columnFilters) {
            const filters = JSON.parse(params.columnFilters);
            // eslint-disable-next-line id-length
            filters.forEach(f => {
                switch (f.type) {
                    case 'between':
                        query = query.whereBetween(getField(f.key), [f.value.from, f.value.to]);
                        break;
                    case 'eq':
                        query = query.where(getField(f.key), f.value);
                        break;
                    case 'gt':
                        query = query.where(getField(f.key), '>', f.value);
                        break;
                    case 'gteq':
                        query = query.where(getField(f.key), '>=', f.value);
                        break;
                    case 'lt':
                        query = query.where(getField(f.key), '<', f.value);
                        break;
                    case 'lteq':
                        query = query.where(getField(f.key), '<=', f.value);
                        break;
                    case 'nteq':
                        query = query.where(getField(f.key), '!=', f.value);
                        break;
                    default:
                        if (f.key.indexOf('id') > -1) {
                            return;
                        }
                        query = query.where(getField(f.key), f.type, f.type === 'like' ? `%${f.value}%` : f.value);
                        break;
                }
            });
        }

        query = query
            .limit(limit < 100 ? limit : 100)
            .offset(offset);

        return query;
    }

    /**
     * Send knex query to postgres
     * @param {Object} query - knex queryBuilder
     * @param {Object} client - pg client to exec transactions
     * @returns {Object} response
     */
    async poolQuery(query, client) {
        const pgClient = client || this.pool;
        let req;
        try {
            req = query.toString();
            const result = await pgClient.query(req);
            return result && result.rows;
        } catch (err) {
            logger.error(err, req);
            throw err;
        }
    }
}

module.exports = IDao;
