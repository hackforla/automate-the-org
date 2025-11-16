// Import modules
const { logger } = require('../shared/format-log-messages');


/**
 * Adds labels to a specified issue
 * @param {Number} issueNum   -an issue's number
 * @param {Array} labels      -an array containing the labels to add (captures the rest of the parameters)
 */
async function addLabels(github, context, config, issueNum, ...labelsToAdd) {
  if (config.dryRun) {
    logger.debug(` Would add '${labelsToAdd}' to issue #${issueNum}`);
    return;
  }
  try {
    // https://octokit.github.io/rest.js/v20#issues-add-labels
    await github.rest.issues.addLabels({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: issueNum,
      labels: labelsToAdd,
    });
    logger.info(` '${labelsToAdd}' label has been added`);
    // If an error is found, the rest of the script does not stop.
  } catch (err) {
    logger.error(`Function failed to add labels. Please refer to the error below: \n `, err);
  }
}



/**
 * Removes labels from a specified issue
 * @param {Number} issueNum    - an issue's number
 * @param {Array} labels       - an array containing the labels to remove (captures the rest of the parameters)
 */
async function removeLabels(github, context, config, issueNum, ...labelsToRemove) {
  for (let label of labelsToRemove) {
    if (config.dryRun) {
      logger.debug(` Would remove '${label}' from issue #${issueNum}`);
      continue;
    }
    try {
     // https://octokit.github.io/rest.js/v20#issues-remove-label
      await github.rest.issues.removeLabel({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: issueNum,
        name: label,
      });
      logger.info(` '${label}' label has been removed`);
    } catch (err) {
      if (err.status === 404) {
        logger.log(` '${label}' label not found, no need to remove`);
      } else {
        logger.error(`Function failed to remove labels. Please refer to the error below: \n `, err);
      }
    }
  }
}

module.exports = { addLabels, removeLabels }