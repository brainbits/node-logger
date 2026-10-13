/**
 * @description Generates a custom error
 * @export
 * @class CustomError
 * @extends {Error}
 */
export class CustomError extends Error {
    context: unknown;
    origin: unknown;

    constructor(message: string, context?: unknown, origin?: unknown) {
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
    statusCode?: number;
    requestUrl?: string;
    requestId?: string;

    constructor(
        message: string,
        context?: unknown,
        requestUrl?: string,
        statusCode?: number,
        requestId?: string,
        origin?: unknown,
    ) {
        super(message, context, origin);
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
    requestUrl?: string;
    requestId?: string;

    constructor(message: string, context?: unknown, requestUrl?: string, requestId?: string, origin?: unknown) {
        super(message, context, origin);
        this.name = 'ConnectorError';
        this.requestUrl = requestUrl;
        this.requestId = requestId;
    }
}
