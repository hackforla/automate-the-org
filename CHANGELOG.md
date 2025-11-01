# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Planned-for-Future
- Additional maintenance workflows
- Enhanced error reporting
- Label validation tools
- feat: PROJECT_SETUP.md for consuming projects
- docs: Comprehensive documentation and examples
- docs: Troubleshooting guide

## [Unreleased]
_No unreleased changes yet._

## v0.2.0
2025-11-01

- Substantial changes token changes
- feat: introduced org-level, fine-grained token
- feat: introduced org-level, just-in-time token via GitHub App
- feat: automation to generate PR in consuming projects
- feat: template to accompany the automation
- feat: create new GitHub App


## v0.1.7
2025-10-30
- Substantial refactoring of `add-update-label-weekly.js`

## v0.1.6
2025-10-29
- edits to logger.error

## v0.1.5
2025-10-29

- refactor: changed `maintenance-actions` --> `workflow-configs`
- feat: isolated the comment template
- fix: clarified config instructions

## v0.1.4
2025-10-25

- fix: tweak `auto-release.sh`
- fix: fix `logger.js` for dry run mode

## v0.1.3
2025-10-25
- feat: Added dry-run mode for testing without making changes

## v0.1.2
2025-10-25
- fix: Add `/dist/index.js` to commit

## v0.1.1
2025-10-25
- refactor: Updated `index.js`
- refactor: Updated `/dist/index.js`
- docs: Added notes CHANGELOG.md`

## v0.1.0
2025-10-24

### Added
- Initial release of centralized maintenance actions
- Includes "Add Update Label Weekly" workflow (aka "Schedule Friday 0700") for issue staleness checking
- Configuration resolver for merging defaults with project configs
- Label resolver for mapping label keys to project-specific label names
- Support for custom comment templates
- Support for custom timezones
- Automatic minimization of outdated bot comments


### Architecture
- Clean separation between orchestration (index.js) and business logic (core/)
- Reusable shared utilities for config and label resolution
- Minimal drift from original logic files
- Configuration via YAML files in consuming projects

### Documentation
- README.md with quick start guide
- CHANGELOG.md for consuming projects
- Example configuration files


---

## Version Strategy

We follow semantic versioning:
- **Major (v1.0.0 → v2.0.0)**: Breaking changes requiring project updates
- **Minor (v1.0.0 → v1.1.0)**: New features, backward compatible
- **Patch (v1.0.0 → v1.0.1)**: Bug fixes, backward compatible

### Conventional Commit Keywords

|  Keyword  |                     Meaning                    |     Impact on SemVer    |
|:---------:|:----------------------------------------------:|:-----------------------:|
| `feat:`     | New feature                                    | Minor version bump      |
| `fix:`      | Bug fix                                        | Patch version bump      |
| `chore:`    | Maintenance / tooling / non-user-facing change | Usually no version bump |
| `perf:`     | Performance improvement                        | Usually patch           |
| `docs:`     | Documentation only                             | No version bump         |
| `refactor:` | Code change, no feature added or bug fixed     | Usually no version bump |
| `test:`     | Add or fix tests                               | No version bump         |
| `style:`    | Formatting / linting                           | No version bump         |

### Version Tags for Consumers

Projects can reference versions in multiple ways:

```yaml
# Recommended: Pin to major version (gets minor/patch updates)
uses: your-org/automate-the-org/add-update-label-weekly@v1

# Pin to minor version (gets patch updates only)
uses: your-org/automate-the-org/add-update-label-weekly@v1.0

# Pin to exact version (no automatic updates)
uses: your-org/automate-the-org/add-update-label-weekly@v1.0.0

# Not recommended: Use latest commit
uses: your-org/automate-the-org/add-update-label-weekly@main
```

---

## Releasing a New Version

This project uses **Semantic Versioning** and a manual `[Unreleased]` changelog workflow.

### Steps for a Release

1. Add all user-facing changes to the `[Unreleased]` section of `CHANGELOG.md`.
2. Decide the next version according to [SemVer](https://semver.org/):
   - `patch` → bug fix only (v0.1.1 → v0.1.2)
   - `minor` → new feature (v0.1.1 → v0.2.0)
   - `major` → breaking change (v0.1.1 → v1.0.0)
3. Run the release script:

```bash
./release.sh <new-version>


---

## Contributing

When making changes:

1. Update this CHANGELOG under `[Unreleased]`
2. Follow semantic versioning for version numbers
3. Document breaking changes clearly
4. Update example configs if needed
5. Test with dry-run mode
6. Update documentation as needed

### Breaking Changes

If introducing breaking changes:
- Clearly document in CHANGELOG
- Provide migration guide
- Update major version number
- Consider deprecation period for major features
