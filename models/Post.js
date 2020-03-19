const MONGOOSE = require('mongoose');
const SCHEMA = MONGOOSE.Schema;

// Create Schema
const POST_SCHEMA = new SCHEMA({
  user: {
    type: SCHEMA.Types.ObjectId,
    ref: 'user'
  },
  tesx: {
    type: String,
    required: true
  },
  name: {
    type: String
  },
  avatar: {
    type: String
  },
  likes: [
    {
      user: {
        type: SCHEMA.Types.ObjectId,
        ref: 'user'
      }
    }
  ],
  comments: [
    {
      user: {
        type: SCHEMA.Types.ObjectId,
        ref: 'user'
      },
      text: {
        type: String,
        required: true
      },
      name: {
        type: String
      },
      avatar: {
        type: String
      },
      date: {
        type: Date,
        default: Date.now()
      },
      likes: [
        {
          user: {
            type: SCHEMA.Types.ObjectId,
            ref: 'user'
          }
        }
      ]
    }
  ],
  date: {
    type: Date,
    default: Date.now()
  }
});

// Create Model
const POST_MODEL = MONGOOSE.model('post', POST_SCHEMA);

// Export Model
module.exports = POST_MODEL;
