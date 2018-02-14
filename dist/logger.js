'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _winston = require('winston');

var _monolog = require('./monolog');

var _monolog2 = _interopRequireDefault(_monolog);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const { env } = process;
const CHANNEL = env.LOGGER_CHANNEL || env.npm_package_name;
const LEVEL = env.LOGGER_LEVEL || 'info';

const logger = (0, _winston.createLogger)({
    format: (0, _monolog2.default)(CHANNEL.toLowerCase()),
    transports: [new _winston.transports.Console({ handleExceptions: true, level: LEVEL })],
    exitOnError: false
});

exports.default = logger;