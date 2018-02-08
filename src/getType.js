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
export function isObject(value) {
    return getType(value) === 'Object';
}

/**
 * @description Checks if elements is a string
 * @param {any} value
 * @returns {boolean}
 */
export function isString(value) {
    return getType(value) === 'String';
}

/**
 * @description Checks if elements is an Error
 * @param {any} value
 * @returns {boolean}
 */
export function isError(value) {
    return getType(value) === 'Error';
}
