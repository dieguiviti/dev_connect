const MONGOOSE = require('mongoose');
const CONFIG = require('config');

// URI
const DB_URI = CONFIG.get('mongoURI');
const DB_OPTIONS = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false
};

// Connect to URI using an asynchronous function
const CONNECT_DB = async () => {
  try {
    await MONGOOSE.connect(DB_URI, DB_OPTIONS);

    console.log('MongoDB CONNECTED WITH SUCCESS');
  } catch (error) {
    console.log(error.message);
    // Exit process with failure
    process.exit(1);
  }
};

// Export Connection configuration
module.exports = CONNECT_DB;
