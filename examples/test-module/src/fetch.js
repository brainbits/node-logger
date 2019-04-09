import { Logger } from '@tspm/node-logger';
import fetch from 'node-fetch';

const urls = [
    'https://jsonplaceholder.typicode.com/posts/1',
    'https://jsonplaceholder.typicode.com/posts/2',
    'https://jsonplaceholder.typicode.com/posts/333'
];

async function goGetIt(url) {
    const logger = new Logger({
        context: {
            url,
            user: {
                id: 'sd8f8asdf-asdf',
                username: 'swein'
            }
        }
    });

    try {
        logger.start('Fetch');
        logger.info('Fetch data', { url });

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Fetch ${response.url} was unsuccessful. Reason: [${response.status} ${response.statusText}]`);
        }

        const data = response.json();

        logger.info(`Fetched ${response.url} successfully`, {
            code: response.status,
            message: response.statusText,
        });

        return data;
    } catch (error) {
        logger.error(error, {
            tags: {
                url,
                foo: {
                    bar: 'lib'
                }
            }
        });
    } finally {
        logger.stop('Fetch');
    }
}


export default () => {
    urls.forEach(url => {
        goGetIt(url);
    });
}
