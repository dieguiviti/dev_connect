const ROUTER = require('express').Router();
const AUTH = require('../../middleware/auth');
const USER = require('../../models/User');
const JWT = require('jsonwebtoken');
const CONFIG = require('config');
const BCRYPT = require('bcryptjs');
const { check, validationResult } = require('express-validator');

// User data validators
const VALIDATORS = [
  // check email
  check('email', 'Please include a valid email').isEmail(),
  // check password
  check('password', 'A password is required to log in').exists()
];

//
//
// ROUTES BELOW
//
//

/*
    @Route          GET api/auth
    @Description    test route
    @Access         Public
*/
ROUTER.get('/', AUTH, async (request, response) => {
  try {
    // Find user in database with the user id corresponding to the jwt verified in with AUTH
    let user = await USER.findById(request.user.id).select('-password');
    // Send Respose to client
    response.json(user);

    // Catch server errors
  } catch (error) {
    console.log(error.message);
    response.status(500).send('Server Error');
  }
});

/*
    @Route          POST api/auth
    @Description    Check a user with DB (Login)
    @Access         Public
*/
ROUTER.post('/', VALIDATORS, async (request, response) => {
  const ERRORS = validationResult(request);
  // If ERRORS is not empty
  if (!ERRORS.isEmpty()) {
    // Return status 404 - ERRORS.array() is equal to an Array with the VALIDATOR error messages returned
    return response.status(400).json({ errors: ERRORS.array() });
  }
  // Declare and initialize instance of user props
  const { email, password } = request.body;

  try {
    // Attempt to find the user in the database
    let user = await USER.findOne({ email });
    if (!user) {
      return response.status(400).json({
        errors: [{ message: 'Invalid credentials' }]
      });
    }
    // We have a user? Great, lets compare the corresponing passwords
    const IS_MATCH = await BCRYPT.compare(password, user.password);
    if (!IS_MATCH) {
      return response
        .status(400)
        .json({ errors: [{ message: 'Invalid credentials' }] });
    }
    // Assign and sign JSON Web Token
    const PAYLOAD = {
      user: {
        id: user.id
      }
    };
    const SECRET = CONFIG.get('jwtSecret');
    const TOKEN_OPTIONS = { expiresIn: 360000 };
    const VERIFY_TOKEN_AND_SEND = (error, token) => {
      if (error) throw error;
      response.json({ token });
    };
    // sign and send token with proper payload
    JWT.sign(PAYLOAD, SECRET, TOKEN_OPTIONS, VERIFY_TOKEN_AND_SEND);

    // catch server errors
  } catch (error) {
    console.log(error.message);
    // At this line, any errors are server related
    response.status(500).send('Server error');
  }
});

// Export ROUTER
module.exports = ROUTER;
