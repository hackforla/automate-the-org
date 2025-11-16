#!/bin/bash
set -e

# To use: Run this after all changes have been made and committed (see `README.md`` and `CHANGELOG.md``).
# To update the upstream remote: Run `./auto-update-master.sh` after committing your changes to master.

# --- CONFIG ---
CHANGELOG="CHANGELOG.md"
PACKAGE_JSON="package.json"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# --- 0. Confirm that upstream remote exists ---
if ! git remote get-url upstream &>/dev/null; then
  echo ""
  echo "⚠️ No 'upstream' remote found."
  echo "Please set it before continuing, e.g.:"
  echo "  git remote add upstream https://github.com/ORG/REPO.git"
  echo ""
  read -p "Continue without pushing to upstream? (y/N) " CONTINUE_ANYWAY
  if [[ ! "$CONTINUE_ANYWAY" =~ ^[Yy]$ ]]; then
    echo "Release canceled. Configure 'upstream' and re-run."
    exit 1
  fi
  UPSTREAM_MISSING=true
else
  UPSTREAM_MISSING=false
fi

# --- 1. Get last git tag ---
LAST_TAG=$(git tag --sort=-creatordate | head -n1 || echo "v0.0.0")

# Extract major.minor.patch numbers
VERSION_REGEX="v([0-9]+)\.([0-9]+)\.([0-9]+)"
if [[ $LAST_TAG =~ $VERSION_REGEX ]]; then
  MAJOR="${BASH_REMATCH[1]}"
  MINOR="${BASH_REMATCH[2]}"
  PATCH="${BASH_REMATCH[3]}"
else
  echo "❌ Could not parse last tag ($LAST_TAG). Exiting."
  exit 1
fi

# --- 1.5. Confirm branch ---
echo ""
echo "⚠️ You are working on: --> $CURRENT_BRANCH"
echo ""
read -p "Proceed with this branch? (y/N) " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Release canceled. Change to the desired branch. Exiting."
  exit 0
fi

# --- 2. Show last version ---
echo "Last version: $LAST_TAG"

# --- 3. Extract [Unreleased] changes ---
UNRELEASED_CHANGES=$(awk '/## \[Unreleased\]/{flag=1;next}/^## /{flag=0}flag' "$CHANGELOG")

if [ -z "$UNRELEASED_CHANGES" ]; then
  echo "⚠️ No changes found in [Unreleased] section! Exiting."
  exit 1
fi

echo -e "\nChanges to release:\n$UNRELEASED_CHANGES"

# --- 4. Ask user for increment type ---
echo -e "\nChoose version increment (patch/minor/major):"
read -r INCREMENT

case $INCREMENT in
  patch) PATCH=$((PATCH + 1)) ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  *) echo "❌ Invalid increment type- use 'patch', 'minor', or 'major'. Exiting."; exit 1 ;;
esac

NEW_VERSION="v$MAJOR.$MINOR.$PATCH"
echo -e "\nProposed new version: $LAST_TAG --> $NEW_VERSION"
echo -e "\nWith the following changes:\n$UNRELEASED_CHANGES"

# --- 5. Confirm release ---
read -p "Proceed with this release? (y/N) " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Release canceled. Fix changelog or choose a different version."
  exit 0
fi

# --- 6. Update package.json and package-lock.json version ---
if [ -f "$PACKAGE_JSON" ]; then
  npm version "$MAJOR.$MINOR.$PATCH" --no-git-tag-version >/dev/null 2>&1
  echo "Updated package.json and package-lock.json to $MAJOR.$MINOR.$PATCH"
fi

# --- 7. Create annotated git tag ---
git tag -a "$NEW_VERSION" -m "Release $NEW_VERSION

Changes:
$UNRELEASED_CHANGES"

# --- 8. Update CHANGELOG.md ---
DATE=$(date +%F)
TMP_FILE=$(mktemp)

awk -v ver="$NEW_VERSION" -v date="$DATE" -v content="$UNRELEASED_CHANGES" '
BEGIN {printed=0}
{
  if ($0 ~ /^## \[Unreleased\]/ && !printed) {
    print $0
    print "_No unreleased changes yet._\n"
    print "## " ver 
    print date
    printed=1
    next
  }
  print
}' "$CHANGELOG" > "$TMP_FILE"

mv "$TMP_FILE" "$CHANGELOG"

# --- 9. Commit updated files ---
git add "$CHANGELOG" "$PACKAGE_JSON"
git commit -m "Update CHANGELOG and package.json for $NEW_VERSION release"

# --- 10. Push changes to origin---
git push origin "$CURRENT_BRANCH"
git push origin "$NEW_VERSION"

# --- 11. Push tag to upstream (if available) ---
if [ "$UPSTREAM_MISSING" = false ]; then
  echo ""
  echo "Pushing tag $NEW_VERSION to upstream..."
  git push upstream "$NEW_VERSION"
  echo "Tag $NEW_VERSION pushed successfully to upstream."
else
  echo ""
  echo "⚠️ Skipped pushing to upstream (remote not set)."
fi

echo -e "\n✅ Release $NEW_VERSION created and pushed successfully!"
