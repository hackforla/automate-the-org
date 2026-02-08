# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).



## [Unreleased]
_No unreleased changes yet._

## v0.7.0
2026-02-08
- feat: removing the requirement for the workflow to install or reference the `label-directory-json`- removal will make it more intuitive for the PMs to specify which labels to use; the label names will be specified in the general `add-update-label-weekly-config.yml` config file rather than the label directory
- docs: `pr_template_add_update.md` major rewrite of comments, also remove refs to `label-directory.json`
- feat: `rollout-workflow-to-project.yml` remove refs to `label-directory.json`, check whether workflow is already installed, add warning if so, and automatically add the project name to the triggering workflow template
- feat: move `rollout-project-label-directory.yml` and `resolve-configs.js` to `/not-used-delete/` since we are no longer using the label directory 
- feat: revise and refactor `add-update-label-weekly.js` to extract the label names from the general config file instead of the label directory
- feat: refactor `add-update-label-weekly-config.example.yml` to account for specifying the label names here
- feat: minor revise `add-update-label-weekly.example.yml` to setup auto project name swapping
- feat: `index.js` revise for change since now we are pulling the label name info from the config file and not the label directory
- feat: `package.json` MAJOR change switching from vercel to esbuild due to difficulties updating vercel to address a vulnerability 
- feat: new file `get-repo-labels.js` to aid in checking whether the labels specified by the PM exist in the repo
- feat: `resolve-labels.js` moved to `/not-used-delete/` folder- no longer used but might want later
- feat: revised `resolve-configs.js` to handle labels  


## v0.6.6
2026-01-19
- refactor: revisions to both Rollout YML files after testing to confirm they work still
- refactor: add error check to end workflow in DRY-RUN if repo is not authorized

## v0.6.5
2026-01-18
- style: minor edits to log format and text on PR template

## v0.6.4
2026-01-15
- feature: add better error handling and logging to the rollout workflow YMLs
- docs: update README.md to explain how to install
- docs: minor clarifications throughout

## v0.6.3
2026-01-12
- feature: Removed `issueLogger()`, now using logger file with indents
- tweaking log files for readability

## v0.6.2
2026-01-10
- feature: Added simplified, consolidated logging for each issue via `issueLogger()`
- bug: Fixed major versioning

## v0.6.1
2025-12-28
- refactor: renaming main folder --> `gha-add-update-label-weekly` to accommodate fut. ghas
- refactor: remove overly specific ref to template in `resolve-config.js`

## v0.6.0
2025-12-03
- docs: remove "Planned-for-Future" `CHANGELOG.md`
- refactor: edits to initial inputs `rollout-workflow-to-project.yml`
- refactor: edits to initial inputs `rollout-project-label-directory.yml`
- chore: update `actions/checkout@v5` --> `@v6`, 3 files
- refactor: harmonize shell scripts with `echo -e "\n ..."`

## v0.5.3
2025-11-25
- style: adjusted logging for add and remove labels
- bug: fix replacement of teamSlackChannel in bot message

## v0.5.2
2025-11-25
- bug: fix assignment to constant

## v0.5.1
2025-11-25
- bug: fix incorrect path to `manage-issue-timeline.js`
- bug: fix incorrect debug log statement
- bug: adding troubleshooting step to debug `queryIssueInfo.js`
- bug: fix incorrect `isCommentByAssignees()` parameters

## v0.5.0
2025-11-24
- refactor: recreated all files to preserve history

## v0.4.4
2025-11-16
- feat: incorporate generation of `label-directory.json`
- fix: fixed multiple `label-directory.yml` --> `label-directory.json`

## v0.4.3
2025-11-15
- feat: Added script to update upstream (master) branch
- refactor: `rollout-project-label-directory.yml`
- feat: added `rollout-workflow-to-projects-REV3.yml`
- feat: minor refactoring of other files
- fix: applied update to js-yaml to address CVE-2025-64718


## v0.4.2
2025-11-09
- fix: minor bug fix 

## v0.4.0
2025-11-08
- Minor release
- feat: Changed final directory structure
- feat: changed variable names 
- feat: Add `rollout-project-label-directory.yml`



## v0.3.6
2025-11-05
- time bugs

## v0.3.5
2025-11-05
- bug: still are problems

## v0.3.4
2025-11-05
- bug: fix logic in add-update-label-weekly

## v0.3.3
2025-11-05
- bug: queryIssueInfo

## v0.3.2
2025-11-05
- bug: Fix for all website test

## v0.3.1
2025-11-05
- bug: remove old reference

## v0.3.0
2025-11-05
- Testing mode against Website
- Comments specify time of last activity, label key

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

1 .Make all necessary changes and commit as usual:

```bash
git add .
git commit -m "what is being committed"
git push
```
_Note: as always, use `git add .` or `git add <individual file>` as appropriate_

2. Rebuild the `@vercel/ncc` files, then re-commit: 

```bash
npm install
npm run build
git add .
git commit -m "new release build"
git push
```

3. Update this file as needed, then double-check the most recent version:

```bash
git tag
```
This should match the most recent version listed in this file and the latest version listed in [package.json](https://github.com/hackforla/automate-the-org/blob/master/package.json). If it doesn't, then you may need to manually correct the versions.

4. Now run the automatic versioning utility. This will check whether you have set an `origin`, and ask whether the commits associated with the next version should increment the major, minor, or patch value per [semver](https://semver.org/) (e.g. version MAJOR.MINOR.PATCH). This will also update the MAJOR version tag (i.e '@vX') so that it references the current tag (i.e. '@vX.Y.Z).

  ```bash
  ./auto-release.sh
  ```

5. After committing changes to the `hackforla/automate-the-org/master`, be sure to update the versioning on the `upstream` remote:

  ```bash
  ./auto-update-master.sh
  ```
#### Manual versioning
Only if you can't use the shell scripts...
  ```bash  
  git tag -a v1.0.3 -m "Release v1.0.3"
  git push origin v1.0.3

  git tag -fa v1 v1.0.3 -m "Update v1 to v1.0.3"
  git push origin v1 --force
  ```  

#### Versioning adjustments
Use the following for adjustments to the version tags (but only if you understand what you are doing!) 

- To remove previously-committed versions:
  ```bash
  git tag -d <version>
  git push origin --delete <version>
  ```
  _Remember to adjust `CHANGELOG.md` and `package.json` also._
- If you did not set your upstream branch but pushed the version anyway, you will need to set your `upstream` to `master` branch, then:
  ```bash
  git push upstream <version>
  ```

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
