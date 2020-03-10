const MONGOOSE = require('mongoose');
const SCHEMA = MONGOOSE.Schema;

// create User Schema
const USER_SCHEMA = new SCHEMA({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now()
  }
});

// Define Model
const USER_MODEL = MONGOOSE.model('user', USER_SCHEMA);

// Export model
module.exports = USER_MODEL;
