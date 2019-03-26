import Logger from '@tspm/node-logger';
import fetch from 'node-fetch';

const logger = new Logger('fetch');

const urls = [
    'https://jsonplaceholder.typicode.com/posts/1',
    'https://jsonplaceholder.typicode.com/posts/2',
    'https://jsonplaceholder.typicode.com/posts/333'
];

logger.start('Fetch');

async function goGetIt(url) {
    try {
        const response = await fetch(url);

        logger.setTag('status', response.status);
        logger.setTag('url', url);

        if (!response.ok) {
            throw new Error(`Fetch ${response.url} was unsuccessful. Reason: [${response.status} ${response.statusText}]`);
        }

        const data = response.json();

        logger.info(`Fetched ${response.url} successfully`, {
            code: response.status,
            message: response.statusText,
        }, { data });

        return data;
    } catch (error) {
        logger.error(error);
    } finally {
        logger.stop('Fetch');
    }
}


export default () => {
    urls.forEach(url => {
        goGetIt(url);
    });
}
