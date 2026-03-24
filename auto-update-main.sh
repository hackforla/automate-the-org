#!/bin/bash
set -euo pipefail

# To use: Run this only after all changes have been pushed to `main` branch.

# --- 0. Pre-flight checks ---
echo "This script will push the latest git tag to the 'upstream' remote."
echo "  Note: Includes the major version floating tag update." 
echo ""
read -rp "Have you run './auto-release.sh' AND pushed changes to 'main' branch? (y/N) " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Upstream update canceled. Please run './auto-release.sh' and push changes to 'main' first. Exiting."
  exit 0
fi

# --- 1. Confirm that upstream remote exists ---
if ! git remote get-url upstream &>/dev/null; then
  echo -e "\n⚠️ No 'upstream' remote found."
  echo "Please set it before continuing, e.g.:"
  echo "  git remote add upstream https://github.com/ORG/REPO.git"
  echo -e "\nRelease canceled. Configure 'upstream' and re-run."
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
  echo -e "\nLatest tags for local and upstream match: $UPSTREAM_TAG."
  read -rp "Upstream does not need to be updated. Push tags anyway? (y/N) " PUSH_ANYWAY
  if [[ ! "$PUSH_ANYWAY" =~ ^[Yy]$ ]]; then
    echo "Upstream update canceled. Exiting."
    exit 0
  fi 
fi

# --- 5. Ask whether to push only the latest tag or all tags ---
echo ""
read -rp "Push all tags to upstream? (y/N) " PUSH_ALL_TAGS

if [[ "$PUSH_ALL_TAGS" =~ ^[Yy]$ ]]; then
  echo -e "\nPushing all tags to upstream..."
  git push upstream --tags
  echo -e "\n✅ Updated upstream with tag history, latest is $LAST_TAG."
  exit 0
else
  echo -e "\nPushing tag $LAST_TAG to upstream..."
  git push upstream "$LAST_TAG"
  echo -e "\n✅ Updated upstream to $LAST_TAG successfully."
fi

# --- 6. Update major version tag on upstream ---
VERSION_REGEX="v([0-9]+)\.([0-9]+)\.([0-9]+)"
if [[ $LAST_TAG =~ $VERSION_REGEX ]]; then
  MAJOR="${BASH_REMATCH[1]}"
  echo ""
  read -rp "Update floating major version branch 'v$MAJOR' on upstream to point to $LAST_TAG? (y/N) " UPDATE_MAJOR
  if [[ "$UPDATE_MAJOR" =~ ^[Yy]$ ]]; then
    FLOATING_BRANCH="v$MAJOR"
    
    # --- Update major tag pointing to the commit behind LAST_TAG ---
    git tag -f "$FLOATING_BRANCH" "$LAST_TAG"
    
    # --- Verify floating tag ---
    FLOAT_SHA=$(git rev-parse "$FLOATING_BRANCH"^{})
    LAST_SHA=$(git rev-parse "$LAST_TAG"^{})
    if [[ "$FLOAT_SHA" != "$LAST_SHA" ]]; then
      echo "❌ Major tag verification failed. Aborting push."
      exit 1
    fi
    
    # --- Push major tag to upstream ---
    git push upstream "refs/tags/$FLOATING_BRANCH" --force

    echo -e "\n✅ Version $FLOATING_BRANCH on upstream updated to $LAST_TAG!"
  else
    echo -e "\nSkipping update of major version on upstream."
  fi
else
  echo "❌ Could not parse major version from last tag ($LAST_TAG). Exiting."
  exit 1
fi