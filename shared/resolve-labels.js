// Import modules
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { logger } = require('./format-log-messages');

/**
 * Resolves label keys to actual label names from a project's label directory
 * @param {Object} options
 * @param {string} options.projectRepoPath          - Path to the project repository
 * @param {string} options.labelDirectoryPath       - Relative path to `label-directory.json`
 * @param {Array<string>} options.requiredLabelKeys - Required label keys for workflow
 * @param {Array<string>} options.optionalLabelKeys - Optional label keys for workflow
 * @returns {Object}                                - Map of labelKeys to Label Names
 */
async function resolveLabels({ 
  projectRepoPath = process.env.GITHUB_WORKSPACE,
  labelDirectoryPath, 
  requiredLabelKeys = [], 
  optionalLabelKeys = [] 
}) {

  // Construct full path to label directory file
  const fullPath = path.join(projectRepoPath, labelDirectoryPath);
  
  // Check if label directory exists, if not throw error
  if (!fs.existsSync(fullPath)) {
    throw new Error(
      `Label directory file not found at: ${labelDirectoryPath}\n` +
      `   ⮡  Reference the config files for implementing the label directory file`
    );
  }
  
  // Retrieve and parse label directory YML
  let labelDirectory = {};

  try {
    const rawData = fs.readFileSync(fullPath, 'utf8');
    labelDirectory = yaml.load(rawData);
    if (!labelDirectory || typeof labelDirectory !== 'object') {
      throw new Error(`Label directory file at ${labelDirectoryPath} is empty or invalid`);
    }
  } catch (error) {
    if (error.name === 'YAMLException') {
      throw new Error(
        `Failed to retrieve label directory YAML at ${labelDirectoryPath}: ${error.message}`
      );
    }
    throw error;
  }
  
  logger.info(`Loaded label directory from: ${labelDirectoryPath}`);
  // logger.info(`labelKeys found: ${Object.keys(labelDirectory).join(', ')}`);
  
  // Check that required labelKeys exist in the label directory
  const missingLabelKeys = requiredLabelKeys.filter(key => !labelDirectory[key]);
  if (missingLabelKeys.length > 0) {
    throw new Error(
      `Missing required labelKeys: ${missingLabelKeys.join(', ')}\n` +
      `   ⮡  Provide required labelKeys as shown in the config files`
    );
  }
  
  // Build resolved labels object
  const resolvedLabels = {};
  const allLabelKeys = [...requiredLabelKeys, ...optionalLabelKeys];

  for (let labelKey of allLabelKeys) {
    if (labelDirectory[labelKey]) {
      resolvedLabels[labelKey] = labelDirectory[labelKey][0];
      logger.debug(`Mapped ${labelKey}: "${labelDirectory[labelKey]}"`);
    } else if (optionalLabelKeys.includes(labelKey)) {
      logger.warn(`Optional ${labelKey} not found - skipping`);
    }
  }

  
  if (Object.keys(resolvedLabels).length > 0) {
    logger.info(`Resolved ${Object.keys(resolvedLabels).length} labels`);
    logger.debug(`Resolved labels: ${JSON.stringify(resolvedLabels, null, 2)}`);
  } else {
    logger.warn(`No labels were resolved from the label directory`);
  }
  
  return resolvedLabels;
}

module.exports = { resolve:resolveLabels };