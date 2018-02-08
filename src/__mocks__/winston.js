class Console {
    constructor(args) {
        this.args = args;
    }
}

export const createLogger = jest.fn(() => ({
    log: (level, message) => ({
        level,
        message,
    }),
}));

export const format = {
    printf: jest.fn(fn => fn),
};

export const transports = {
    Console,
};
