'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * @description Generates a custom error
 * @export
 * @class CustomError
 * @extends {Error}
 */
class CustomError extends Error {
    constructor(message, context, origin) {
        super();
        this.context = context;
        this.message = message;
        this.name = 'CustomError';
        this.origin = origin;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CustomError);
        }
    }
}

exports.CustomError = CustomError; /**
                                    * @description Generates an HTTP error
                                    * @export
                                    * @class HttpError
                                    * @extends {CustomError}
                                    */

class HttpError extends CustomError {
    constructor(message, context, requestUrl, statusCode, requestId) {
        super(message, context);
        this.name = 'HttpError';
        this.statusCode = statusCode;
        this.requestUrl = requestUrl;
        this.requestId = requestId;
    }
}

exports.HttpError = HttpError; /**
                                * @description Generates a connector error
                                * @export
                                * @class ConnectorError
                                * @extends {CustomError}
                                */

class ConnectorError extends CustomError {
    constructor(message, context, requestUrl, requestId) {
        super(message, context);
        this.name = 'ConnectorError';
        this.requestUrl = requestUrl;
        this.requestId = requestId;
    }
}
exports.ConnectorError = ConnectorError;