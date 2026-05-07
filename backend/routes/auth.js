const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { checkSuperAdminCredentials } = require('../middleware/auth');

const router = express.Router();

console.log('Loading authentication routes...');

// Generate JWT token
const generateToken = (user) => {
  console.log(`Generating token for user: ${user.username}`);
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username, 
      role: user.role,
      organizationId: user.organization_id 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Login endpoint (all roles)
router.post('/login', async (req, res) => {
  console.log('Processing login request...');
  
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('Missing credentials in login request');
      return res.status(400).json({ error: 'Username and password required' });
    }

    console.log(`Login attempt for username: ${username}`);

    // Check if it's super admin login with static credentials
    if (checkSuperAdminCredentials(username, password)) {
      console.log('Super admin login successful');
      const superAdminUser = {
        id: 0,
        username: username,
        role: 'super_admin',
        organization_id: null
      };
      
      const token = generateToken(superAdminUser);
      
      return res.json({
        success: true,
        message: 'Super admin login successful',
        token,
        user: {
          id: 0,
          username: username,
          role: 'super_admin',
          organizationId: null
        }
      });
    }

    // Regular user login (org admin or end user)
    const user = await User.findByUsername(username);
    if (!user) {
      console.log(`User not found: ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await User.validatePassword(password, user.password_hash);
    if (!isValidPassword) {
      console.log(`Invalid password for user: ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`Login successful for user: ${username}`);
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        organizationId: user.organization_id
      }
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Signup endpoint (org admin only)
router.post('/signup', async (req, res) => {
  console.log('Processing signup request...');
  
  try {
    const { username, password, organizationName } = req.body;
    
    if (!username || !password || !organizationName) {
      console.log('Missing required fields in signup request');
      return res.status(400).json({ 
        error: 'Username, password, and organization name required' 
      });
    }

    console.log(`Signup attempt for username: ${username}, org: ${organizationName}`);

    // Check if organization exists (case-insensitive)
    let organization = await Organization.findByName(organizationName);
    if (!organization) {
      console.log(`Organization not found: ${organizationName}`);
      return res.status(400).json({ 
        error: 'Organization not found. Contact super admin to create organization first. Note: Organization name matching is case-insensitive.' 
      });
    }

    console.log(`Organization matched: "${organizationName}" -> "${organization.name}"`);

    // Check if username already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      console.log(`Username already exists: ${username}`);
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create org admin user
    const newUser = await User.create({
      username,
      password,
      role: 'org_admin',
      organizationId: organization.id
    });

    console.log(`Org admin created successfully: ${username}`);

    const token = generateToken({
      id: newUser.id,
      username: newUser.username,
      role: 'org_admin',
      organization_id: organization.id
    });

    res.status(201).json({
      success: true,
      message: 'Organization admin account created successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        role: 'org_admin',
        organizationId: organization.id,
        organizationName: organization.name
      }
    });

  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ error: 'Internal server error during signup' });
  }
});

// Logout endpoint (client-side token removal)
router.post('/logout', (req, res) => {
  console.log('Processing logout request...');
  console.log('Logout successful (client should remove token)');
  res.json({ 
    success: true, 
    message: 'Logout successful. Please remove token from client.' 
  });
});

module.exports = router;