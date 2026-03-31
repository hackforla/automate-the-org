<!--
Add Update Label Weekly
PR Template for destination repo

Source and destination filepaths

```yml
workflow_file:
  src: ../../example-configs/add-update-label-weekly.example.yml
  dest: .github/workflows/add-update-label-weekly.yml

config_files:
  - src: ../../example-configs/add-update-label-weekly-config.example.yml
    dest: github-actions/workflow-configs/add-update-label-weekly-config.yml
  - src: ../../example-configs/add-update-instructions-template.example.md
    dest: github-actions/workflow-configs/templates/add-update-instructions-template.md
```
-->

## Automated Workflow Setup

This PR adds the "Add Update Label Weekly" GitHub Actions workflow to your project.


### Files installed by this PR

- **Workflow file**:
  - `.github/workflows/add-update-label-weekly.yml` 
- **Configuration files**:
  - `github-actions/workflow-configs/add-update-label-weekly-config.yml`
  - `github-actions/workflow-configs/templates/add-update-instructions-template.md`

### What this workflow does

- Monitors open, assigned issues with the default status "In progress (actively working)"
- Checks for recent update comments from assignees
- Posts reminders for devs to provide issue progress updates
- Labels issues that need updates as well as issues that are considered inactive

### Security

- Uses organization-managed, secure GitHub App with just-in-time token
- Starts in dry-run mode (safe testing)  
- No project-specific tokens or secrets needed

### How to use

1. **Review configurations and make changes** to the respective files attached to this PR:
    - `github-actions/workflows/add-update-label-weekly.yml` 
      - Adjust the cron schedule as needed for your project (https://crontab.cronhub.io/). 
      - Current cron is scheduled to run Fridays at 0700 UTC, every week except in July and December.
    - `github-actions/workflow-configs/add-update-label-weekly-config.yml`
      - This configuration file lists all workflow variables that can be customized to match the specific conditions of your project.
      - Each variable has been assigned a default value. Before you run the workflow, carefully review each variable and edit the provided value so that it matches the value used in your repository, or in the case of the "Time thresholds", to set the behavior you want.
      - Configure the values only as specified. Do not edit the variable keys or change the file formatting, otherwise the workflow may crash or behave unexpectedly.
      - `"Labels and label placeholders used by this workflow"`
        - The `labels:` section includes different categories of labels. Each label name appears in "double quotes" and must match an existing label in your repository exactly.
          - The `required:` section lists label placeholder keys that are essential to the workflow. Each key must map- exactly- to an actual label in your project. 
          - The `filtering:` section specifies labels that exclude certain issues from update checks. If an issue has any of these labels, the workflow will skip that issue and not process it.
          - See the config.yml for additional instructions.
      - `"Time thresholds (in days)"`
        - The `timeframes:` section defines placeholder keys that represent time thresholds, measured in days. Each issue’s update status is determined by comparing the assignee’s most recent activity timestamp against these defined thresholds. 
        - Default values are provided and **can be used as-is without modifications**. See the config.yml for detailed explanations and, only if needed, for instructions for customizing these values.
      - `"Project Board status-column configuration"`
        - The `projectBoard:` section defines placeholder keys representing Project Board status-column names. Similar to the required labels, each placeholder status-column key must map exactly to a status-column on your Project Board.
        - Change the values as needed for an exact match, and ensure the status-column value is in double quotes.
      - `"Bot configuration"`
        - This section should not need any edits.
      - `"Bot comment template"`
        - For the optional variable `teamSlackChannel`: Add your team's Slack Channel (once again in "double quotes") if you want this info on the Bot comment template.  
    - `github-actions/workflow-configs/templates/add-update-instructions-template.md`
      - We recommend keeping this version. If needed, edit using markdown syntax.

2. **After configuring and committing the PR**
    - **Test in dry-run preview mode (optional)**
      - After you have configured the variables and committed the PR, you can preview the expected behavior by manually triggering the workflow in dry-run preview mode.
      - Go to the "Actions" tab on your main repo page, then scroll down and select "Add Update Label Weekly - ATO" on the left. On the right, click "Run workflow". Select "Check to run in dry-run preview mode..." and then "Run workflow".
      - You may need to refresh the page until you see that the workflow is started. When the run completes successfully, select the most recent "Add-Update-Label-Weekly", then "Run workflow". 
      - Review the logs to see which issues would be flagged and how labels would be applied, and check whether this is what you expected or whether you need to change any of the configuration variables.
      - If the workflow ends with an error or if you have questions about any of the configuration variables, contact the team at ATO.
    - **Live mode**
      - Live mode is automatically triggered by the cron job; the automation will run at the next scheduled time.
      - You can also manually trigger a live run outside of the scheduled time: See the above notes about testing in dry-run preview mode, except when you see the checkbox for "Check to run in dry-run preview mode...", uncheck the box. When you click the final "Run workflow", the workflow will run immediately in live mode. 


---
_Auto-generated by **Rollout Workflow to Project** workflow._
