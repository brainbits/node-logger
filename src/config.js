/*
 * monoglog: Config that _is_ conform to monolog logging levels.
 */
const { stdout, stderr } = process;


export default {
    levels: {
        emergency: 0,
        alert: 1,
        critical: 2,
        error: 3,
        warning: 4,
        notice: 5,
        info: 6,
        debug: 7,
    },
    outputs: {
        emergency: stderr,
        warning: stdout,
    },
    timerLevel: 'debug',
};
