const express = require('express');
const FeatureFlag = require('../models/FeatureFlag');
const { authenticateToken, requireOrgAdmin, requireOrganizationMember } = require('../middleware/auth');

const router = express.Router();

console.log('Loading feature flag routes...');

// All feature flag routes require authentication
router.use(authenticateToken);

// Get all feature flags for organization (org admin only)
router.get('/', requireOrgAdmin, async (req, res) => {
  console.log('Fetching feature flags for organization...');
  
  try {
    const organizationId = req.user.organization_id;
    const flags = await FeatureFlag.findByOrganization(organizationId);
    
    console.log(`Retrieved ${flags.length} feature flags for org ${organizationId}`);
    
    res.json({
      success: true,
      flags
    });
  } catch (error) {
    console.error('Error fetching feature flags:', error.message);
    res.status(500).json({ error: 'Failed to fetch feature flags' });
  }
});

// Get specific feature flag by ID (org admin only)
router.get('/:id', requireOrgAdmin, async (req, res) => {
  console.log(`Fetching feature flag ID: ${req.params.id}`);
  
  try {
    const { id } = req.params;
    const flag = await FeatureFlag.findById(id);
    
    if (!flag) {
      console.log(`Feature flag not found: ${id}`);
      return res.status(404).json({ error: 'Feature flag not found' });
    }
    
    // Ensure flag belongs to user's organization
    if (flag.organization_id !== req.user.organization_id) {
      console.log(`Access denied to feature flag ${id} - wrong organization`);
      return res.status(403).json({ error: 'Access denied to this feature flag' });
    }
    
    console.log(`Feature flag found: ${flag.key}`);
    res.json({
      success: true,
      flag
    });
  } catch (error) {
    console.error('Error fetching feature flag:', error.message);
    res.status(500).json({ error: 'Failed to fetch feature flag' });
  }
});

// Create new feature flag (org admin only)
router.post('/', requireOrgAdmin, async (req, res) => {
  console.log('Creating new feature flag...');
  
  try {
    const { key, enabled = false } = req.body;
    
    if (!key || key.trim() === '') {
      console.log('Feature flag key is required');
      return res.status(400).json({ error: 'Feature flag key is required' });
    }
    
    const organizationId = req.user.organization_id;
    
    // Check if flag with this key already exists for organization
    const existingFlag = await FeatureFlag.findByKeyAndOrganization(key.trim(), organizationId);
    if (existingFlag) {
      console.log(`Feature flag already exists: ${key} for org ${organizationId}`);
      return res.status(400).json({ 
        error: 'Feature flag with this key already exists for your organization' 
      });
    }
    
    const flag = await FeatureFlag.create({
      key: key.trim(),
      enabled: Boolean(enabled),
      organizationId
    });
    
    console.log(`Feature flag created: ${flag.key}`);
    
    res.status(201).json({
      success: true,
      message: 'Feature flag created successfully',
      flag
    });
  } catch (error) {
    console.error('Error creating feature flag:', error.message);
    res.status(500).json({ error: 'Failed to create feature flag' });
  }
});

// Update feature flag (org admin only)
router.put('/:id', requireOrgAdmin, async (req, res) => {
  console.log(`Updating feature flag ID: ${req.params.id}`);
  
  try {
    const { id } = req.params;
    const { key, enabled } = req.body;
    
    if (!key || key.trim() === '') {
      console.log('Feature flag key is required for update');
      return res.status(400).json({ error: 'Feature flag key is required' });
    }
    
    // Check if flag exists and belongs to user's organization
    const existingFlag = await FeatureFlag.findById(id);
    if (!existingFlag) {
      console.log(`Feature flag not found for update: ${id}`);
      return res.status(404).json({ error: 'Feature flag not found' });
    }
    
    if (existingFlag.organization_id !== req.user.organization_id) {
      console.log(`Access denied to update feature flag ${id} - wrong organization`);
      return res.status(403).json({ error: 'Access denied to this feature flag' });
    }
    
    // If key is changing, check for conflicts
    if (key.trim() !== existingFlag.key) {
      const conflictFlag = await FeatureFlag.findByKeyAndOrganization(
        key.trim(), 
        req.user.organization_id
      );
      if (conflictFlag && conflictFlag.id !== parseInt(id)) {
        console.log(`Key conflict during update: ${key}`);
        return res.status(400).json({ 
          error: 'Another feature flag with this key already exists for your organization' 
        });
      }
    }
    
    const success = await FeatureFlag.updateById(id, {
      key: key.trim(),
      enabled: Boolean(enabled)
    });
    
    if (!success) {
      console.log(`Failed to update feature flag: ${id}`);
      return res.status(500).json({ error: 'Failed to update feature flag' });
    }
    
    // Get updated flag
    const updatedFlag = await FeatureFlag.findById(id);
    
    console.log(`Feature flag updated: ${updatedFlag.key}`);
    
    res.json({
      success: true,
      message: 'Feature flag updated successfully',
      flag: updatedFlag
    });
  } catch (error) {
    console.error('Error updating feature flag:', error.message);
    res.status(500).json({ error: 'Failed to update feature flag' });
  }
});

// Delete feature flag (org admin only)
router.delete('/:id', requireOrgAdmin, async (req, res) => {
  console.log(`Deleting feature flag ID: ${req.params.id}`);
  
  try {
    const { id } = req.params;
    
    // Check if flag exists and belongs to user's organization
    const flag = await FeatureFlag.findById(id);
    if (!flag) {
      console.log(`Feature flag not found for deletion: ${id}`);
      return res.status(404).json({ error: 'Feature flag not found' });
    }
    
    if (flag.organization_id !== req.user.organization_id) {
      console.log(`Access denied to delete feature flag ${id} - wrong organization`);
      return res.status(403).json({ error: 'Access denied to this feature flag' });
    }
    
    const success = await FeatureFlag.deleteById(id);
    
    if (!success) {
      console.log(`Failed to delete feature flag: ${id}`);
      return res.status(500).json({ error: 'Failed to delete feature flag' });
    }
    
    console.log(`Feature flag deleted: ${flag.key}`);
    
    res.json({
      success: true,
      message: 'Feature flag deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feature flag:', error.message);
    res.status(500).json({ error: 'Failed to delete feature flag' });
  }
});

module.exports = router;