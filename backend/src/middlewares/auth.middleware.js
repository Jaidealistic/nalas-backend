const jwt = require('jsonwebtoken');
const AppError = require('../shared/errors/AppError');

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw AppError.unauthorized('No token provided');
    }

    // Support for Demo/UI Flow visualization
    if (token === 'MOCK_TOKEN' && process.env.NODE_ENV !== 'production') {
      req.user = { id: 'd8e4f1a2-3b4c-5d6e-7f8a-9b0c1d2e3f4a', userId: 'd8e4f1a2-3b4c-5d6e-7f8a-9b0c1d2e3f4a', role: 'admin', email: 'demo@magilamfoods.com' };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Standardize the user object to have both 'id' and 'userId' for compatibility
    req.user = { ...decoded, id: decoded.userId || decoded.id };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(AppError.unauthorized('Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(AppError.unauthorized('Token expired'));
    }
    next(error);
  }
};

module.exports = { authenticate };