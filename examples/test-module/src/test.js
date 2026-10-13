import { Logger } from '@brainbits/node-logger';


export default function test() {
    const logger = new Logger();

    logger.start('Stop watch');
    logger.debug('test debug');
    logger.info('test info', { foo: 'bar' });
    logger.notice('test notice', { foo: 'bar' });
    logger.warning('test warning', { foo: 'bar' });
    logger.stop('Stop watch');
    logger.error(new Error('test error'), { foo: 'bar' });
    logger.critical(new Error('test critical', { cause: new TypeError('test cause') }), { foo: 'bar' });
    logger.alert(new Error('test alert 1'), { foo: 'bar' });
    logger.emergency(new Error('test emergency'), { foo: 'bar' });
}
