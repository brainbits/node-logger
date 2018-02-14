'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.timestamp = timestamp;
exports.isNonEmptyObject = isNonEmptyObject;

var _dateFns = require('date-fns');

const TIMESTAMP_FORMAT = 'YYYY-MM-DD HH:mm:ss';

/**
 * @description Get current timestamp
 * @param {any} [timestampFormat=TIMESTAMP_FORMAT]
 * @returns {string} Current timestamp in given format
 */
function timestamp(timestampFormat = TIMESTAMP_FORMAT) {
  return (0, _dateFns.format)(new Date(), timestampFormat);
}
/**
 * @description Checks if the object is non empty
 * @export
 * @param {any} object
 * @returns {boolean} Returns true if the object is not empty
 */
function isNonEmptyObject(object) {
  return typeof object === 'object' && Object.entries(object).length > 0;
}