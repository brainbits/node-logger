#!/usr/bin/env sh
# Bumps all packages to the same version, commits and tags the release.
# Usage: npm run release -- <major|minor|patch|x.y.z>
set -e

if [ -z "$1" ]; then
    echo "Usage: npm run release -- <major|minor|patch|x.y.z>" >&2
    exit 1
fi

npm version "$1" --workspaces --include-workspace-root --no-git-tag-version
version="v$(node -p "require('./package.json').version")"

git commit --all --message "Release $version"
git tag --annotate "$version" --message "Release $version"

echo "Created $version. Push it with: git push --follow-tags"
