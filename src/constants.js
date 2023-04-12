const path = require('path');
const os = require('os');
const REGISTRIES = require('../registries.json');

const HOME = 'home';
const AUTH = '_auth';
const EMAIL = 'email';
const REGISTRY = 'registry';
const REPOSITORY = 'repository';
const ALWAYS_AUTH = 'always-auth';
const REGISTRY_ATTRS = [REGISTRY, HOME, AUTH, ALWAYS_AUTH];
const HOME_PATH = os.homedir();
const NRMRC = path.join(HOME_PATH, '.nrmrc');
const NPMRC = path.join(HOME_PATH, '.npmrc');
const NRM_REMOTE_CONFIG = path.join(HOME_PATH, '.npmrc_remote.json');

module.exports = {
  NRMRC,
  NPMRC,
  NRM_REMOTE_CONFIG,
  REGISTRIES,
  AUTH,
  ALWAYS_AUTH,
  REPOSITORY,
  REGISTRY,
  HOME,
  EMAIL,
  REGISTRY_ATTRS,
};
