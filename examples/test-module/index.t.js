"use strict";

var _nodeLogger = _interopRequireDefault(require("@tspm/node-logger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_nodeLogger.default.emergency('test', {
  level: 'emergency'
});

_nodeLogger.default.alert('test', {
  level: 'alert'
});

_nodeLogger.default.critical('test', {
  level: 'critical'
});

_nodeLogger.default.error('test', {
  level: 'error'
});

_nodeLogger.default.warning('test', {
  level: 'warning'
});

_nodeLogger.default.notice('test', {
  level: 'notice'
});

_nodeLogger.default.info('test', {
  level: 'info'
});

_nodeLogger.default.debug('test', {
  level: 'debug'
});
