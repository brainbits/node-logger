/**
 * @description Generates a custom error
 * @export
 * @class CustomError
 * @extends {Error}
 */
export class CustomError extends Error {
    constructor(message, data) {
        super();
        this.data = data;
        this.message = message;
        this.name = 'CustomError';
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
    constructor(response, message, request, uuid) {
        super(message);
        this.name = 'HttpError';
        this.response = response;
        this.request = request;
        this.uuid = uuid;
    }
}

/**
 * @description Generates a connector error
 * @export
 * @class ConnectorError
 * @extends {CustomError}
 */
export class ConnectorError extends CustomError {
    constructor(message, request, uuid) {
        super(message);
        this.name = 'ConnectorError';
        this.request = request;
        this.uuid = uuid;
    }
}
