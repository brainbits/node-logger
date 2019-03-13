import Logger from '@tspm/node-logger';

const logger = new Logger();

export default function test() {
    logger.emergency('test', { foo: 'bar' })
    logger.alert('test', { foo: 'bar' })
    logger.critical('test', { foo: 'bar' })
    logger.error('test', { foo: 'bar' })
    logger.warning('test', { foo: 'bar' })
    logger.notice('test', { foo: 'bar' })
    logger.info('test', { foo: 'bar' })
    logger.debug('test', { foo: 'bar' })
}

