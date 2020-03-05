const ROUTER = require('express').Router();
const AUTH = require('../../middleware/auth');
const PROFILE_MODEL = require('../../models/Profile');
const USER_MODEL = require('../../models/User');
const { check, validationResult } = require('express-validator');

// User profile creation required data Validation
const VALIDATORS = [
  check('status', 'A status is required')
    .not()
    .isEmpty(),
  check('skills', 'Skills are required')
    .not()
    .isEmpty()
];

//
//
//
//  ROUTE REQUESTS BELOW
//
//
//
/*
    @Route          GET api/profile/me
    @Description    GET current user's profile
    @Access         Private
*/
ROUTER.get('/me', AUTH, async (request, response) => {
  try {
    // find and set Profile to the request.user.id's corresponding profile
    const PROFILE = await PROFILE_MODEL.findOne({
      user: request.user.id
    }).populate('user_model', ['name', 'avatar']); // Populate the user prop with name and avatar

    // No profile? Send code 400
    if (!PROFILE)
      return response
        .status(400)
        .json({ message: 'There is no profile for this user' });

    // All good, send profile to client
    response.json(PROFILE);
  } catch (error) {
    console.log(error.message);
    response.status(500).send('Server Error');
  }
});

/*
    @Route          POST api/profile/
    @Description    Create or update user profile
    @Access         Private
*/
ROUTER.post('/', [AUTH, VALIDATORS], async (request, response) => {
  const ERRORS = validationResult(request);
  // Check for errors in request
  if (!ERRORS.isEmpty()) {
    return response.status(400).json({ errors: ERRORS.array() });
  }

  // Profile properties from request body
  const {
    status,
    skills,
    company,
    website,
    location,
    bio,
    githubusername,
    youtube,
    facebook,
    twitter,
    instagram,
    linkedin
  } = request.body;

  // Build the actual profile object
  const PROFILE_OBJECT = {};
  // Set profile user equal to the id sent with the token that is decoded with the AUTH middleware
  PROFILE_OBJECT.user = request.user.id;
  // Check if other props were sent and assign
  if (company) PROFILE_OBJECT.company = company;
  if (website) PROFILE_OBJECT.website = website;
  if (location) PROFILE_OBJECT.location = location;
  if (bio) PROFILE_OBJECT.bio = bio;
  if (githubusername) PROFILE_OBJECT.githubusername = githubusername;
  // Assign already validated data [VALIDATORS]
  PROFILE_OBJECT.status = status;
  // turn skills to array and assign to profile object
  PROFILE_OBJECT.skills = skills
    .split(',')
    .map(skill => skill.trim().toUpperCase());

  return response.json(PROFILE_OBJECT.skills);
});

// Export ROUTER
module.exports = ROUTER;
