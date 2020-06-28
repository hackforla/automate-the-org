#! /usr/bin/env node

require('dotenv').config()

const argv = require('minimist')(process.argv.slice(2))
const Cherp = require('./src/repo')
const usage = require('./src/usage')
const LOGGER = require('./src/logger')

async function main () {
  if (process.env.GITHUB_ORG === undefined) {
    usage()
    throw Error('Missing GITHUB_ORG environment variable')
  }

  const cherp = new Cherp({ userAgent: process.env.USER_AGENT || '%20%09%55%2b%31%46%34%32%36 cherp', githubOrg: process.env.GITHUB_ORG })

  if (argv._[0] === 'license') {
    const repos = await cherp.listAllReposMissingLicense()
    LOGGER.info(repos)
  } else if (argv._[0] === 'add-file') {
    await cherp.addFile(argv)
  } else if (argv.h || argv.help) {
    // help
    usage()
  } else {
    throw Error('Not Implemented')
  }
  process.exit(0)
}

main()
