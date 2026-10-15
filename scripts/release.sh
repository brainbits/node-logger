#!/usr/bin/env sh
# Bumps all packages to the same version, commits and tags the release.
# Usage: npm run release -- <major|minor|patch|x.y.z>
set -e

if [ -z "$1" ]; then
    echo "Usage: npm run release -- <major|minor|patch|x.y.z>" >&2
    exit 1
fi

# Only the root is bumped by npm: bumping the workspaces with npm would resolve the
# dependency tree while their peer dependencies on each other still require the old version
npm version "$1" --no-git-tag-version

# Workspaces get the new version and require the core package of the same release
node -e '
const fs = require("fs");
const { version, workspaces } = require("./package.json");
const names = workspaces.map(dir => require(`./${dir}/package.json`).name);

for (const dir of workspaces) {
    const file = `${dir}/package.json`;
    const pkg = JSON.parse(fs.readFileSync(file, "utf8"));

    pkg.version = version;
    names
        .filter(name => pkg.peerDependencies?.[name])
        .forEach((name) => { pkg.peerDependencies[name] = `^${version}`; });

    fs.writeFileSync(file, `${JSON.stringify(pkg, null, 4)}\n`);
}
'
npm install --package-lock-only

version="v$(node -p "require('./package.json').version")"

git commit --all --message "Release $version"
git tag --annotate "$version" --message "Release $version"

echo "Created $version. Push it with: git push --follow-tags"
