// Import modules
const { logger } = require('./format-log-messages');

/**
 * @description - Get item info using its issue number
 * @param {Object} github          - GitHub object from function calling queryIssueInfo()
 * @param {Object} context         - Context of the function calling queryIssueInfo()
 * @param {Number} issueNum        - The issue's number
 * @param {Number} [projectNumber] - Optional Project Board number to read the status from. When omitted,
 *                                   the issue's first project item is used, which is arbitrary if the
 *                                   issue is on more than one board.
 * @returns {Object|null}          - An object containing the item ID and its status name, or `null` when
 *                                   the issue has no usable project item. Callers should treat `null` as
 *                                   "no status" and skip the issue.
 */
async function queryIssueInfo(github, context, issueNum, projectNumber = null) {
  const repoOwner = context.repo.owner;
  const repoName = context.repo.repo;

  const query = `query($owner: String!, $repo: String!, $issueNum: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $issueNum) {
        id
        projectItems(first: 20) {
          nodes {
            id
            project {
              number
              title
            }
            fieldValues(first: 50) {
              nodes {
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                  optionId
                }
              }
            }
          }
        }
      }
    }
  }`;

  const variables = {
    owner: repoOwner,
    repo: repoName,
    issueNum: issueNum,
  };

  let response;

  try {
    response = await github.graphql(query, variables);
  } catch (error) {
    logger.error(`Error finding Issue #${issueNum} id and status; error = ${error}`);
    throw new Error(error);
  }

  // Extract the list of project items associated with the issue
  const projectItems = response?.repository?.issue?.projectItems?.nodes ?? [];

  // An issue that is not on any board has no status to compare against. Warned rather than skipped
  // quietly: before this guard existed the missing item threw and aborted the whole run.
  if (projectItems.length === 0) {
    logger.warn(`Issue #${issueNum}: not on a Project Board; skipping`, 2);
    return null;
  }

  const projectItem = selectProjectItem(projectItems, issueNum, projectNumber);
  if (!projectItem) {
    return null;
  }

  // Find the node that carries the single-select value, then read its 'name' and 'optionId'.
  // Nodes for other field types come back as empty objects and are ignored.
  const fieldValues = projectItem.fieldValues?.nodes ?? [];
  const status = fieldValues.find((value) =>
    value && Object.prototype.hasOwnProperty.call(value, 'name'));

  // A card can sit on a board with its status column unset
  if (!status) {
    logger.debug(
      `Issue #${issueNum}: no status set on Project Board #${projectItem.project?.number}; skipping`, 2);
    return null;
  }

  return { id: projectItem.id, statusName: status.name, statusId: status.optionId };
}

/**
 * Chooses which of an issue's project items to read the status from
 * @param {Array<Object>} projectItems - The issue's project items
 * @param {Number} issueNum            - The issue's number, for logging
 * @param {Number} [projectNumber]     - Optional Project Board number to match on
 * @returns {Object|null}              - The selected project item, or `null` if the issue is not on the
 *                                       requested board
 */
function selectProjectItem(projectItems, issueNum, projectNumber) {
  const wantedNumber = projectNumber === null || projectNumber === undefined
    ? null
    : Number(projectNumber);

  if (wantedNumber !== null && !Number.isNaN(wantedNumber)) {
    const match = projectItems.find((item) => item?.project?.number === wantedNumber);
    if (!match) {
      logger.debug(`Issue #${issueNum}: not on Project Board #${wantedNumber}; skipping`, 2);
      return null;
    }
    return match;
  }

  // No board configured: keep the original behavior of using the first item, but say so when that choice
  // is arbitrary, since the status may then come from a board the workflow was never meant to read.
  const firstItem = projectItems[0];
  if (projectItems.length > 1) {
    logger.warn(
      `Issue #${issueNum}: on ${projectItems.length} Project Boards and no 'projectBoard.projectNumber' is ` +
      `configured; reading status from "${firstItem.project?.title}" (#${firstItem.project?.number})`, 2);
  }
  return firstItem;
}

module.exports = queryIssueInfo;
