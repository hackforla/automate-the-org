# Automate the ORG 
## GitHub Actions Monorepo

Centralized GitHub Actions for repository maintenance and automation across the organization.

## How to Use
### Installing an Action to a Project
To install a centralized GitHub Actions (GHA) to a project repo, follow these steps:  

- Configure the **GitHub Apps**
  - The workflows use centrally-maintained GitHub Apps for authorization and authentication. The GitHub Apps must be configured to allow repository access on a project-by-project basis. Access must be granted before running the workflow; however once done, projects do not need to create or maintain tokens or secrets.   
  - Make sure that the project name ( e.g. `org/project-repo`) is selected on the two organizational GitHub Apps:  
    - [hfla-workflow-rollout](https://github.com/organizations/hackforla/settings/installations/92646041): Gives "Automate the ORG" (source) access to the project (destination) repo during installation.  
    - [hfla-graphql-app](https://github.com/organizations/hackforla/settings/installations/92507394): Gives the project (destination) repo access to scripts in "Automate the ORG" (source) during the workflow's runtime.  
  - For both, first scroll to "Repository access", then "Only select repositories", then select the corresponding project repo in the "Select repositories" dropdown.  
  - Click "Save".

- Run the **"Rollout Workflow to Project"** workflow from "Automate the ORG"  

  1. From the "Automate the ORG" repo, select "Actions", then "Rollout Workflow to Project" on the left.  
  2. On the right, click on "Run workflow" to bring up installation options.  
  3. Confirm that the `main` branch is selected.  
  4. Enter the `org/project-repo` for the "Destination repo".  
  5. Do not change the "Source repo".
  6. Select which GitHub Action you would like installed.
  7. Do not change the "Branch name" or "GitHub App" name. 
  8. To rollout the workflow, make sure that "Dry-run mode" is not checked, then click "Run workflow". The automation will generate the installation PR in the destination repo.
  9. OPTIONAL: Only if you would like to check whether the automation will generate the expected values, check the box for "Dry-run mode" and click "Run workflow".  
    a. Successful, error-free runs will be shown with green checks.  
    b. When the workflow completes, click on the most recent "Rollout Workflow to Project", then on the next screen click on "Rollout-Workflow". Scroll down and open "Rollout to destination repo" for the dry-run report to see if this is what you expect.  
    c. Next, click on "Label-Suggestions/Rollout-Label-Directory", then scroll down to "Preview PR comment". This will show the text for the supplemental comment on the PR.
  </details>  
  &emsp;  



## Repository Structure

```markdown
workflow-configs/
│
├── gha-add-update-label-weekly/        # "Add Update Label Weekly" workflow
│   ├── dist/ 
│   │   └── index.js                    # Esbuild's generated build artifact / production entry point 
│   ├── action.yml
│   └── index.js
│
├── core/                               # Core business logic
│   └── add-update-label-weekly.js      # "Add Update Label Weekly" files
│
├── shared/                             # Shared utilities across all actions
│   ├── find-linked-issue.js            # Find linked issues 
│   ├── format-log-messages.js          # `logger` utility to sort log messages
│   ├── get-repo-labels.js              # Retrieves repo labels
│   ├── hide-issue-comment.js           # Minimizes comments 
│   ├── manage-issue-labels.js          # Set of issue-labelling utilities 
│   ├── manage-issue-timeline.js        # Set of issue-timeline utilities
│   ├── post-issue-comment.js           # Post comment on issue
│   ├── query-issue-info.js             # Get issue data (GraphQL)
│   └── resolve-configs.js              # Resolve config files
│
├── example-configs/                    # Example configuration files
│   ├── add-update-instructions-template.example.md⎫ 
│   ├── add-update-label-weekly-config.example.yml ⎬ Configs for "Add Update Label Weekly"
│   └── add-update-label-weekly.example.yml        ⎭ 
│
├── .gitignore 
├── auto-release.sh                     # Script for updating version on a branch
├── auto-update-main.sh               # Script for updating version on the main
├── package.json                        
├── package-lock.json                   
├── CHANGELOG.md                        # Change log for tracking changes per version
└── README.md                           # This file
```
<br />


## Available Actions  


### Add Update Label Weekly

Monitors “In Progress” issues for updates since the last run and posts reminders to assignees who haven’t provided activity.<br>[Full details →](#add-update-label-weekly-1)

### (Additional Coming Soon)  

<br />

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
- Applies the label "statusInactive1" : `status: to update!`<sup>4</sup> if this is the first notice.
- Applies the label "statusInactive2": `status: 2 weeks inactive`<sup>4</sup> if this is the second notice. 
- Additional features:
  - Minimizes previous, repetitive bot comments within a specified timeframe<sup>2</sup>.
  - Applies the label (default) "statusUpdated": `status: updated`<sup>4</sup> if an update was posted recently.
  - Removes previously applied labels when appropriate.
- Ensures ongoing communication, accountability, and support across active tasks.


These are configurable to match your repo, see [Step 2: Customize Config →](#step-2-customize-config):  
<sub>&emsp; <sup>1</sup> Project Board status-columns  
&emsp; <sup>2</sup> All time thresholds used by the automation  
&emsp; <sup>3</sup> Reminder message  
&emsp; <sup>4</sup> All label names</sub>  



---

## Shared Utilities

Located in `shared/`, these are used across multiple actions:

### `resolve-configs.js`

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

### `find-linked-issue.js`

- Parses PR body to find linked issues, e.g. "Fixes: #123", "Resolves: #456", etc.

### `format-log-messages.js`

- Wraps log messages with tags via `logger.` including `[STEP]`, `[INFO]`, `[SUCCESS]`, `[WARN]`, `[ERROR]`, `[DEBUG]`.

### `get-repo-labels.js`

- Retrieves list of all labels from repo

### `hide-issue-comment.js`

- Minimizes comments using GraphQL mutation.

### `manage-issue-labels.js`

- Collection of utility functions for issue labeling, including `addLabels()` and `deleteLabels()`.

### `manage-issue-timeline.js`

- Collection of utility functions for issue timelines, including `setLocalTime()` and `getIssueTimeline()`.

### `post-issue-comment.js`

- Posts a comment onto an issue.

### `query-issue-info.js`

- Uses GraphQL API to find an issue's node_id, Project Board status name, and the corresponding status id.  


<br />

---

# Monorepo Development Notes

The following applies to the **maintenance** of the `hackforla/automate-the-org` repo only.
### Setup

```bash
git clone https://hackforla/my_github_username/hackforla/automate-the-org.git
cd automate-the-org
npm install
```

### Adding Dependencies

Since this is a composite action that runs in the GitHub Actions environment, dependencies are installed automatically in `package.json`.

### Testing

Test actions in a separate test repository before releasing next version.

### Adding a New Action

1. Create new folder: `new-action-name/`
2. Add `action.yml` and `index.js`
3. Add logic to `core/` if substantial
4. Add shared utilities to `shared/` if reusable
5. Create example config in `example-configs/`
6. Update this README

---
### Versioning

Make all necessary changes and commit as usual:

```bash
git add .
git commit -m "what is being committed"
git push
```
_Note: as always, use `git add .` or `git add <individual file>` as appropriate_

Rebuild the `esbuild` files, then re-commit: 

```bash
npm install
npm run build
git add .
git commit -m "new release build"
git push
```
#### Update the CHANGELOG.md
Update the [CHANGELOG.md](https://github.com/hackforla/automate-the-org/blob/main/CHANGELOG.md) with the latest changes (using prefixes such as "fix: " or "feat: " -see `CHANGELOG.md`) as needed, then double-check the most recent version:

```bash
git tag
```
This should match the most recent version listed in the `CHANGELOG.md`, which should also match the latest version listed in [package.json](https://github.com/hackforla/automate-the-org/blob/main/package.json). If it doesn't, then you may need to manually correct the versions.
#### Run the automatic versioning utilities
Now run the automatic versioning utilities. These will check whether you have set an `upstream`, and ask whether the next version should be a patch, minor, or major version change per [semver](https://semver.org/) (e.g. version MAJOR.MINOR.PATCH):


```bash
./auto-release.sh
```
Once the final commit is made to the `main` branch at Automate-the-ORG:

```bash
./auto-update-main.sh
```

#### Versioning adjustments
Use the following for adjustments to the version tags (but only if you understand what you are doing!) 

- To remove previously-committed versions:
  ```bash
  git tag -d <version>
  git push origin --delete <version>
  ```
  _Remember to adjust `CHANGELOG.md` and `package.json` also._
- If you did not set your upstream branch but pushed the version anyway, you will need to set your `upstream` to `main` branch, then:
  ```bash
  git push upstream <version>
  ```

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
