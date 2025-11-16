const core = require('@actions/core');
const github = require('@actions/github');
const { logger } = require('../shared/format-log-messages');
const resolveConfigs = require('../shared/resolve-configs');
const resolveLabels = require('../shared/resolve-labels');
const addUpdateLabelWeekly = require('../core/add-update-label-weekly');
const yaml = require('js-yaml'); 

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
    const dryRunInput = core.getInput('dry-run') || 'false';
    const dryRun = (dryRunInput).toLowerCase() === 'true';
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
    
    logger.info(`Project repository: ${context.repo.owner}/${context.repo.repo}`);
    logger.info(`Working directory: ${projectRepoPath}`);
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
        'commentTemplate',
      ],
    });
    logger.log(``);
    
    // Determine label directory path from config
    const labelDirectoryPath = config.labelDirectoryPath || 'github-actions/workflow-configs/_data/label-directory.json';
    
    // Resolve label keys to label names
    logger.step(`Resolving labels...`);
    const labels = await resolveLabels.resolve({
      projectRepoPath,
      labelDirectoryPath,
      requiredLabelKeys: [
        'statusUpdated',
        'statusInactive1',
        'statusInactive2',
      ],
      optionalLabelKeys: [
        'draft',
        'er',
        'epic',
        'dependency',
        'skillsIssueCompleted',
        'statusHelpWanted',
      ],
    });
    logger.log(``);
    
    // Execute the workflow
    logger.step(`Running Add Update Label Weekly workflow...`);
    
    await addUpdateLabelWeekly({
      github: octokit,
      context,
      labels,
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
      upperLimitDays: 35,       // Bot comments older than this are not checked (to reduce API calls)
    },
    
    projectBoard: {
      targetStatus: 'In progress (actively working)', 
      questionsStatus: 'Questions / In Review',
    },
    
    labels: {
      ignored: [
        'draft',
        'er',
        'epic',
        'dependency',
        'complexity0'
      ],
    },
    
    bots: [
      'github-actions[bot]',
      'HackforLABot',
    ],

    timezone: 'America/Los_Angeles',
    
    commentTemplate: getDefaultCommentTemplate(),
    
    labelDirectoryPath: 'github-actions/workflow-configs/_data/label-directory.json',
  };
}

/**
 * Returns the default comment template if not provided
 * @returns {string} Comment template with placeholders
 */
function getDefaultCommentTemplate() {
  return `Hello \${assignees}!
  
Please add an update comment using the below template (even if you have a pull request). Afterwards, remove 
the \`\${label}\` label and add the \`\${statusUpdated}\` label.

1. Progress: "What is the current status of your issue? What have you completed and what is left to do?"
2. Blockers: "Explain any difficulties or errors encountered."
3. Availability: "How much time will you have this week to work on this issue?"
4. ETA: "When do you expect this issue to be completed?"
5. Pictures (optional): "Add any pictures of the visual changes made to the site so far."

If you need help, be sure to either: 1) place your issue in the "\${questionsStatus}" status column of the 
Project Board and ask for help at your next meeting; 2) put a \`\${statusHelpWanted}\` label on your issue 
and pull request; or 3) put up a request for assistance on the team's <teamSlackChannel> Slack channel.  

Please note that including your questions in the issue comments- along with screenshots, if applicable- 
will help us to help you. [Here](https://github.com/hackforla/website/issues/1619#issuecomment-897315561) and [here](https://github.com/hackforla/website/issues/1908#issuecomment-877908152) are examples of well-formed questions.

Thanks for being part of HfLA!

<sub>You are receiving this comment because your last comment was before \${cutoffTime}.</sub>`;
}

// Run the action
run();