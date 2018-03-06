import { format } from 'date-fns';

/**
 * @description Get current timestamp
 * @param {any} [timestampFormat=TIMESTAMP_FORMAT]
 * @returns {string} Current timestamp in given format
 */
export function timestamp(timestampFormat) {
    return format(new Date(), timestampFormat);
}
/**
 * @description Checks if the object is non empty or has undefined properties
 * @export
 * @param {any} object
 * @returns {boolean} Returns true if the object is not empty
 */
export function isNonEmptyObject(object) {
    return typeof object === 'object' && Object
        .values(object)
        .filter(entry => entry !== undefined)
        .length > 0;
}
