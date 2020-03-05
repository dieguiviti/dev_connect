const JWT = require('jsonwebtoken');
const CONFIG = require('config');
const SECRET = CONFIG.get('jwtSecret');

// Export middleware
module.exports = (request, response, next) => {
  // Get token from header
  const TOKEN = request.header('x-auth-token');
  // Do we have a token?
  if (!TOKEN)
    return response
      .status(401)
      .json({ message: 'No token, authorization denied' });
  // We do, lets attempt to VERIFY it
  try {
    const DECODED = JWT.verify(TOKEN, SECRET);
    request.user = DECODED.user; // refers to user payload in the json web token

    next();
    // Assert errors
  } catch (error) {
    response.status(401).json({ message: 'Token is not valid' });
  }
};
