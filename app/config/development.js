var config = {
	baseUrl: '/'
};

// Get/set these values from the Google APIs console
config.CMU_SHIB_CONFIG = {
  entityId: "https://www.eberly.cmu.edu/shibboleth",
  callbackURL: "https://www.eberly.cmu.edu/ohq/api/login/success",
  domain: "www.eberly.cmu.edu"
};
//  callbackURL: "/success",


// Get/set these values from the Google APIs console
config.GOOGLE_OAUTH2_CONFIG = {
  clientID: '458287048062-72ov34gb94lep95onf4ret5lalbkpie4.apps.googleusercontent.com',
  clientSecret: 'RpGBRq_ol6BBNLEpAYjYCImk',
  callbackURL: 'https://www.eberly.cmu.edu/ohq/api/login/success'
};

// Connection to database
config.KNEX = require('../knexfile.js').development;

// Google Spreadsheet backup ID
config.GOOGLE_SHEETS = {
	"id": "15_vlyPc1LJ8J2i6a_zEK1D3cbjnIyxN9XcY14RcpclQ"
};

// Superusers who can access super-secret stuff
config.ADMIN_USERS = [
  'meribyte@andrew.cmu.edu',
  'avic@andrew.cmu.edu',
  'jmbrooks@andrew.cmu.edu',
  'lkojtek@andrew.cmu.edu',
  'rserbin@andrew.cmu.edu',
  'amcgoug1@andrew.cmu.edu',
];

module.exports = config;
