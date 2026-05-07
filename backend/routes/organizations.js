const express = require('express');
const Organization = require('../models/Organization');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

console.log('Loading organization routes...');

// All organization routes require super admin access
router.use(authenticateToken);
router.use(requireSuperAdmin);

// Get all organizations
router.get('/', async (req, res) => {
  console.log('Fetching all organizations...');
  
  try {
    const organizations = await Organization.findAll();
    const stats = await Organization.getStats();
    
    console.log(`Retrieved ${organizations.length} organizations`);
    
    res.json({
      success: true,
      organizations,
      stats
    });
  } catch (error) {
    console.error('Error fetching organizations:', error.message);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

// Get organization by ID
router.get('/:id', async (req, res) => {
  console.log(`Fetching organization ID: ${req.params.id}`);
  
  try {
    const { id } = req.params;
    const organization = await Organization.findById(id);
    
    if (!organization) {
      console.log(`Organization not found: ${id}`);
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    console.log(`Organization found: ${organization.name}`);
    res.json({
      success: true,
      organization
    });
  } catch (error) {
    console.error('Error fetching organization:', error.message);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

// Create new organization
router.post('/', async (req, res) => {
  console.log('Creating new organization...');
  
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      console.log('Organization name is required');
      return res.status(400).json({ error: 'Organization name is required' });
    }
    
    // Check if organization already exists
    const existingOrg = await Organization.findByName(name.trim());
    if (existingOrg) {
      console.log(`Organization already exists: ${name}`);
      return res.status(400).json({ error: 'Organization with this name already exists' });
    }
    
    const organization = await Organization.create({
      name: name.trim(),
      createdBy: req.user.username
    });
    
    console.log(`Organization created: ${organization.name}`);
    
    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      organization
    });
  } catch (error) {
    console.error('Error creating organization:', error.message);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

module.exports = router;