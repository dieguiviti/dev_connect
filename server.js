const EXPRESS = require('express');
const CONNECT_DB = require('./config/db');
const MONGOOSE_MORGAN = require('./middleware/logger');
const COLORS = require('colors');

/* Key configuration with dotenv (.env) as an alternative to config
    const DOT_ENV = require('dotenv');
    DOT_ENV.config();
*/

// Initialize Express application
const APP = EXPRESS();

// Connect to database
CONNECT_DB();

// Initialize middleware
APP.use(EXPRESS.json({ extended: false }));

// Mongoose-morgan
APP.use(MONGOOSE_MORGAN);

/* Test request
    APP.get('/', (request, response) => response.send('API RUNNING'));
*/

// Define ROUTERS
const USERS_ROUTER = require('./routes/api/users');
const PROFILES_ROUTER = require('./routes/api/profiles');
const POSTS_ROUTER = require('./routes/api/posts');
const AUTH_ROUTER = require('./routes/api/auth');
// Define Routes
APP.use('/api/users', USERS_ROUTER);
APP.use('/api/profiles', PROFILES_ROUTER);
APP.use('/api/posts', POSTS_ROUTER);
APP.use('/api/auth', AUTH_ROUTER);

//Determine post
const PORT = process.env.PORT || 5000;

// Application listen
APP.listen(PORT, () => console.log(`SERVER IS LISTENING ON PORT: [${PORT}]`));
