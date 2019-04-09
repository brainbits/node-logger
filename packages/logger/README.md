# Logger
## Installation
`yarn add @tspm/node-logger @tspm/node-logger-formatter-monolog`

or

`npm install -S @tspm/node-logger @tspm/node-logger-formatter-monolog`

## Configuration
### Adding a formatter

You have to add a formatter to your `package.json`. E. g. the monolog formatter:

```json
"nodeLogger": {
    "formatter": "@tspm/node-logger-formatter-monolog"
}
```

### Parameters

You can add more parameters to your `"nodeLogger": {}` section.

```channel``` Channel of the logger (string)
>Default: Name of your module

```maxLevel``` Maximum level (string)
>Default: `info`

```timerLevel``` Timer level (string)
>Default: `debug`

```levels``` Levels (sorted array)
> Default:
```javascript [
    'emergency',
    'alert',
    'critical',
    'error',
    'warning',
    'notice',
    'info', // max level default
    'debug',
]
```

```outputs``` Outputs (object)
> Default:
```javascript
{
    emergency: 'stderr',
    warning: 'stdout',
}
```

```plugins``` Plugins [Optional]
> Example
```json
"nodeLogger": {
    "plugins": [
        "@tspm/node-logger-plugin-<name>"
    ]
}
```

```formatter``` Module name of the formatter (see "Adding a formatter")

### Environment variables

You can set your own `ENV_VARS` in your package.json with `env(<env>, <fallback[optional]>)`

>Example
```json
"nodeLogger": {
    "maxLevel": "env(LOGGER_LEVEL, info)"
}
```

This will take the value of LOGGER_LEVEL or "info" as fallback. The fallback is optional. If there is no suitable value the default is set.

## Usage
### Create a Logger instance
```javascript
import { Logger } from '@tspm/node-logger';

const logger = new Logger();
```
#### Arguments

```javascript
import { Logger } from '@tspm/node-logger';

const config = {
    maxLevel: 'error',
    level: [
        'error',
        'info',
        'debug',
    ],
    formatter: (event) => {
        console.log(event)
    }
};

const logger = new Logger(config);
```

First argument is a string to define your context.

Second argument is the entire configration object. You can override the configuration in your `package.json` here.

### Default logger
```javascript
import Logger from '@tspm/node-logger';

const logger = new Logger();

const meta = {
    foo: 'bar';
};

logger.info('This is my message', meta);
```

### Timer feature
There is a timer function `logger.start(<message>)`
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
// Could output: [2010-01-31 23:59:59] module.DEBUG: timer {"foo":"bar","timeMs":75} []
```
## Anatomy
`logger.<level>(<message>, <meta>)`

### Levels `<level>`
Pick one of these levels (default):

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

Caution: If message is an object and meta has the same property, meta will override this property.
