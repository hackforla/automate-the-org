#!/bin/bash
set -euo pipefail

# To use: Run after committing all changes (see `README.md` and `CHANGELOG.md`).
# Updates the version tag for the CURRENT_BRANCH of the remote ORIGIN.
# Use `./auto-update-main.sh` for versioning main on remote UPSTREAM.

# --- CONFIG ---
CHANGELOG="CHANGELOG.md"
PACKAGE_JSON="package.json"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# --- 1. Get last git tag ---
LAST_TAG=$(git tag --sort=version:refname | tail -n1)
LAST_TAG=${LAST_TAG:-"v0.0.0"}

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

# --- 2. Confirm branch ---
echo -e "\n⚠️ You are working on: --> $CURRENT_BRANCH\n"
read -rp "Proceed with this branch? (y/N) " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Release canceled. Change to the desired branch. Exiting."
  exit 0
fi

# --- 3. Show last version ---
echo "Last version: $LAST_TAG"

# --- 4. Extract [Unreleased] changes ---
UNRELEASED_CHANGES=$(awk '/## \[Unreleased\]/{flag=1;next}/^## /{flag=0}flag' "$CHANGELOG")

if [ -z "$UNRELEASED_CHANGES" ]; then
  echo "⚠️ No changes found in [Unreleased] section. Exiting."
  exit 1
fi

echo -e "\nChanges to release:\n$UNRELEASED_CHANGES"

# --- 5. Ask user for increment type ---
echo -e "\nSpecify version increment (patch/minor/major):"
read -r INCREMENT

case $INCREMENT in
  patch) PATCH=$((PATCH + 1)) ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  *) echo "❌ Invalid increment type- use 'patch', 'minor', or 'major'. Exiting."; exit 1 ;;
esac

NEW_VERSION="v$MAJOR.$MINOR.$PATCH"
echo -e "\nProposed new version: $LAST_TAG --> $NEW_VERSION"
echo -e "\nIncludes the following changes:\n$UNRELEASED_CHANGES"

# --- 6. Confirm release ---
read -rp "Proceed with this release? (y/N) " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Release canceled. Fix changelog or choose a different version."
  exit 0
fi

# --- 7. Update package.json and package-lock.json version ---
if [ -f "$PACKAGE_JSON" ]; then
  npm version "$MAJOR.$MINOR.$PATCH" --no-git-tag-version >/dev/null 2>&1
  echo "Updated package.json and package-lock.json to $MAJOR.$MINOR.$PATCH"
fi

# --- 8. Check if tag already exists ---
if git rev-parse "$NEW_VERSION" >/dev/null 2>&1; then
  echo "❌ Tag $NEW_VERSION already exists. Exiting."
  exit 1
fi

# --- 9. Create annotated git tag ---
git tag -a "$NEW_VERSION" -m "Release $NEW_VERSION

Changes:
$UNRELEASED_CHANGES"

# --- 10. Update CHANGELOG.md ---
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

# --- 11. Commit updated files ---
git add "$CHANGELOG" "$PACKAGE_JSON"
git commit -m "Update CHANGELOG and package.json for $NEW_VERSION release"

# --- 12. Push changes to origin ---
git push origin $CURRENT_BRANCH
git push origin $NEW_VERSION

echo -e "\n✅ Release $NEW_VERSION created and pushed successfully!"

# --- 13. Update major version tag (ensure it points to commit) ---
MAJOR_TAG="v$MAJOR"
git tag -fa $MAJOR_TAG $NEW_VERSION^{} -m "Update $MAJOR_TAG to $NEW_VERSION"

# Verification step
MAJOR_SHA=$(git rev-parse $MAJOR_TAG^{})
NEW_SHA=$(git rev-parse $NEW_VERSION^{})
if [ "$MAJOR_SHA" != "$NEW_SHA" ]; then
  echo "❌ Major tag verification failed. Aborting push."
  exit 1
fi

git push origin $MAJOR_TAG --force

echo -e "\n✅ Major tag $MAJOR_TAG updated to $NEW_VERSION"

# --- 14. Reminder to update main ---
echo -e "\n🔔 Reminder: Run './auto-update-main.sh' to update the main branch with the latest changes."