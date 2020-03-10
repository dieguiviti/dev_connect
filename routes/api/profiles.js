const ROUTER = require('express').Router();
const AUTH = require('../../middleware/auth');
const PROFILE_MODEL = require('../../models/Profile');
const USER_MODEL = require('../../models/User');
const { check, validationResult } = require('express-validator');

// User profile creation required data Validation
const PROFILE_VALIDATORS = [
  check('status', 'A status is required')
    .not()
    .isEmpty(),
  check('skills', 'Skills are required')
    .not()
    .isEmpty()
];

// Experience credential Validators
const EXPERIENCE_VALIDATORS = [
  check('title', 'A title is required')
    .not()
    .isEmpty(),
  check('company', 'A Company is required')
    .not()
    .isEmpty(),
  check('from', 'A "From" date is required')
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
    }).populate('user', ['name', 'avatar']); // Populate user prop with name and avatar props from user

    // No profile? Send code 400
    if (!PROFILE)
      return response
        .status(400)
        .json({ message: 'No profile yet, create one' });

    // All good, send profile to client
    response.json(PROFILE);
  } catch (error) {
    console.log(error.message);
    response.status(500).send('Server Error');
  }
});

/*
    @Route          POST api/profiles/
    @Description    Create or update user profile
    @Access         Private
*/
ROUTER.post('/', [AUTH, PROFILE_VALIDATORS], async (request, response) => {
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
  if (location) PROFILE_OBJECT.location = location.toUpperCase();
  if (bio) PROFILE_OBJECT.bio = bio;
  if (githubusername) PROFILE_OBJECT.githubusername = githubusername;
  // Assign already validated data [VALIDATORS]
  PROFILE_OBJECT.status = status;
  // turn skills to array and assign to profile object
  PROFILE_OBJECT.skills = skills
    .split(',')
    .map(skill => skill.trim().toUpperCase());
  // Create Social media object of PROFILE_OBJECT
  PROFILE_OBJECT.social = {};
  if (youtube) PROFILE_OBJECT.social.youtube = youtube;
  if (facebook) PROFILE_OBJECT.social.facebook = facebook;
  if (twitter) PROFILE_OBJECT.social.twitter = twitter;
  if (instagram) PROFILE_OBJECT.social.instagram = instagram;
  if (linkedin) PROFILE_OBJECT.social.linkedin = linkedin;

  // Attemp to find & save profile to db and send response to client
  try {
    let profile = await PROFILE_MODEL.findOne({ user: request.user.id });

    // Update
    if (profile) {
      profile = await PROFILE_MODEL.findOneAndUpdate(
        { user: request.user.id },
        { $set: PROFILE_OBJECT },
        { new: true }
      );
      return response.json(profile);
    }
    // Create
    profile = new PROFILE_MODEL(PROFILE_OBJECT);
    await profile.save();
    // Respond to client
    return response.json(profile);

    //
  } catch (error) {
    console.error(error.message);
    response.status(500).send('Server Error');
  }
});

/*
    @Route          GET api/profiles/
    @Description    Get all profiles
    @Access         Public
*/
ROUTER.get('/', async (request, response) => {
  try {
    // Initialize a variable containing all profiles
    const PROFILES = await PROFILE_MODEL.find().populate('user', [
      'name',
      'avatar'
    ]);

    // respond to client
    response.json(PROFILES);
    //
  } catch (error) {
    console.error(error.message);
    response.status(500).send('Server Error');
  }
});

/*
    @Route          GET api/profiles/user/:id
    @Description    Get profile by user id
    @Access         Public
*/
ROUTER.get('/user/:id', async (request, response) => {
  try {
    // Initialize a variable containing the routed profile
    const PROFILE = await PROFILE_MODEL.findOne({
      user: request.params.id
    }).populate('user', ['name', 'avatar']);

    // Check if there is a profile for user
    if (!PROFILE)
      return response
        .status(500)
        .json({ message: 'There is no profile for this user' });

    // respond to client
    response.json(PROFILE);
    //
  } catch (error) {
    console.error(error.message);
    // Avoid mistaken server errors
    if (error.kind == 'ObjectId') {
      return response.status(400).json({ message: 'Profile not found' });
    } else {
      response.status(500).send('Server Error');
    }
  }
});

/*
    @Route          DELETE api/profiles/me
    @Description    DELETE current user's profile and account
    @Access         Private
*/
ROUTER.delete('/me', AUTH, async (request, response) => {
  try {
    // remove  targeted profile
    // @TODO: remove user's posts
    await PROFILE_MODEL.findOneAndRemove({ user: request.user.id });
    await USER_MODEL.findOneAndRemove({ _id: request.user.id });
    response.json({ message: 'User deleted' });
    //
  } catch (error) {
    console.error(error.message);
    response.status(500).send('Server Error');
  }
});

/*
    @Route          PUT api/profiles/me/experience
    @Description    Add experience credentials to profile
    @Access         Private
*/
ROUTER.put(
  '/me/experience',
  [AUTH, EXPERIENCE_VALIDATORS],
  async (request, response) => {
    const ERRORS = validationResult(request);
    // Any errors?
    if (!ERRORS.isEmpty()) {
      return response.status(400).json({ errors: ERRORS.array() });
    }

    // Assign experience props
    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = request.body;

    // Create new experience object
    const NEW_EXPERIENCE = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    };

    // Attemp to find corresponding profile and save data
    try {
      // Find profile in db
      const TARGET_PROFILE = await PROFILE_MODEL.findOne({
        user: request.user.id
      });
      // push NEW_EXPERIENCE object to top of experience stack
      TARGET_PROFILE.experience.unshift(NEW_EXPERIENCE);
      // Save target profile
      await TARGET_PROFILE.save();
      // Send response to client
      response.json(TARGET_PROFILE.experience);
      //
    } catch (error) {
      console.error(error.message);
      response.status(500).send('Server Error');
    }
  }
);
// Export ROUTER
module.exports = ROUTER;
