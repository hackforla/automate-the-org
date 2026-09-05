// Import modules
const fs = require('fs');
const path = require('path');
const core = require('@actions/core');
const github = require('@actions/github');
const { logger } = require('../shared/format-log-messages');
const resolveConfigs = require('../shared/resolve-configs');
const { checkIfLabelsInRepo } = require('../shared/get-repo-labels');
const addUpdateLabelWeekly = require('../core/add-update-label-weekly');
const packageJson = require('../package.json'); 

// Where the rollout installs the comment template. Overridable via `commentTemplatePath` in the config.
const DEFAULT_COMMENT_TEMPLATE_PATH =
  'github-actions/workflow-configs/templates/add-update-instructions-template.md';

/**
 * Main entry point for the Add Update Label Weekly action
 * Orchestrates configuration loading, label resolution, and workflow execution
 */
async function run() {
  try {
    logger.log(`=`.repeat(60));
    logger.log(`Add Update Label Weekly starting...`);
    logger.log(`=`.repeat(60));
    
    // Get action inputs
    const token = core.getInput('github-token', { required: true });
    const configPath = core.getInput('config-path') || 'github-actions/workflow-configs/add-update-label-weekly-config.yml';
    // Dry-run mode defaults to: false for scheduled run; true unless overridden for manual run
    const dryRunInput = core.getBooleanInput('dry-run', { required: false });
    const event = process.env.GITHUB_EVENT_NAME;
    const dryRun = dryRunInput ?? (event !== 'schedule');
    dryRun && logger.warn(`Running in DRY-RUN mode: No changes will be applied`);
    logger.setDryRun(dryRun);
    
    // Initialize octokit/GitHub client
    const octokit = github.getOctokit(token);
    const context = github.context;
    
    // Get project repository path
    const projectRepoPath = process.env.GITHUB_WORKSPACE;
    if (!projectRepoPath) {
      throw new Error(`GITHUB_WORKSPACE environment variable not set`);
    }
    
    logger.log(``);
    logger.info(`Project repository: ${context.repo.owner}/${context.repo.repo}`);
    logger.info(`Workflow version: ${packageJson.name}@${packageJson.version}`);
    logger.log(``);
    
    // Define workflow-specific defaults
    const defaults = getDefaultConfigs();
    
    // Load and merge configuration
    logger.step(`Resolving configurations...`);
    const config = resolveConfigs.resolve({
      projectRepoPath,
      configPath,
      defaults,
      overrides: { dryRun },
      requiredFields: [
        'timeframes.recentlyUpdatedByDays',
        'timeframes.needsUpdatingByDays',
        'timeframes.isInactiveByDays',
        'timeframes.upperLimitDays',
        'projectBoard.targetStatus',
        'projectBoard.questionsStatus',
      ],
    });

    // Resolve the reminder text. An inline `commentTemplate` in the config file wins; otherwise the
    // installed template file is used; otherwise the built-in default.
    if (config.commentTemplate) {
      logger.info(`Using inline 'commentTemplate' from the configuration file`);
    } else {
      config.commentTemplate = loadCommentTemplate(projectRepoPath, config.commentTemplatePath);
    }
    logger.log(``);

    // Confirm that all labels exist in the repo
    await checkIfLabelsInRepo(
      octokit, 
      context, 
      Object.values(config.labels.required),
      Object.values(config.labels.filtering || {})
    );
    logger.log(``);

    // Execute the workflow
    logger.step(`Running Add Update Label Weekly workflow...`);

    await addUpdateLabelWeekly({
      github: octokit,
      context,
      config,
    });
    
    logger.log(``);
    logger.log(`=`.repeat(60));
    logger.log(`Add Update Label Weekly - completed successfully`);
    logger.log(`=`.repeat(60));
    
  } catch (error) {
    logger.log(``);
    logger.log(`=`.repeat(60));
    logger.log(`Add Update Label Weekly - failed`);
    logger.log(`=`.repeat(60));
    if (error.stack) {
      console.error(`Stack trace: ${error.stack}`);
    }
    core.setFailed(`Action failed: ${error.message}`);
  }
}

/**
 * Returns default values for workflow if not specified in config
 * @returns {Object}    - Default configurations if not specified in config file
 */
function getDefaultConfigs() {
  return {
    timeframes: {
      recentlyUpdatedByDays: 3, // Issues updated within this many days are considered 'recentlyUpdated'
      needsUpdatingByDays: 7,   // Issues not updated for this many days are prompted as 'needsUpdating'
      isInactiveByDays: 14,     // Issues not updated for this many days are marked as 'isInactive'
      unassignedByDays: 21,     // Issues not updated for this many days have assignee removed <- FUTURE FEATURE
      upperLimitDays: 35,       // Bot comments older than this are not checked (to reduce API calls)
    },
    
    projectBoard: {
      targetStatus: 'In progress (actively working)', 
      questionsStatus: 'Questions / In Review',
      projectNumber: null,  // Board to read the status from; null uses the issue's first project item
    },
    
    labels: {
      filtering: [
     ],
    },
    
    bots: [
      'github-actions[bot]',
      'HackforLABot',
    ],

    teamSlackChannel: '',

    timezone: 'America/Los_Angeles',

    commentTemplatePath: DEFAULT_COMMENT_TEMPLATE_PATH,
  };
}

/**
 * Loads the reminder text from the template file installed in the project repo, falling back to the
 * built-in default when that file is absent or empty
 * @param {string} projectRepoPath - Path to the checked-out project repository
 * @param {string} [templatePath]  - Path to the template, relative to the repository root
 * @returns {string}               - Comment template with placeholders
 */
function loadCommentTemplate(projectRepoPath, templatePath) {
  const relativePath = templatePath || DEFAULT_COMMENT_TEMPLATE_PATH;
  const fullPath = path.join(projectRepoPath, relativePath);

  if (!fs.existsSync(fullPath)) {
    logger.info(`No comment template at ${relativePath}, using the built-in default`);
    return getDefaultCommentTemplate();
  }

  // Leading HTML comments in the shipped template are instructions to whoever installs it, not part of
  // the reminder, so they are dropped rather than posted onto the issue.
  const template = stripLeadingHtmlComments(fs.readFileSync(fullPath, 'utf8')).trim();

  if (!template) {
    logger.warn(`Comment template at ${relativePath} is empty, using the built-in default`);
    return getDefaultCommentTemplate();
  }

  logger.info(`Loaded comment template from: ${relativePath}`);
  return template;
}

/**
 * Strips any HTML comments at the very start of a string
 * @param {string} text - The raw file contents
 * @returns {string}    - The contents with leading HTML comments removed
 */
function stripLeadingHtmlComments(text) {
  return text.replace(/^(?:\s*<!--[\s\S]*?-->\s*)+/, '');
}

/**
 * Returns the default comment template if not provided
 * @returns {string} Comment template with placeholders
 */
function getDefaultCommentTemplate() {
  return `Hello \${assignees}-

Please add an update using the below template (even if you have a pull request). Afterwards, remove
the \`\${label}\` label and add the \`\${statusUpdated}\` label.

1. Progress: What is the current status of this issue? What have you completed and what is left to do?
2. Blockers: Explain any difficulties or errors encountered.
3. Availability: How much time will you have this week to work on this issue?
4. ETA: When do you expect this issue to be completed?
5. Pictures (optional): Add any pictures of the visual changes made to the site so far.

If you need help, be sure to either: 1) place your issue in the "\${questionsStatus}" status-column of the 
Project Board and ask for help at your next meeting; 2) put a \`\${statusHelpWanted}\` label on your issue 
and pull request; or 3) put up a request for assistance on the team's \${teamSlackChannel} Slack channel.  

Please note that including your questions in the issue comments- along with screenshots, if applicable- 
will help us to help you. Please see the following examples from the Website team of well-formed questions:  
- https://github.com/hackforla/website/issues/1619#issuecomment-897315561 and  
- https://github.com/hackforla/website/issues/1908#issuecomment-877908152

<sub>You are receiving this comment because your last update was before \${cutoffTime}.</sub>`;
}

// Run the action
run();