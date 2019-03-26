import Logger, { HttpError } from '@tspm/node-logger';

const logger = new Logger('test');

export default function test() {
    logger.setTag('key', 'test');
    logger.emergency('test', { foo: 'bar' })
    logger.alert('test', { foo: 'bar' })
    logger.critical(new HttpError('test'), { foo: 'bar' })
    logger.error(new Error('test'), { foo: 'bar' })
    logger.warning('test', { foo: 'bar' })
    logger.notice('test', { foo: 'bar' })
    logger.info('test', { foo: 'bar' })
    logger.debug('test', { foo: 'bar' })
}

