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
    constructor(message) {
        super();
        this.name = 'CustomError';
        this.message = message;
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
    constructor(response, message, request, uuid) {
        super(message);
        this.name = 'HttpError';
        this.response = response;
        this.request = request;
        this.uuid = uuid;
    }
}

exports.HttpError = HttpError; /**
                                * @description Generates a connector error
                                * @export
                                * @class ConnectorError
                                * @extends {CustomError}
                                */

class ConnectorError extends CustomError {
    constructor(message, request, uuid) {
        super(message);
        this.name = 'ConnectorError';
        this.request = request;
        this.uuid = uuid;
    }
}
exports.ConnectorError = ConnectorError;