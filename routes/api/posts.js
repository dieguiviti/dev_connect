const ROUTER = require('express').Router();
const POST_MODEL = require('../../models/Post');
const USER_MODEL = require('../../models/User');
const PROFILE_MODEL = require('../../models/Profile');
const AUTH = require('../../middleware/auth');
const COLORS = require('colors');
const { check, validationResult } = require('express-validator');
//
//
// Validators:
// Post Validators
const POST_VALIDATORS = [
  check('text', 'A text is required')
    .not()
    .isEmpty()
];

/*
    @Route          GET api/posts
    @Description    GET all posts
    @Access         Public
*/
ROUTER.get('/', async (request, response) => {
  // Attemp to retrieve all posts from database
  try {
    // Assign posts to variable
    const POSTS = await POST_MODEL.find();
    // respond to client with posts
    response.json(POSTS);
    //
  } catch (error) {
    console.error(`${error.message}`.red.bold);
    response.status(500).send('Server Error');
  }
});

/*
    @Route          POST api/posts
    @Description    Add a post
    @Access         Private
*/
ROUTER.post('/', [AUTH, POST_VALIDATORS], async (request, response) => {
  // Check for validation errors
  const ERRORS = validationResult(request);
  if (!ERRORS.isEmpty())
    return response.status(400).json({ errors: ERRORS.array() });
  // Attemp to create a post with request data and save to db
  try {
    // Who is posting?
    let user = await USER_MODEL.findById(request.user.id).select('-password');
    // Create Post object
    const POST = {
      user: request.user.id,
      text: request.body.text,
      name: user.name,
      avatar: user.avatar
    };
    // Save post to db
    const NEW_POST = new POST_MODEL(POST);
    await NEW_POST.save();
    // User's posts
    const USER_POSTS = await POST_MODEL.find({ user: request.user.id });
    // Respond to client
    response.json(USER_POSTS);
    //
  } catch (error) {
    console.error(`${error.message}`.red.bold);
    response.status(500).send('Server Error');
  }
});

// Export ROUTER
module.exports = ROUTER;
