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
// Comment Validators
const COMMENT_VALIDATORS = [
  check('text', 'A text is required')
    .not()
    .isEmpty()
];

/*
    @Route          GET api/posts
    @Description    GET all posts
    @Access         Private
*/
ROUTER.get('/', AUTH, async (request, response) => {
  // Attemp to retrieve all posts from database
  try {
    // Assign posts to variable
    const POSTS = await POST_MODEL.find().sort({ date: -1 });
    // respond to client with posts
    response.json(POSTS);
    //
  } catch (error) {
    console.error(`${error.message}`.red.bold);
    response.status(500).send('Server Error');
  }
});

/*
    @Route          GET api/posts/me
    @Description    GET all owned posts
    @Access         Private
*/
ROUTER.get('/me', AUTH, async (request, response) => {
  // Attemp to retrieve all posts from database
  try {
    // Assign posts to variable
    const POSTS = await POST_MODEL.find({ user: request.user.id }).sort({
      date: -1
    });
    // respond to client with posts
    response.json(POSTS);
    //
  } catch (error) {
    console.error(`${error.message}`.red.bold);
    response.status(500).send('Server Error');
  }
});

/*
    @Route          GET api/posts/:id
    @Description    GET single post
    @Access         Private
*/
ROUTER.get('/:id', AUTH, async (request, response) => {
  // Attemp to retrieve all posts from database
  try {
    // Assign post to variable and send to client
    const POST = await POST_MODEL.findById(request.params.id);
    if (!POST) {
      response.status(404).json({ message: 'No such Post' });
    } else {
      response.json(POST);
    }
    //
  } catch (error) {
    if (error.kind === 'ObjectId') {
      console.error(`\n${error.message}`.red.bold);
      response.status(404).json({ message: 'No such post' });
    } else {
      console.error(error.message);
      response.status(500).send('Server Error');
    }
  }
});

/*
    @Route          DELETE api/posts/:id
    @Description    DELETE single post
    @Access         Private
*/
ROUTER.delete('/:id', AUTH, async (request, response) => {
  // Attemp to retrieve all posts from database
  try {
    // Assign post to variable
    const POST = await POST_MODEL.findById(request.params.id);
    // Assert post existence and respond
    if (!POST) {
      response.status(404).json({ message: 'No such Post' });
      //
    } else if (POST.user.toString() === request.user.id) {
      // Remove post
      await POST_MODEL.deleteOne(POST);
      //
      // Prepare response:
      // Get a list of all posts of the authorized user
      const USER_POSTS = await POST_MODEL.find({ user: request.user.id });
      // Get count
      const POSTS_COUNT = await POST_MODEL.find({
        user: request.user.id
      }).countDocuments();
      // Respond
      response.json({
        message: 'Post deleted!',
        posts: { count: POSTS_COUNT, posts: USER_POSTS }
      });
      //
      // User not authorized
    } else {
      response.status(404).json({ message: 'You should not be here' });
    }
    //
  } catch (error) {
    if (error.kind === 'ObjectId') {
      console.error(`\n${error.message}`.red.bold);
      response.status(404).json({ message: 'No such post' });
    } else {
      console.error(error.message);
      response.status(500).send('Server Error');
    }
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
    const NEW_POST = new POST_MODEL({
      user: request.user.id,
      text: request.body.text,
      name: user.name,
      avatar: user.avatar
    });
    // Save post to db
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

/*
    @Route          GET api/posts/:id/likes
    @Description    Get Likes of post
    @Access         Private
*/
ROUTER.get('/:id/likes', AUTH, async (request, response) => {
  // Attempt to find post and retrieve likes
  try {
    // Target Post and assert
    let targetPost = await POST_MODEL.findById(request.params.id);
    if (!targetPost)
      return response.status(404).json({ message: 'No such post' });
    // Assert likes and invite to if empty
    if (targetPost.likes.length === 0) {
      return response.json({
        message: 'No likes here, be the first one to add one'
      });
    } else {
      // Respond to client
      response.json(targetPost.likes);
    }
    //
  } catch (error) {
    if (error.kind === 'ObjectId') {
      console.error(`\n${error.message}`.red.bold);
      response.status(404).json({ message: 'No such post' });
    } else {
      console.error(error.message);
      response.status(500).send('Server Error');
    }
  }
});

/*
    @Route          PUT api/posts/:id/likes
    @Description    Add Liker to post
    @Access         Private
*/
ROUTER.put('/:id/likes', AUTH, async (request, response) => {
  // Attempt to find the post and add a liker to likes array
  try {
    // Find post
    const TARGET_POST = await POST_MODEL.findById(request.params.id);
    if (!TARGET_POST)
      return response.status(404).json({ message: 'No such post' });
    // Who's liking it?
    const LIKER = await USER_MODEL.findById(request.user.id);
    // Check if user already liked picture
    if (!TARGET_POST.likes.every(like => like.user.toString() !== LIKER.id))
      return response
        .status(400)
        .json({ message: 'You have liked this post already' });
    // Create like object
    const NEW_LIKE = {
      user: LIKER.id,
      name: LIKER.name
    };
    // Add like to post
    TARGET_POST.likes.unshift(NEW_LIKE);
    // Save post
    await TARGET_POST.save();
    // Respond
    response.json(TARGET_POST.likes);
    //
  } catch (error) {
    if (error.kind === 'ObjectId') {
      console.error(`\n${error.message}`.red.bold);
      response.status(404).json({ message: 'No such post' });
    } else {
      console.error(error.message);
      response.status(500).send('Server Error');
    }
  }
});

/*
    @Route          PUT api/posts/:id/unlike
    @Description    Add Liker to post
    @Access         Private
*/
ROUTER.put('/:id/unlike', AUTH, async (request, response) => {
  // Attempt to find the post and add a liker to likes array
  try {
    // Find post and assert
    let targetPost = await POST_MODEL.findById(request.params.id);
    if (!targetPost)
      return response.status(404).json({ message: 'No such post' });
    //
    // Who is unliking the post?
    const UNLIKER = await USER_MODEL.findById(request.user.id).select(
      '-password'
    );
    // Validate UNLIKER
    if (!UNLIKER) return response.status(400).json({ message: 'Bad request' });
    // Create updated likes array
    const UPDATED_LIKES = targetPost.likes.filter(
      like => like.user.toString() !== UNLIKER._id.toString()
    );
    // Check if user liked picture in order to unlike
    if (UPDATED_LIKES.length === targetPost.likes.length) {
      return response
        .status(400)
        .json({ message: 'You have not liked this picture' });
    } else {
      // Update target post
      targetPost.likes = UPDATED_LIKES;
      await targetPost.save();
      // Respond to client
      response.json(targetPost.likes);
    }
    //
  } catch (error) {
    if (error.kind === 'ObjectId') {
      console.error(`\n${error.message}`.red.bold);
      response.status(404).json({ message: 'No such post' });
    } else {
      console.error(error.message);
      response.status(500).send('Server Error');
    }
  }
});

/*
    @Route          GET api/posts/:id/comments
    @Description    GET comments of post
    @Access         Private
*/
ROUTER.get('/:id/comments', AUTH, async (request, response) => {
  // Attempt to find comments and send
  try {
    // Target post and assert
    let targetPost = await POST_MODEL.findById(request.params.id);
    if (!targetPost)
      return response.status(404).json({ message: 'No such post' });
    // Assert comments and invite to if empty
    if (targetPost.comments.length === 0) {
      return response.json({
        message: 'No comments here, be the first one to add one'
      });
    } else {
      // Respond to client
      response.json(targetPost.comments);
    }
    //
  } catch (error) {
    if (error.kind === 'ObjectId') {
      console.error(`\n${error.message}`.red.bold);
      response.status(404).json({ message: 'No such post' });
    } else {
      console.error(error.message);
      response.status(500).send('Server Error');
    }
  }
});

/*
    @Route          PUT api/posts/:id/comments
    @Description    Add comment to post
    @Access         Private
*/
ROUTER.put(
  '/:id/comments',
  [AUTH, COMMENT_VALIDATORS],
  async (request, response) => {
    // Assert Validators
    const ERRORS = validationResult(request);
    if (!ERRORS.isEmpty())
      return response.status(404).json({ error: ERRORS.array() });
    // Attempt to find post and comment it
    try {
      // Target post and assert
      let targetPost = await POST_MODEL.findById(request.params.id);
      if (!targetPost)
        return response.status(400).json({ message: 'No such post' });
      // Find Commentator and assert
      const COMMENTATOR = await USER_MODEL.findById(request.user.id);
      if (!COMMENTATOR)
        return response.status(400).json({ message: 'Bad request' });
      // Create comment object
      const NEW_COMMENT = {
        user: COMMENTATOR.id,
        name: COMMENTATOR.name,
        avatar: COMMENTATOR.avatar,
        text: request.body.text
      };
      // Update comments array and save
      targetPost.comments.unshift(NEW_COMMENT);
      await targetPost.save();
      // Respond
      response.json(targetPost.comments);
      //
    } catch (error) {
      if (error.kind === 'ObjectId') {
        console.error(`\n${error.message}`.red.bold);
        response.status(404).json({ message: 'No such post' });
      } else {
        console.error(error.message);
        response.status(500).send('Server Error');
      }
    }
  }
);

/*
    @Route          PUT api/posts/:id/comments/:comment_id
    @Description    Remove comment from post
    @Access         Private
*/
ROUTER.put('/:id/comments/:comment_id', AUTH, async (request, response) => {
  // Attempt to find the post and uncomment
  try {
    // Target post and assert
    let targetPost = await POST_MODEL.findById(request.params.id);
    if (!targetPost)
      return response.status(400).json({ message: 'No such post' });
    // Target comment
    let comment_to_delete = await targetPost.comments.find(
      comment => comment.id.toString() === request.params.comment_id
    );
    if (!comment_to_delete)
      return response.status(404).json({ message: 'No such comment' });
    // create updated comments array
    if (
      comment_to_delete.user.toString() === request.user.id ||
      request.user.id === targetPost.user.toString()
    ) {
      const UPDATED_COMMENTS = targetPost.comments.filter(
        comment => comment.id.toString() !== comment_to_delete.id
      );
      targetPost.comments = UPDATED_COMMENTS;
      await targetPost.save();
      // Respond
      return response.json(targetPost.comments);
      //
    } else {
      return response
        .status(401)
        .json({ message: 'You cannot delete this comment' });
    }
  } catch (error) {
    if (error.kind === 'ObjectId') {
      console.error(`\n${error.message}`.red.bold);
      response.status(404).json({ message: 'No such post' });
    } else {
      console.error(error.message);
      response.status(500).send('Server Error');
    }
  }
});

// Export ROUTER
module.exports = ROUTER;
