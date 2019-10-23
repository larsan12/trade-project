const knex = require('knex')({client: 'pg'});
const queries = require('./queries');

/**
 * @class
 */
class IDao {
    /**
     * @constructor
     * @param {Object} pool - pool
     * @param {string} schema - schema
     * @param {Object} agg - aggregator
     */
    constructor(pool, schema, agg) {
        this.schema = schema;
        this.pool = pool;
        this.knex = knex;
        this.queries = queries;
        this.agg = agg;

        /*
         * create and decorate knex instances
         */
        this.agents = () => this.decorate(knex.withSchema(this.schema).from('agents'));
        this.dataSets = () => this.decorate(knex.withSchema(this.schema).from('data_sets'));
        this.predicates = () => this.decorate(knex.withSchema(this.schema).from('predicates'));
        this.data = () => this.decorate(knex.withSchema(this.schema).from('data'));
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
            req = query.toSQL().toNative();
            const result = await pgClient.query(req.sql, req.bindings);
            return result && result.rows;
        } catch (err) {
            console.error(err, req);
            throw new Error(err.message);
        }
    }
}

module.exports = IDao;
