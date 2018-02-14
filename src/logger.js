import { createLogger, transports } from 'winston';
import monolog from './monolog';

const { env } = process;
const CHANNEL = env.LOGGER_CHANNEL || env.npm_package_name;
const LEVEL = env.LOGGER_LEVEL || 'info';

const logger = createLogger({
    format: monolog(CHANNEL.toLowerCase()),
    transports: [
        new transports.Console({ handleExceptions: true, level: LEVEL }),
    ],
    exitOnError: false,
});

export default logger;
