const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return sendError(res, 401, 'Not authorized, token missing');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return sendError(res, 401, 'Not authorized, user not found');
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return sendError(res, 401, 'Not authorized, token has expired');
      }
      return sendError(res, 401, 'Not authorized, invalid token');
    }
  } else {
    return sendError(res, 401, 'Not authorized, no token provided');
  }
};

module.exports = { protect };
