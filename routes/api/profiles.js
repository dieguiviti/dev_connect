const ROUTER = require('express').Router();
const AXIOS = require('axios');
const CONFIG = require('config');
const AUTH = require('../../middleware/auth');
const PROFILE_MODEL = require('../../models/Profile');
const USER_MODEL = require('../../models/User');
const COLORS = require('colors');
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

// Education Credential Validators
const EDUCATION_VALIDATORS = [
  check('school', 'School is required')
    .not()
    .isEmpty(),
  check('degree', 'Degree is required')
    .not()
    .isEmpty(),
  check('fieldOfStudy', 'A study field is required')
    .not()
    .isEmpty(),
  check('from', 'A from date is required')
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
    console.log(`${error.message}`.red.bold);
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
    console.error(`${error.message}`.red.bold);
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
    console.error(`${error.message}`.red.bold);
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
    console.error(`${error.message}`.red.bold);
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
    console.error(`${error.message}`.red.bold);
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
      console.error(`${error.message}`.red.bold);
      response.status(500).send('Server Error');
    }
  }
);

/*
    @Route          DELETE api/profiles/me/experience/:id
    @Description    Delete experience credential from profile
    @Access         Private
*/
ROUTER.delete('/me/experience/:id', AUTH, async (request, response) => {
  // Attemp to find corresponding credential and delete data
  try {
    // Find target profile in db
    const TARGET_PROFILE = await PROFILE_MODEL.findOne({
      user: request.user.id
    });
    // Get target profile's experience's index
    const EXPERIENCE_INDEX = TARGET_PROFILE.experience
      .map(experience => experience.id)
      .indexOf(request.params.id);
    // Splice experiences array
    TARGET_PROFILE.experience.splice(EXPERIENCE_INDEX, 1);
    // Save target profile
    await TARGET_PROFILE.save();
    // Send response to client
    response.json(TARGET_PROFILE.experience);
    //
  } catch (error) {
    console.error(`${error.message}`.red.bold);
    response.status(500).send('Server Error');
  }
});

/*
    @Route          PUT api/profiles/me/education
    @Description    Add education credentials to profile
    @Access         Private
*/
ROUTER.put(
  '/me/education',
  [AUTH, EDUCATION_VALIDATORS],
  async (request, response) => {
    const ERRORS = validationResult(request);
    // Any errors?
    if (!ERRORS.isEmpty()) {
      return response.status(400).json({ errors: ERRORS.array() });
    }

    // Assign education props
    const {
      school,
      degree,
      fieldOfStudy,
      from,
      to,
      current,
      description
    } = request.body;

    // Create new experience object
    const NEW_EDUCATION = {
      school,
      degree,
      fieldOfStudy,
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
      TARGET_PROFILE.education.unshift(NEW_EDUCATION);
      // Save target profile
      await TARGET_PROFILE.save();
      // Send response to client
      response.json(TARGET_PROFILE.education);
      //
    } catch (error) {
      console.error(`${error.message}`.red.bold);
      response.status(500).send('Server Error');
    }
  }
);

/*
    @Route          DELETE api/profiles/me/education/:id
    @Description    Delete education credential from profile
    @Access         Private
*/
ROUTER.delete('/me/education/:id', AUTH, async (request, response) => {
  // Attemp to find corresponding credential and delete data
  try {
    // Find target profile in db
    const TARGET_PROFILE = await PROFILE_MODEL.findOne({
      user: request.user.id
    });
    // Get target profile's education's index
    const EDUCATION_INDEX = TARGET_PROFILE.education
      .map(education => education.id)
      .indexOf(request.params.id);
    // Splice education array
    TARGET_PROFILE.education.splice(EDUCATION_INDEX, 1);
    // Save target profile
    await TARGET_PROFILE.save();
    // Send response to client
    response.json(TARGET_PROFILE.education);
    //
  } catch (error) {
    console.error(`${error.message}`.red.bold);
    response.status(500).send('Server Error');
  }
});

/*
    @Route          GET api/profiles/github/:username
    @Description    Get user repositories from github
    @Access         Public
*/
ROUTER.get('/github/:username', async (request, response) => {
  // Attemp to retrieve user data through github api and assign to user profile
  try {
    // Github api url
    let url = `https://api.github.com/users/${request.params.username}/repos?per_page=5&sort=created:asc`;
    // Request's options
    const OPTIONS = {
      headers: { 'user-agent': 'node.js' },
      client_id: CONFIG.get('githubClientID'),
      client_secret: CONFIG.get('githubSecret')
    };
    // AXIOS request's response
    const AXIOS_RESPONSE = await AXIOS.get(url, OPTIONS);
    // Response to client
    response.json({
      count: AXIOS_RESPONSE.data.length,
      repos: AXIOS_RESPONSE.data
    });
    //
  } catch (error) {
    // Assert error
    if (error.response.status >= 400 && error.response.status < 500) {
      console.error(`${error.message}`.red.bold);
      response.status(404).json({ message: 'Github profile not found' });
    } else {
      console.error(`${error.message}`.red.bold);
      response.status(500).send('Server Error');
    }
  }
});

// Export ROUTER
module.exports = ROUTER;
