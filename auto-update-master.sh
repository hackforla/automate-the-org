#!/bin/bash
set -e

# To use: Run this only after all changes have been pushed to `master` branch.

# --- CONFIG ---
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "This script will push the latest git tag to the 'upstream' remote."
echo "Have you run './auto-release.sh' AND pushed changes to 'master' branch? (y/N) "
read -p "" CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Upstream update canceled. Please run './auto-release.sh' and push changes to 'master' first. Exiting."
  exit 0
fi

# --- 1. Confirm that upstream remote exists ---
if ! git remote get-url upstream &>/dev/null; then
  echo ""
  echo "⚠️ No 'upstream' remote found."
  echo "Please set it before continuing, e.g.:"
  echo "  git remote add upstream https://github.com/ORG/REPO.git"
  echo ""
  echo "Release canceled. Configure 'upstream' and re-run."
  exit 1
fi

# --- 2. Get latest local tag ---
LAST_TAG=$(git tag --sort=version:refname | tail -n1)
LAST_TAG=${LAST_TAG:-"v0.0.0"}

# --- 3. Get latest upstream tag (from remote) ---
UPSTREAM_TAG=$(git ls-remote --tags upstream \
  | grep -v '\^{}' \
  | grep 'refs/tags/' \
  | sed 's#.*refs/tags/##' \
  | sort -V \
  | tail -n1)
UPSTREAM_TAG=${UPSTREAM_TAG:-"v0.0.0"}

echo "Latest version in this repo:     $LAST_TAG"
echo "Latest version in upstream repo: $UPSTREAM_TAG"

# --- 4. Check if upstream needs update ---
if [ "$LAST_TAG" == "$UPSTREAM_TAG" ]; then
  echo ""
  echo "Latest tags for local and upstream match: $UPSTREAM_TAG."
  read -p "Upstream does not need to be updated. Push tags anyway? (y/N) " PUSH_ANYWAY
  if [[ ! "$PUSH_ANYWAY" =~ ^[Yy]$ ]]; then
    echo "Upstream update canceled. Exiting."
    exit 0
  fi 
fi

# --- 5. Ask whether to push only the latest tag or all tags ---
echo ""
read -p "Push all tags to upstream? (y/N) " PUSH_ALL_TAGS

if [[ "$PUSH_ALL_TAGS" =~ ^[Yy]$ ]]; then
  echo ""
  echo "Pushing all tags to upstream..."
  git push upstream --tags
  echo ""
  echo "✅ Updated upstream with tag history, latest is $LAST_TAG."
  exit 0
else
  echo ""
  echo "Pushing tag $LAST_TAG to upstream..."
  git push upstream "$LAST_TAG"
  echo ""
  echo "✅ Updated upstream to $LAST_TAG successfully."
fi
