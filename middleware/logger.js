const MONGOOSE_MORGAN = require('mongoose-morgan');
const CONFIG = require('config');

// Mongoose-morgan
const DB = CONFIG.get('mongoURI');
const MORGAN = MONGOOSE_MORGAN(
  {
    collection: 'request-logs',
    connectionString: DB
  },
  {},
  'tiny'
);

// Export Middleware
module.exports = MORGAN;
