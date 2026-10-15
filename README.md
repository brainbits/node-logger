# node-logger monorepo

## Creating a release

All packages share one version. Run `npm run release -- <major|minor|patch|x.y.z>` to bump every package, commit and
tag the release, then push it with `git push --follow-tags`. The tag is published to npm via CI.

The release also sets the peer dependencies of the formatter and the plugins on `@brainbits/node-logger` to the new
version, as they are built against the core package of the same release.
