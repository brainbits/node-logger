'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isObject = isObject;
exports.isString = isString;
exports.isError = isError;
exports.isArray = isArray;
exports.isFunction = isFunction;
/**
 * @description Get the type of a elements
 * @param {any} Any element
 * @returns {string} Name of the elements's type
 */
function getType(element) {
  return Object.prototype.toString.call(element).slice(8, -1);
}

/**
 * @description Checks if elements is an object
 * @param {any} value
 * @returns {boolean}
 */
function isObject(value) {
  return getType(value) === 'Object';
}

/**
 * @description Checks if elements is a string
 * @param {any} value
 * @returns {boolean}
 */
function isString(value) {
  return getType(value) === 'String';
}

/**
 * @description Checks if elements is an Error
 * @param {any} value
 * @returns {boolean}
 */
function isError(value) {
  return getType(value) === 'Error';
}

/**
 * @description Checks if elements is an Arry
 * @param {any} value
 * @returns {boolean}
 */
function isArray(value) {
  return Array.isArray(value);
}

/**
 * @description Checks if elements is an Arry
 * @param {any} value
 * @returns {boolean}
 */
function isFunction(value) {
  return getType(value) === 'Function';
}