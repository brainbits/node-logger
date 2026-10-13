# `node-logger-plugin-sentry`

Sends log events to [Sentry](https://sentry.io): events up to the `exceptionLevel` as exceptions, all other events as
breadcrumbs of the next exception.

```json
"nodeLogger": {
    "plugins": [
        "@brainbits/node-logger-plugin-sentry"
    ],
    "sentry": {
        "dsn": "env(SENTRY_DSN)"
    }
}
```

## Options

| Option               | Default        | Description                                                         |
|----------------------|----------------|---------------------------------------------------------------------|
| `dsn`                | `''`           | Sentry DSN, Sentry is disabled without it                           |
| `environment`        | `'dev'`        | Sentry environment                                                  |
| `release`            | `null`         | Sentry release                                                      |
| `debug`              | `false`        | Enables the debug mode of the Sentry SDK                            |
| `exceptionLevel`     | `'error'`      | Events up to this level are sent as exceptions                      |
| `maxBreadcrumbs`     | `50`           | Maximum number of breadcrumbs sent with an exception                |
| `breadcrumbLevelMap` | all levels     | Maps log levels to Sentry breadcrumb levels, unmapped levels are skipped |
| `tags`               | `{}`           | Tags added to every exception                                       |

The options are validated together with the logger configuration. Booleans and numbers may be strings, so they can be
set with `env()`.
