# Logger
## Requirements

Node.js 22.12 or newer. The packages are ES modules and ship their own TypeScript types.

## Installation
`yarn add @brainbits/node-logger @brainbits/node-logger-formatter-monolog`

or

`npm install -S @brainbits/node-logger @brainbits/node-logger-formatter-monolog`

## Configuration
### Adding a formatter

You have to add a formatter to your `package.json`. E. g. the monolog formatter:

```json
"nodeLogger": {
    "formatter": "@brainbits/node-logger-formatter-monolog"
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

```outputs``` Outputs (object). A level without output uses the output of the next more severe level.
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
        "@brainbits/node-logger-plugin-<name>"
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

### Validation

The configuration is validated when the first `Logger` is created. Missing or invalid values and unknown options
throw an error that lists all problems at once:

```
Error: Invalid node-logger configuration:
✖ Unrecognized key: "maxlevel"
✖ Invalid option: expected one of "emergency"|"alert"|"critical"|"error"|"warning"|"notice"|"info"|"debug"
  → at sentry.exceptionLevel
```

Values set with `env()` are validated as well, after the environment variables have been resolved.

## Usage
### Create a Logger instance
```javascript
import { Logger } from '@brainbits/node-logger';

const logger = new Logger();
```
#### Arguments

```javascript
import { Logger } from '@brainbits/node-logger';

const config = {
    maxLevel: 'error',
    formatter: event => JSON.stringify(event),
};

const logger = new Logger(config);
```

The configuration object overrides the configuration in your `package.json`.

### Default logger
```javascript
import { Logger } from '@brainbits/node-logger';

const logger = new Logger();

const meta = {
    foo: 'bar',
};

logger.info('This is my message', meta);

// The level can also be passed as argument
logger.log('info', 'This is my message', meta);
```

### Timer feature
There is a timer function `logger.start(<label>)`. `logger.stop(<label>, <meta>)` logs the elapsed time with the
`timerLevel`.
```javascript
import { Logger } from '@brainbits/node-logger';

const logger = new Logger();
const meta = {
    foo: 'bar',
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
The syslog severity levels (RFC 5424), from the most to the least severe:

- 0: `emergency`
- 1: `alert`
- 2: `critical`
- 3: `error`
- 4: `warning`
- 5: `notice`
- 6: `info`
- 7: `debug` (default: no ouput [maxLevel])

### Message `<message>`
Message is a `string` or an `Error`. Errors are logged with their stack trace and the chain of errors given as
`cause`. A `context` property of an error is logged as well:

```javascript
const error = new Error('Loading the order failed', { cause: requestError });
error.context = { orderId: 42 };

logger.error(error);
```

### Meta `<meta>`
Must be an object. Used for additional context data.

```javascript
logger.info('This is my message', { foo: 'bar' });
```

Caution: If the context of an error and meta have the same property, meta will override this property.

## Writing plugins

A plugin is a class exported as default export. It gets the validated configuration in its constructor and every log
event in `log()`. A static `configSchema` adds the plugin's options to the configuration, so the logger validates them
together with its own options:

```typescript
import type { LogEvent, Plugin, ValidatedConfig } from '@brainbits/node-logger';
import { z } from 'zod';

const myPluginSchema = z.strictObject({
    enabled: z.boolean().default(true),
});

declare module '@brainbits/node-logger' {
    interface Config {
        myPlugin?: z.input<typeof myPluginSchema>;
    }
}

export default class MyPlugin implements Plugin {
    static readonly configSchema = z.object({ myPlugin: myPluginSchema.prefault({}) });

    constructor(config: ValidatedConfig) {
        // ...
    }

    log(event: LogEvent): void {
        // ...
    }
}
```
