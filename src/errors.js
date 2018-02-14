/**
 * @description Generates a custom error
 * @export
 * @class CustomError
 * @extends {Error}
 */
export class CustomError extends Error {
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

/**
 * @description Generates an HTTP error
 * @export
 * @class HttpError
 * @extends {CustomError}
 */
export class HttpError extends CustomError {
    constructor(message, context, requestUrl, statusCode, requestId) {
        super(message, context);
        this.name = 'HttpError';
        this.statusCode = statusCode;
        this.requestUrl = requestUrl;
        this.requestId = requestId;
    }
}

/**
 * @description Generates a connector error
 * @export
 * @class ConnectorError
 * @extends {CustomError}
 */
export class ConnectorError extends CustomError {
    constructor(message, context, requestUrl, requestId) {
        super(message, context);
        this.name = 'ConnectorError';
        this.requestUrl = requestUrl;
        this.requestId = requestId;
    }
}
