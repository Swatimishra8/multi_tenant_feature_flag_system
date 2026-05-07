const jwt = require('jsonwebtoken');
const User = require('../models/User');

console.log('Loading authentication middleware...');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  console.log('Authenticating token...');
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`Token verified for user ID: ${decoded.userId}`);
    
    // Handle super admin (userId: 0) - doesn't exist in database
    if (decoded.userId === 0 && decoded.role === 'super_admin') {
      console.log('Super admin token verified - using static user data');
      req.user = {
        id: 0,
        username: decoded.username,
        role: 'super_admin',
        organization_id: null
      };
      return next();
    }
    
    // Get regular user details from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Check if user is super admin
const requireSuperAdmin = (req, res, next) => {
  console.log(`Checking super admin role for user: ${req.user?.username}`);
  
  if (!req.user || req.user.role !== 'super_admin') {
    console.log('Super admin access denied');
    return res.status(403).json({ error: 'Super admin access required' });
  }
  
  console.log('Super admin access granted');
  next();
};

// Check if user is organization admin
const requireOrgAdmin = (req, res, next) => {
  console.log(`Checking org admin role for user: ${req.user?.username}`);
  
  if (!req.user || req.user.role !== 'org_admin') {
    console.log('Organization admin access denied');
    return res.status(403).json({ error: 'Organization admin access required' });
  }
  
  console.log('Organization admin access granted');
  next();
};

// Check if user belongs to organization (for org admins and end users)
const requireOrganizationMember = (req, res, next) => {
  console.log(`Checking organization membership for user: ${req.user?.username}`);
  
  if (!req.user || !req.user.organization_id) {
    console.log('User not associated with any organization');
    return res.status(403).json({ error: 'Organization membership required' });
  }
  
  console.log(`Organization member verified - Org ID: ${req.user.organization_id}`);
  next();
};

// Check super admin static credentials (for initial login)
const checkSuperAdminCredentials = (username, password) => {
  console.log(`Checking super admin credentials for: ${username}`);
  
  const isValid = username === process.env.SUPER_ADMIN_USERNAME && 
                  password === process.env.SUPER_ADMIN_PASSWORD;
  
  console.log(`Super admin credentials check: ${isValid}`);
  return isValid;
};

module.exports = {
  authenticateToken,
  requireSuperAdmin,
  requireOrgAdmin,
  requireOrganizationMember,
  checkSuperAdminCredentials
};