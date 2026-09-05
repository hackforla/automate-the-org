// Import modules
const { logger } = require('../shared/format-log-messages');
const queryIssueInfo = require('../shared/query-issue-info');
const findLinkedIssue = require('../shared/find-linked-issue');
const { setLocalTime, getIssueTimeline } = require('../shared/manage-issue-timeline');
const { addLabels, removeLabels } = require('../shared/manage-issue-labels');
const minimizeIssueComment = require('../shared/hide-issue-comment');

// Global variables
var github;
var context;
var config;

// Label variables (set in main function based on config)
var statusUpdated;
var statusInactive1;
var statusInactive2;
var statusHelpWanted;

// Time cutoff variables (set in main function based on config)
var recentlyUpdatedByDays;
var needsUpdatingByDays;
var isInactiveByDays;
// var unassignedByDays; // <-- FUTURE FEATURE
var upperLimitDays;

var recentlyUpdatedCutoffTime;
var needsUpdatingCutoffTime;
var isInactiveCutoffTime;
// var unassignedCutoffTime; // <-- FUTURE FEATURE
var upperLimitCutoffTime;



/**
 * The main function, which retrieves issues from a specific column in a specific project, 
 * before examining the timeline of each issue for outdatedness. An update to an issue is 
 * either 1.) a comment by the assignee, or 2.) assigning an assignee to the issue. If the 
 * last update was not between 7 to 14 days ago, apply the appropriate label and request an 
 * update. However, if the assignee has submitted a PR that will fix the issue regardless 
 * of when, all update-related labels should be removed.
 * @param {Object} github     - GitHub object from actions/github-script
 * @param {Object} context    - context object from actions/github-script
 * @param {Object} labels     - resolved label mappings (label keys to label names)
 * @param {Object} config     - configuration object
 */
async function main({ github: g, context: c, config: cfg }) {
  github = g;
  context = c;
  config = cfg;

  // Required labels
  statusUpdated = config.labels.required.statusUpdated;
  statusInactive1 = config.labels.required.statusInactive1;
  statusInactive2 = config.labels.required.statusInactive2;
  statusHelpWanted = config.labels.required.statusHelpWanted;
  
  // Calculate cutoff times from config settings
  recentlyUpdatedByDays = config.timeframes.recentlyUpdatedByDays;
  needsUpdatingByDays = config.timeframes.needsUpdatingByDays;
  isInactiveByDays = config.timeframes.isInactiveByDays;
  upperLimitDays = config.timeframes.upperLimitDays;

  // Set global cutoff time vars from config settings, adding/subtracting 10 mins to avoid edge cases
  const msPerMinute = 60 * 1000;
  recentlyUpdatedCutoffTime = new Date(Date.now() - recentlyUpdatedByDays * 24 * 60 * msPerMinute);
  needsUpdatingCutoffTime = new Date(Date.now() - (needsUpdatingByDays * 24 * 60 + 10) * msPerMinute);
  isInactiveCutoffTime = new Date(Date.now() - isInactiveByDays * 24 * 60 * msPerMinute);
  upperLimitCutoffTime = new Date(Date.now() - (upperLimitDays * 24 * 60 - 10) * msPerMinute);

  // Retrieve issue for all open & assigned issues in the target status column,
  // excluding issues with an 'filtering' label
  const issueNums = await getIssueNumsFromRepo();

  for (let issueNum of issueNums) {

    // Logging per issue for clarity
    logger.log(`Issue #${issueNum}:`);
    
    const timeline = await getIssueTimeline(github, context, issueNum);
    const assignees = await getAssignees(issueNum);

    // Add and remove labels as well as post comment if the issue's timeline indicates the issue is inactive, 
    // needs to be updated, or is up-to-date accordingly
    const responseObject = await isTimelineOutdated(timeline, issueNum, assignees);

    if (responseObject.result === true && responseObject.labels === statusInactive1) {
      await removeLabels(github, context, config, issueNum, statusUpdated, statusInactive2);
      await addLabels(github, context, config, issueNum, responseObject.labels);
      await postComment(issueNum, assignees, statusInactive1, responseObject.cutoff);
    } else if (responseObject.result === true && responseObject.labels === statusInactive2) {
      await removeLabels(github, context, config, issueNum, statusInactive1, statusUpdated);
      await addLabels(github, context, config, issueNum, responseObject.labels);
      await postComment(issueNum, assignees, statusInactive2, responseObject.cutoff);
    } else if (responseObject.result === false && responseObject.labels === statusUpdated) {
      await removeLabels(github, context, config, issueNum, statusInactive1, statusInactive2);
    } else if (responseObject.result === false && responseObject.labels === '') {
      await removeLabels(github, context, config, issueNum, statusInactive1, statusInactive2, statusUpdated);
    }

    // Minimize previous bot comments
    await minimizeComments(responseObject.commentsToBeMinimized);
  }
}



/**
 * Finds issue numbers for all open & assigned issues, excluding issues with an 'filtering' label
 * and returning issue numbers only if their status matches the target status from config
 *
 * @returns {Promise<Array>} issueNums     - an array of open, assigned, and statused issue numbers
 */
async function getIssueNumsFromRepo() {

  // Exclude issues with any of the 'filtering' labels
  const labelsToExclude = config.labels.filtering || [];
  
  let issueNums = [];
  let pageNum = 1;
  let result = [];

  while (true) {
    // https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#list-repository-issues
    const issueData = await github.request('GET /repos/{owner}/{repo}/issues', {
      owner: context.repo.owner,
      repo: context.repo.repo,
      assignee: '*',
      per_page: 100,
      page: pageNum,
    });
    
    if (!issueData.data.length) {
      break;
    } else {
      result = result.concat(issueData.data);
      pageNum++;
    }
  }

  for (let { number, labels: issueLabels, pull_request } of result) {
    if (!number) continue;

    // Exclude any pull requests that were found
    if (pull_request !== undefined) continue;
  
    // Exclude any issues that have excluded labels
    const issueLabelNames = issueLabels.map(label => label.name);
    if (issueLabelNames.some(item => labelsToExclude.includes(item))) continue;

    // For remaining issues, check if status === target status from config. `queryIssueInfo` returns null
    // when the issue has no status to read- e.g. it is not on the configured board- so skip those.
    const issueInfo = await queryIssueInfo(
      github, context, number, config.projectBoard.projectNumber);
    if (issueInfo && issueInfo.statusName === config.projectBoard.targetStatus) {
      issueNums.push(number);
    }
  }
  return issueNums;
}



/**
 * Assesses whether the timeline is outdated.
 * @param {Array} timeline      - list of events in the timeline of an issue, retrieved from issue's API
 * @param {Number} issueNum     - the issue's number
 * @param {String} assignees    - list of the issue assignee's username
 * @returns true if timeline indicates the issue is outdated/inactive, false if not; also returns appropriate labels that should be retained or added to the issue
 */
async function isTimelineOutdated(timeline, issueNum, assignees) { // assignees is an arrays of `login`'s
  let lastAssignedTimestamp = null;
  let lastCommentTimestamp = null;
  let commentsToBeMinimized = [];

  for (let i = timeline.length - 1; i >= 0; i--) {
    let eventObj = timeline[i];
    let eventType = eventObj.event;
    let eventTimestamp = eventObj.updated_at || eventObj.created_at;

    // If cross-referenced and fixed/resolved/closed by assignee and the pull request is open, remove all 
    // update-related labels. (Once a PR is opened, remove all labels because we focus on the PR, not the issue.)
    // If the linked PR is closed, continue through the rest of the conditions to receive the appropriate label.
    if (eventType === 'cross-referenced' && isLinkedIssue(eventObj, issueNum)) {
      const issueState = eventObj.source?.issue?.state;
      const isPR = eventObj.source?.issue?.pull_request;
   
      if (issueState === 'open' && isCommentByAssignees(eventObj, assignees)) {
        logger.log(`Open pull request linked to issue; remove all update-related labels`, 2);
        return { result: false, labels: '', commentsToBeMinimized: [] };
      }
      if (issueState === 'closed' && isPR ) {
        logger.log(`Linked pull request closed; continue with checks`, 2);
      }
    }

    // Update for the most recent 'lastCommentTimestamp' or 'lastAssignedTimestamp' 
    if (!lastCommentTimestamp && eventType === 'commented' && assignees.includes(eventObj.user?.login)) {
      lastCommentTimestamp = eventTimestamp;
    }
    if (!lastAssignedTimestamp && eventType === 'assigned' && assignees.includes(eventObj.assignee?.login)) {
      lastAssignedTimestamp = eventTimestamp;
    }

    // If this event is older than 'needsUpdatingCutoffTime', less than the 'upperLimitCutoffTime', AND this event is a comment by the GitHub Actions Bot, then add comment's 'node_id' to list of outdated comments to minimize later.
    if (
      isMomentRecent(eventObj.created_at, upperLimitCutoffTime) &&
      !isMomentRecent(eventObj.created_at, needsUpdatingCutoffTime) &&
      eventType === 'commented' &&
      isCommentByBot(eventObj)
    ) { 
      commentsToBeMinimized.push(eventObj.node_id);
    }
  }

  // Determine the latest activity timestamp and activity type
  const lastComment = lastCommentTimestamp ? new Date(lastCommentTimestamp) : null;
  const lastAssigned = lastAssignedTimestamp ? new Date(lastAssignedTimestamp) : null;

  let lastActivityTimestamp, lastActivityType;

  if (!lastAssigned || (lastComment && lastComment > lastAssigned)) {
    lastActivityTimestamp = lastCommentTimestamp;
    lastActivityType = "Assignee's last comment";
  } else {
    lastActivityTimestamp = lastAssignedTimestamp;
    lastActivityType = "Assignee's assignment";
  }

  // Save ISO string for cutoff time comparisons, but convert to local time for logging and comments
  const lastActivityTimestampISO = lastActivityTimestamp;

  if (lastActivityTimestamp) {
    lastActivityTimestamp = setLocalTime(lastActivityTimestamp);
  }
  logger.log(`Update status: ${lastActivityType} was at ${lastActivityTimestamp}`, 2);

  // If 'lastActivityTimestamp' more recent than 'recentlyUpdatedCutoffTime', keep updated label and remove others
  if (isMomentRecent(lastActivityTimestampISO, recentlyUpdatedCutoffTime)) {
    logger.log(`Decision: This is sooner than ${recentlyUpdatedByDays} days ago, retain '${statusUpdated}' label if exists`, 2);
    return { result: false, labels: statusUpdated, cutoff: recentlyUpdatedCutoffTime, commentsToBeMinimized }
  }

  // If 'lastActivityTimestamp' more recent than 'needsUpdatingCutoffTime', remove all labels
  if (isMomentRecent(lastActivityTimestampISO, needsUpdatingCutoffTime)) {
    logger.log(`Decision: This is between ${recentlyUpdatedByDays} and ${needsUpdatingByDays} days ago, no update-related labels`, 2);
    return { result: false, labels: '', cutoff: needsUpdatingCutoffTime, commentsToBeMinimized } 
  }

  // If 'lastActivityTimestamp' not yet older than the 'isInactiveCutoffTime', issue needs update label
  if (isMomentRecent(lastActivityTimestampISO, isInactiveCutoffTime)) { 
    logger.log(`Decision: This is between ${needsUpdatingByDays} and ${isInactiveByDays} days ago, use '${statusInactive1}' label`, 2);
    return { result: true, labels: statusInactive1, cutoff: needsUpdatingCutoffTime, commentsToBeMinimized }
  }

  // If 'lastActivityTimestamp' is older than the 'isInactiveCutoffTime', issue is outdated and needs inactive label
  logger.log(`Decision: This is older than ${isInactiveByDays} days ago, use '${statusInactive2}' label`, 2);
  return { result: true, labels: statusInactive2, cutoff: isInactiveCutoffTime, commentsToBeMinimized }
}



/***********************
*** HELPER FUNCTIONS ***
***********************/
function isMomentRecent(dateString, cutoffTime) {
  return new Date(dateString) >= cutoffTime;
}

function isLinkedIssue(data, issueNum) {
  return findLinkedIssue(data.source.issue.body) == issueNum
}

function isCommentByAssignees(data, assignees) {
  return assignees.includes(data.actor.login);
}

async function getAssignees(issueNum) {
  try {
    const results = await github.rest.issues.get({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: issueNum,
    });
    const assigneesData = results.data.assignees;
    const assigneesLogins = filterForAssigneesLogins(assigneesData);
    return assigneesLogins;
  } catch (err) {
    logger.error(`Issue #${issueNum}: Function failed to get assignees. See: \n `, err);
    return null;
  }
}

function filterForAssigneesLogins(data) {
  const logins = [];
  for (let item of data) {
    logins.push(item.login);
  }
  return logins;
}

function createAssigneeString(assignees) {
  const assigneeString = [];
  for (let assignee of assignees) {
    assigneeString.push(`@${assignee}`);
  }
  return assigneeString.join(', ');
}

// Populate default comment template with corresponding values
function formatComment(assignees, labelString, cutoffTime) {
  // Format cutoff time
  const cutoffTimeString = setLocalTime(cutoffTime);
  
  let completedInstructions = config.commentTemplate
    .replace(/\$\{assignees\}/g, assignees)
    .replace(/\$\{label\}/g, labelString)
    .replace(/\$\{statusUpdated\}/g, statusUpdated || 'status: updated')
    .replace(/\$\{questionsStatus\}/g, config.projectBoard.questionsStatus || 'Questions / In Review')
    .replace(/\$\{statusHelpWanted\}/g, statusHelpWanted || 'status: help wanted')
    .replace(/\$\{teamSlackChannel\}/g, config.teamSlackChannel || '')
    .replace(/\$\{cutoffTime\}/g, cutoffTimeString);

  return completedInstructions;
}

// async function postComment(issueNum, assignees, labelString, cutoffTime) {
async function postComment(issueNum, assignees, labelString, cutoffTime) {
  try {
    const assigneeString = createAssigneeString(assignees);
    const instructions = formatComment(assigneeString, labelString, cutoffTime);

    if (config.dryRun) {
      logger.debug(`Would post comment to issue`, 2);
      return;
    }
    // https://docs.github.com/en/rest/issues/comments?apiVersion=2022-11-28#create-an-issue-comment
    await github.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: issueNum,
      body: instructions,
    });
    logger.log(`Update request comment has been posted`, 2);
  } catch (err) {
    logger.warn(`Function failed to post comment ${err?.stack || err}`, 2);
  }
}

function isCommentByBot(data) {
  // Use bot list from config, default to 'github-actions[bot]'
  const botLogins = config.bots || ['github-actions[bot]'];
  
  // NOTE: this will not apply if `Complexity: Prework` omitted from scans
  // Else, if comment includes the MARKER, return false so it is not minimized
  let MARKER = '<!-- Skills Issue Activity Record -->'; 
  if (data.body && data.body.includes(MARKER)) {
    logger.info(`Found "Skills Issue Activity Record" - do not minimize`);
    return false; 
  }

  return botLogins.includes(data.actor.login);
}

// Asynchronously minimize all outdated comments
async function minimizeComments(comment_node_ids) {
  for (const node_id of comment_node_ids) {
    if (config.dryRun) {
      logger.debug(`Comment ${node_id} would be minimized`, 2);
      continue;
    }

    // Wait for 1000ms before doing the GraphQL mutation to avoid rate limiting
    await new Promise((resolve) => { setTimeout(resolve, 1000); });

    try {
      success = await minimizeIssueComment(github, node_id);
      if (success) {
      // Uncomment to log the id of each comment being minimized
      //   logger.log(`Comment ${node_id} has been minimized`, 2);
      }
    } catch (error) {
      logger.warn(`Failed to minimize comment ${node_id}: ${error.message}`, 2);
      // Do not throw error
    }
    
  }
}

module.exports = main;