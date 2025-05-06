const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  console.log('Auth middleware executing for:', req.method, req.originalUrl);
  
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    console.log('No token provided - authorization denied');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Log token info (partial, for security)
    const tokenPreview = token.substring(0, 20) + '...';
    console.log('Token received:', tokenPreview);
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    
    // Add user from payload
    req.user = decoded;
    console.log('Token verified successfully, user:', decoded.id, 'role:', decoded.role);
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth; 