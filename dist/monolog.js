'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = monolog;

var _winston = require('winston');

var _jestGetType = require('jest-get-type');

var _jestGetType2 = _interopRequireDefault(_jestGetType);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

/**
 * @description Make a string of an non empty object or return ‘[]' as a string
 * @param {object} object
 * @returns {string} The result as a string
 */
function stringifyExtras(object) {
    const json = (0, _utils.isNonEmptyObject)(object) ? JSON.stringify(object) : '{}';
    if (json !== '{}') {
        return json;
    }
    return '[]';
}

/**
 * @description parse message of an error or object
 * @param {object} object Object to parse
 * @returns {object} An object with message, context and extras
 */
function parseObject(object) {
    const {
        message, context, name } = object,
          extras = _objectWithoutProperties(object, ['message', 'context', 'name']);

    return {
        message: name ? `${name} - ${message || '-'}` : message,
        context,
        extras
    };
}

/**
 * @description Generate the monolog string
 * @param {string} channel Channel of the logger
 * @param {string} level Level of the logger
 * @param {object} logData Data from our object with message, context and extras
 * @returns {string} Monolog string
 */
function formatMonologMessage(channel, level, logData, metaData) {
    const context = stringifyExtras(_extends({}, logData.context, {
        'metadata.context': metaData
    }));
    const extras = stringifyExtras(logData.extras);

    // Monolog format: "[%datetime%] %channel%.%level_name%: %message% %context% %extra%\n"
    return `[${(0, _utils.timestamp)()}] ${channel}.${level}: ${logData.message || '-'} ${context} ${extras}`;
}

/**
 * @description Formatter function
 * @export
 * @param {string} channel Channel of the logger
 * @returns {function} formatter function for winston logger
 */
function monolog(channel) {
    return _winston.format.printf(info => {
        let level = info.level.toUpperCase();
        const metaData = info.metadata;
        let logData = {
            message: null,
            context: [],
            extra: []
        };

        if (info.message instanceof Error) {
            level = 'ERROR';
        }

        switch ((0, _jestGetType2.default)(info.message)) {
            case 'object':
                logData = parseObject(info.message);
                break;
            case 'array':
                logData = _extends({}, logData, { message: info.message.join(' ') });
                break;
            default:
                logData = _extends({}, logData, { message: info.message });
                break;
        }

        return formatMonologMessage(channel, level, logData, metaData);
    });
}