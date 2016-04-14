var _ = require('lodash')

/**
 * Cache constructor.
 * Exposes methods for managing the underlying database.
 * @class
 */
function Cache () {
  /**
   * Inserts geojson into the DB
   *
   * @param {string} type - the provider type, used for setting provider based timers etc
   * @param {string} key - a provider based id for a dataset (defined by the provider)
   * @param {object} data - valid geojson
   * @param {number} layerId - the layer id to use in the db
   * @param {function} callback - the callback to return errors and data to
   */
  this.insert = function (type, key, data, layerId, callback) {
    this.db.insert(type + ':' + key, data, layerId, function (err, success) {
      callback(err, success)
    })
  }

  /**
   * Insert partial data into the DB
   *
   * @param {string} type - the provider type, used for setting provider based timers etc
   * @param {string} key - a provider based id for a dataset (defined by the provider)
   * @param {object} data - valid geojson
   * @param {number} layerId - the layer id to use in the db
   * @param {function} callback - the callback to return errors and data to
   */
  this.insertPartial = function (type, key, data, layerId, callback) {
    this.db.insertPartial(type + ':' + key, data, layerId, function (err, success) {
      callback(err, success)
    })
  }

  /**
   * Remove features from the DB
   *
   * @param {string} type - the provider type, used for setting provider based timers etc
   * @param {string} key - a provider based id for a dataset (defined by the provider)
   * @param {object} options - optional query params like where, geometry
   * @param {function} callback - the callback to return errors and data to
   */
  this.remove = function (type, key, options, callback) {
    this.db.remove(type + ':' + key + ':' + (options.layer || 0), function (err, result) {
      if (err) return callback(err)
      if (callback) callback(null, true)
    })
  }

  /**
   * Get features from the DB
   * calls the "select" method on the DB
   * TODO make this use a table name instead of "type" and "key"
   *
   * @param {string} type - the provider type, used for setting provider based timers etc
   * @param {string} key - a provider based id for a dataset (defined by the provider)
   * @param {object} options - optional query params like where, geometry
   * @param {function} callback - the callback to return errors and data to
   */
  this.get = function (type, key, options, callback) {
    var table = type + ':' + key
    var query = this.decodeGeoservices(options)
    this.db.select(table, query, function (err, data) {
      callback(err, data)
    })
  }

  /**
   * Translates a geoservices query into sql parts
   *
   * @param {object} query - an object with geoservices strings
   * @return {object} parsed sql parts
   */
  this.decodeGeoservices = function (options) {
    var query = _.clone(options)
    query.layer = query.layer || 0
    if (query.orderByFields && query.orderByFields.length) {
      query.order_by = this._convertOrderByFields(query.orderByFields)
    }
    return query
  }

  /**
   * Converts geoservices orderByFields to a usable object
   *
   * @param {string} orderByFields - geoservices orderByFieldsString
   * @return {array} order_by - An array of {field: order} objects
   */
  this._convertOrderByFields = function (orderByFields) {
    var order_by = []
    var orders = orderByFields.split(',')
    orders.forEach(function (block) {
      var fieldOrder = block.trim().split(' ')
      var order = {}
      order[fieldOrder[0]] = fieldOrder[1] || 'ASC'
      order_by.push(order)
    })
    return order_by
  }

  /**
   * Get the metadata for a dataset
   *
   * @param {string} table - the name of the table
   * @param {function} callback - the callback to return errors and data to
   */
  this.getInfo = function (table, callback) {
    this.db.getInfo(table, callback)
  }

  /**
   * Update the metadata for a dataset
   *
   * @param {string} table - the name of the table
   * @param {object} info - the metadata to update in the DB
   * @param {function} callback - the callback to return errors and data to
   */
  this.updateInfo = function (table, info, callback) {
    this.db.updateInfo(table, info, callback)
  }

  /**
   * Gets the count of features in the db table
   *
   * @param {string} table - the name of the table
   * @param {object} options - optional params like where, geometry or groupby
   * @param {function} callback - the callback to return errors and data to
   */
  this.getCount = function (table, options, callback) {
    this.db.getCount(table, options, callback)
  }

  /**
   * Gets the extent of features in the db table
   *
   * @param {string} table - the name of the table
   * @param {object} options - optional params like where, geometry or groupby
   * @param {function} callback - the callback to return errors and data to
   */
  this.getExtent = function (table, options, callback) {
    if (this.db.getExtent) {
      this.db.getExtent(table, options, callback)
    } else {
      callback()
    }
  }

  /**
   * Gets a statistic for a field
   *
   * @param {string} field - the field to create the stat from
   * @param {string} outName - the name of the output field
   * @param {string} type - the stat type: min, max, avg, stddev, count, or sum
   * @param {object} options - optional params like where, geometry or groupby
   * @param {function} callback - the callback to return errors and data to
   */
  this.getStat = function (field, outName, type, options, callback) {
    this.db.getStat(field, outName, type, options, callback)
  }

  /**
   * Count the number of services registered for a service type
   *
   * @param {string} type - the type of service
   * @param {function} callback - the callback to return errors and data to
   */
  this.serviceCount = function (type, callback) {
    this.db.serviceCount(type, callback)
  }

  /**
   * Get a registered service for a service type
   * if no id given, should return array of all services for that type
   *
   * @param {string} type - the type of service
   * @param {string} id - optional service id to get
   * @param {function} callback - the callback to return errors and data to
   */
  this.serviceGet = function (type, id, callback) {
    this.db.serviceGet(type, id, callback)
  }

  /**
   * Register a service with a host and an id and a service type
   *
   * @param {string} type - the type of service
   * @param {object} info - an object with a host and an id to register
   * @param {function} callback - the callback to return errors and data to
   */
  this.serviceRegister = function (type, info, callback) {
    this.db.serviceRegister(type, info, callback)
  }

  /**
   * Remove a registered service for a service type
   *
   * @param {string} type - the type of service
   * @param {string} id - optional service id to remove
   * @param {function} callback - the callback to return any errors
   */
  this.serviceRemove = function (type, id, callback) {
    this.db.serviceRemove(type, id, callback)
  }

	/**
	 * Adds indexes to tables if the underyling DB supports it
	 *
	 * @param {string} table - the table to add indexes to
	 * @param {object} options - describes which indexes to create
	 * @param {function} callback - calls back with an error if the method is not supported
	 */
  this.addIndexes = function (table, options, callback) {
    if (!this.db.addIndexes) return callback(new Error('This cache does not support indexes'))
    this.db.addIndexes(table, options, callback)
  }

	/**
	 * Creates a stream of features from the cache
	 *
	 * @param {string} table - the name of the table to write from
	 * @param {object} options - includes where clauses and the format of output
	 * @return {object} a stream that emits a single feature a time
	 */
  this.createStream = function (table, options) {
    if (!this.db.createExportStream) throw new Error('Stream output is not supported by this cache')
    return this.db.createExportStream(table, options)
  }

  return this
}

module.exports = Cache