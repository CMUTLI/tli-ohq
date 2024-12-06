
// Automatically set the configuration file based on the environment
const env = process.env.NODE_ENV;
switch (env) {
  case 'development':
    module.exports = require('./development');
    break;
  case 'production':
    module.exports = require('./production');
    break;
  case undefined:
    throw Error('No environment specified! Set NODE_ENV to development or production.');
  default:
    throw Error(`Unknown environment ${env}! Set NODE_ENV to development or production.`);
}
