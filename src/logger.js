import { createLogger, transports } from 'winston';
import monolog from './monolog';

const { env } = process;
const CHANNEL = env.LOGGER_CHANNEL || env.npm_package_name;

const logger = createLogger({
    format: monolog(CHANNEL.toLowerCase()),
    transports: [
        new transports.Console({ handleExceptions: true }),
    ],
    exitOnError: false,
});

export default logger;
