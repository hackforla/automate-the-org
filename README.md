# Automate the ORG 
## Maintenance Actions Monorepo

Centralized GitHub Actions for repository maintenance and automation across the organization.

## Repository Structure

```markdown
workflow-configs/
│
├── add-update-label-weekly/            # "Add Update Label Weekly" workflow
│   ├── dist/
│   │   └── index.js
│   ├── action.yml
│   └── index.js
│
├── core/                               # Core business logic
│   └── add-update-label-weekly.js      # "Add Update Label Weekly" files
│
├── shared/                             # Shared utilities across all actions
│   ├── find-linked-issue.js
│   ├── format-log-messages.js          # `logger` utility to sort log
│   ├── get-issue-labels.js
│   ├── hide-issue-comment.js           # Minimizes comments 
│   ├── manage-issue-labels.js          # Set of issue-labelling utilities 
│   ├── manage-issue-timeline.js        # Set of issue-timeline utilities
│   ├── post-issue-comment.js
│   ├── query-issue-info.js
│   ├── resolve-configs.js              # Resolve config files
│   └── resolve-labels.js               # Resolve label files
│
├── example-configs/                    # Example configuration files
│   ├── add-update-label-weekly-config.example.yml
│   ├── add-update-label-weekly.example.yml
│   └── label-directory.example.yml     # Example only- not used
│
├── package.json                        # Dependencies for all actions
├── 
├── CHANGELOG.md                        # Versioning log
└── README.md                           # This file
```

## Available Actions

### Add Update Label Weekly

Monitors “In Progress” issues for updates since the last run and posts reminders to assignees who haven’t provided activity.<br>[Full details →](#add-update-label-weekly-1)

### (Additional Coming Soon)

---

## Set Up
Choose your desired workflow, then follow the steps to implement it in your repo.



### Add Update Label Weekly

#### What It Does

- Scans all **open, assigned** issues with a status of "In progress (actively working)"<sup>1</sup>.
- Checks for recent comments from the issue **assignee** since the last automation run<sup>2</sup>.
- If there are no recent comments from the assignee, posts a reminder<sup>3</sup> that the assignee should: 
  - provide a brief update on their progress,
  - describe blockers and request help if needed,
  - indicate their availability for working on the issue, and
  - share an estimated time to complete the issue.
- Applies the label "statusInactive1" : `status: To Update!`<sup>4</sup> if this is the first notice.
- Applies the label "statusInactive2": `status: 2 weeks inactive`<sup>4</sup> if this is the second notice. 
- Additional features:
  - Minimizes previous, repetitive bot comments within a specified timeframe<sup>2</sup>.
  - Applies the label (default) "statusUpdated": `Status: Updated`<sup>4</sup> if an update was posted recently.
  - Removes previously applied labels when appropriate.
- Ensures ongoing communication, accountability, and support across active tasks.


These are configurable, see [Step 2: Customize Config →](#step-2-customize-config):  
<sub>&emsp; <sup>1</sup> Project Board status  
&emsp; <sup>2</sup> All time periods  
&emsp; <sup>3</sup> Reminder message  
&emsp; <sup>4</sup> All label names</sub>  

### Implementing in Your Project

#### tbc

### How to Manually Install- 
Don't do this unless you have a great reason!

#### Step 0: Copy and rename the three workflow files that you need for your workflow. (coming soon)

#### Step 1: Copy GitHub Actions Workflow YML 
Copy and rename the example GitHub Actions Workflow YML from `example-configs/` into your repo, then customize `.github/workflows/add-update-label-weekly.yml` for cron schedule, project repo path, and PAT. 

```bash
# Ensure target folder exists
mkdir -p .github/workflow-configs

# Copy and rename the remote file into your local repo
curl -L https://github.com/hackforla/website/raw/main/workflow-configs/example-configs/add-update-label-weekly.example.yml \
-o .github/workflows/add-update-label-weekly.yml
```
See [example-configs/add-update-label-weekly.example.yml](./example-configs/add-update-label-weekly.example.yml) for a complete example.

#### Step 2: Copy and Customize Config File
Copy and rename the example configuration file from `example-configs/` into your repo, then customize `add-update-label-weekly-config.yml` for your project's needs.

  ```bash
  # Ensure target folder exists
  mkdir -p .github/workflow-configs

  # Copy and rename the remote file into your local repo
  curl -L https://github.com/hackforla/website/raw/main/workflow-configs/example-configs/add-update-label-weekly-config.example.yml \
  -o .github/workflow-configs/add-update-label-weekly-config.yml
  ```
See [example-configs/add-update-label-config.example.yml](./example-configs/add-update-label-config.example.yml) for a complete example.
#### Step 3: Copy Label Directory 
Copy and rename the example label directory file from `example-configs/` into your repo, then customize `.github/workflow-configs/label-directory.yml` to match the labels you are using in your project.


```bash
# Ensure target folder exists
mkdir -p .github/workflow-configs

# Only if this file does not exist, copy to your local repo and rename 
[ -f .github/workflow-configs/label-directory.yml ] && echo "File already exists" || curl -L https://github.com/hackforla/website/raw/main/workflow-configs/example-configs/label-directory.example.yml \
-o .github/workflow-configs/label-directory.yml
```
Correlate the 'labelKey' values to the 'Label Names' that are applicable to your project in the format: 
```yml
labels:
  ...
  labelKey1: "Label Name 1"
  labelKey2: "Label Name 2'
  ...
```

If you do not include the values in `.github/workflow-configs/_data/label-directory.yml`, the default values shown in `.github/workflow-configs/add-update-label-weekly-config.yml` will apply. For this workflow, the default values are: 

```yml
  # Required by the workflow:
  statusUpdated: "Status: Updated"
  statusInactive1: "To Update!"
  statusInactive2: "2 weeks inactive"
  statusHelpWanted: "Status: Help Wanted"

  # Exclude issues with any of these labels: 
  draft: "Draft"
  er: "ER"
  epic: "Epic"
  dependency: "Dependency"
  complexity0: "Complexity: Prework"
```

Set the path in your config:

```bash
labelDirectoryPath: ".github/workflow-configs/label-directory.yml"
```
See [example-configs/label-directory.example.yml](./example-configs/label-directory.example.example.yml) for a complete example.



#### Step 5: About Tokens and Secrets

These workflows use centrally maintained GitHub Apps to authorize and authenticate workflows, including  
`hfla-graphql-app` and `hfla-workflow-rollout`. The GitHub Apps can be configured to allow repository  
access on a project-by-project basis. Access must be granted before running the workflow locally; however,  
since the App is maintained centrally projects do not need to create tokens or secrets. 


### Action Inputs

| Input | Description |  Default |
|-------|-------------|----------|
| `config-path` | Path to config YAML in your repo | `.github/workflow-configs/`<br>`add-update-label-weekly-config.yml` |
| `recently-updated-by-days` | Override: days for "current" threshold | From config |
| `needs-updating-by-days` | Override: days for first notice | From config |
| `is-inactive-by-days` | Override: days for second notice | From config |
| `target-status` | Override: Project Board status | From config |
| `label-status-*` | Override: label names | From config |


---

# Monorepo Development Notes

The following applies to the maintenance of the `hackforla/automate-the-org` repo only.
### Setup

```bash
git clone https://hackforla/my_github_username/hackforla/automate-the-org.git
cd automate-the-org
npm install
```

### Adding Dependencies

Since this is a composite action that runs in the GitHub Actions environment, dependencies are installed automatically. Just add them to `package.json`.

### Testing

Test actions in a separate test repository before releasing next version.

### Adding a New Action

1. Create new folder: `new-action-name/`
2. Add `action.yml` and `index.js`
3. Add logic to `core/` if substantial
4. Add shared utilities to `shared/` if reusable
5. Create example config in `example-configs/`
6. Update this README

### Versioning

Make all necessary changes and commit as usual:

```bash
git add .
git commit -m "what is being committed"
git push
```
_Note: as always, use `git add .` or `git add <individual file>` as appropriate_

Rebuild the `@vercel/ncc` files, then re-commit: 

```bash
npm install
npm run build
git add .
git commit -m "new release build"
git push
```

Update the [CHANGELOG.md](https://github.com/hackforla/automate-the-org/blob/master/CHANGELOG.md) with the latest changes (using prefixes such as "fix: " or "feat: " -see `CHANGELOG.md`) as needed, then double-check the most recent version:

```bash
git tag
```
This should match the most recent version listed in the `CHANGELOG.md`, which should also match the latest version listed in [package.json](https://github.com/hackforla/automate-the-org/blob/master/package.json). If it doesn't, then you may need to manually correct the versions.

Now run the automatic versioning utility. This will check whether you have set an `upstream`, and ask whether the next version should be a patch, minor, or major version change per [semver](https://semver.org/) (e.g. version MAJOR.MINOR.PATCH):


```bash
./auto-release.sh
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

## Shared Utilities

Located in `shared/`, these are used across multiple actions:

### resolve-configs.js (Generic Config Loader)

**Generic configuration loader** used by all actions. Handles:
- Loading YAML/JSON config files from project repos
- Merging defaults, file config, and overrides
- Deep merging of nested objects
- Config validation

Each action creates its own config loader in `core/[action-name]/config.js` that:
1. Defines action-specific defaults
2. Transforms flat action inputs to nested config structure
3. Calls the generic `resolve-configs.js`
4. Validates required fields for that action

**Example pattern for new actions:**

```javascript
// core/your-action/config.js
const resolveConfigs = require('../../shared/resolve-configs');

function loadYourActionConfig({ projectRepoPath, configPath, overrides }) {
  const defaults = {
    // Action-specific defaults
  };
  
  const nestedOverrides = {
    // Transform flat overrides to nested
  };
  
  const config = resolveConfigs({
    projectRepoPath,
    configPath,
    overrides: nestedOverrides,
    defaults,
  });
  
  // Validate required fields
  resolveConfigs.validateConfig(config, ['field1', 'nested.field2']);
  
  return config;
}
```

### resolve-labels.js

- Loads and merges `label-directory.yml` file with overrides.

### find-linked-issue.js

Parses PR body to find linked issues (fixes #123, resolves #456, etc.).

### format-log-messages.js

Wraps log messages with tags via `logger.` including `[STEP]`, `[INFO]`, `[SUCCESS]`, `[WARN]`, `[ERROR]`, `[DEBUG]`.


### hide-issue-comment.js

Minimizes comments using GraphQL mutation.

### manage-issue-labels.js

Collection of utility functions for issue labeling, including `addLabels()` and `deleteLabels()`.

### manage-issue-timeline.js

Collection of utility functions for issue timelines, including `setLocalTime()` and `getIssueTimeline()`.

---

## Contributing

1. Create a feature branch
2. Make your changes
3. Test in a test repository
4. Submit a pull request
5. After approval, tag a new release

---

## Support

- **Issues**: Open an issue in this repository
- **Questions**: Contact DevOps team
- **Docs**: See action-specific documentation above

---

## License

MIT
