import Logger, { HttpError } from '@tspm/node-logger';

const logger = new Logger('test');

export default function test() {
    logger.addTag('key', 'test');
    logger.emergency(new Error('test'), { foo: 'bar' })
    logger.alert(new Error('test'), { foo: 'bar' })
    logger.critical(new HttpError('test'), { foo: 'bar' })
    logger.error(new Error('test'), { foo: 'bar' })
    logger.warning('test', { foo: 'bar' })
    logger.notice('test', { foo: 'bar' })
    logger.info('test', { foo: 'bar' })
    logger.debug('test', { foo: 'bar' })
}

