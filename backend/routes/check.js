const express = require('express');
const FeatureFlag = require('../models/FeatureFlag');
const Organization = require('../models/Organization');

const router = express.Router();

console.log('Loading feature check routes...');

// Check if a feature is enabled for an organization (no authentication required)
router.post('/check-feature', async (req, res) => {
  console.log('Processing feature check request...');
  
  try {
    const { featureKey, organizationName } = req.body;
    
    if (!featureKey || !organizationName) {
      console.log('Missing required fields in feature check request');
      return res.status(400).json({ 
        error: 'Feature key and organization name are required' 
      });
    }
    
    console.log(`Checking feature: ${featureKey} for org: ${organizationName}`);
    
    // Find organization by name
    const organization = await Organization.findByName(organizationName);
    if (!organization) {
      console.log(`Organization not found: ${organizationName}`);
      return res.status(404).json({ 
        error: 'Organization not found' 
      });
    }
    
    // Find feature flag
    const flag = await FeatureFlag.findByKeyAndOrganization(featureKey, organization.id);
    
    const isEnabled = flag ? flag.enabled : false;
    const exists = Boolean(flag);
    
    console.log(`Feature check result: ${featureKey} = ${isEnabled} (exists: ${exists})`);
    
    res.json({
      success: true,
      featureKey,
      organizationName,
      enabled: isEnabled,
      exists,
      message: exists ? 
        `Feature "${featureKey}" is ${isEnabled ? 'enabled' : 'disabled'}` :
        `Feature "${featureKey}" does not exist for this organization`
    });
    
  } catch (error) {
    console.error('Error checking feature flag:', error.message);
    res.status(500).json({ error: 'Failed to check feature flag' });
  }
});

// Alternative endpoint with URL parameters for simple GET requests
router.get('/check-feature/:organizationName/:featureKey', async (req, res) => {
  console.log('Processing GET feature check request...');
  
  try {
    const { featureKey, organizationName } = req.params;
    
    console.log(`Checking feature: ${featureKey} for org: ${organizationName}`);
    
    // Find organization by name
    const organization = await Organization.findByName(organizationName);
    if (!organization) {
      console.log(`Organization not found: ${organizationName}`);
      return res.status(404).json({ 
        error: 'Organization not found' 
      });
    }
    
    // Find feature flag
    const flag = await FeatureFlag.findByKeyAndOrganization(featureKey, organization.id);
    
    const isEnabled = flag ? flag.enabled : false;
    const exists = Boolean(flag);
    
    console.log(`Feature check result: ${featureKey} = ${isEnabled} (exists: ${exists})`);
    
    res.json({
      success: true,
      featureKey,
      organizationName,
      enabled: isEnabled,
      exists,
      message: exists ? 
        `Feature "${featureKey}" is ${isEnabled ? 'enabled' : 'disabled'}` :
        `Feature "${featureKey}" does not exist for this organization`
    });
    
  } catch (error) {
    console.error('Error checking feature flag:', error.message);
    res.status(500).json({ error: 'Failed to check feature flag' });
  }
});

module.exports = router;