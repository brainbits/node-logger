# Logger v0.2.1
## Installation
`yarn add @tspm/node-logger`

or

`npm install -S @tspm/node-logger`

## Usage
### Default logger
```javascript
import { logger } from '@tspm/node-logger';

const meta = {
    foo: 'bar';
};

logger.info('This is my message', meta);
// Will output: [2010-01-31 23:59:59] <your_npm_package_name>.INFO: This is my message {"meta.context":{"foo":"bar"}} []
```
### Own logger
```javascript
import { createLogger } from '@tspm/node-logger';

const options = {
    maxLevel: 'debug',
    channel: 'myFancyChannel',
};

const logger = createLogger(options)

const meta = {
    foo: 'bar';
};

logger.info('This is my message', meta);
// Could output: [2010-01-31 23:59:59] myFancyChannel.INFO: This is my message {"meta.context":{"foo":"bar"}} []
```

### Timer function
There is a timer function `logger.start(<name>)`
```javascript
import { logger } from '@tspm/node-logger';

const meta = {
    foo: 'bar';
};

logger.start('timer');

//... somewhere else in your code ...

function loadAsyncShit() {
    return fetch('https://api/resource?query=blah')
        .then(result => {
            logger.stop('timer', meta);
            return result;
        };
};
// Could output: [2010-01-31 23:59:59] <your_npm_package_name>.DEBUG: timer {"meta.context":{"foo":"bar","timeMs":75}} []
```
## Anatomy
`logger.<level>(<message>, <meta>)`

### Levels `<level>`
Pick one of these levels:

- 0: `emergency`
- 1: `alert`
- 2: `critical`
- 3: `error`
- 4: `warning`
- 5: `notice`
- 6: `info`
- 7: `debug` (default: no ouput [maxLevel])

### Message `<message>`
Message can be a `string`, `array` or `object` (and `Error` object)

### Meta `<meta>`
Must be an object. Used for additional context data
