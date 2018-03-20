# Logger
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
// Will output: [2010-01-31 23:59:59] <your_npm_package_name>.INFO: This is my message {"foo":"bar"} []
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
// Could output: [2010-01-31 23:59:59] myFancyChannel.INFO: This is my message {"foo":"bar"} []
```

### Environment variables

Use `LOGGER_MAX_LEVEL` as enironment variable to set the debug level higher or lower (See Levels below)

Example to set to MAXIMUM VERBOSITY:
```bash
$ export LOGGER_MAX_LEVEL=debug
```

Use `LOGGER_CHANNEL` to set the channel name for your project

```bash
$ export LOGGER_CHANNEL=myfancy-channel
```

will output

```bash
[2010-01-31 23:59:59] myfancy-channel.INFO: This is my message [] []
```

### Timer feature
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
// Could output: [2010-01-31 23:59:59] <your_npm_package_name>.DEBUG: timer {"foo":"bar","timeMs":75} []
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
Must be an object. Used for additional context data.

```javascript
logger.info('This is my message', { foo: 'bar' });
```

will output:

```
[2010-01-31 23:59:59] myFancyChannel.INFO: This is my message {"foo":"bar"} []
```

Caution: If message is an object and meta has the same property, meta will override this property.
