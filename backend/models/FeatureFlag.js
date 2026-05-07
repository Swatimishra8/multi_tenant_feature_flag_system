const db = require('../config/database');

console.log('Loading FeatureFlag model...');

class FeatureFlag {
  static async create({ key, enabled = false, organizationId }) {
    console.log(`Creating feature flag: ${key} for org: ${organizationId}`);
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO feature_flags (key, enabled, organization_id)
        VALUES (?, ?, ?)
      `);
      
      stmt.run([key, enabled ? 1 : 0, organizationId], function(err) {
        if (err) {
          console.error('Error creating feature flag:', err.message);
          reject(err);
        } else {
          console.log(`Feature flag created with ID: ${this.lastID}`);
          resolve({ id: this.lastID, key, enabled, organizationId });
        }
      });
      
      stmt.finalize();
    });
  }

  static async findByOrganization(organizationId) {
    console.log(`Finding feature flags for organization: ${organizationId}`);
    
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM feature_flags WHERE organization_id = ? ORDER BY created_at DESC',
        [organizationId],
        (err, rows) => {
          if (err) {
            console.error('Error finding feature flags:', err.message);
            reject(err);
          } else {
            // Convert SQLite integer to boolean
            const flags = rows.map(row => ({
              ...row,
              enabled: Boolean(row.enabled)
            }));
            console.log(`Found ${flags.length} feature flags for organization ${organizationId}`);
            resolve(flags);
          }
        }
      );
    });
  }

  static async findById(id) {
    console.log(`Finding feature flag by ID: ${id}`);
    
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM feature_flags WHERE id = ?',
        [id],
        (err, row) => {
          if (err) {
            console.error('Error finding feature flag:', err.message);
            reject(err);
          } else {
            if (row) {
              // Convert SQLite integer to boolean
              row.enabled = Boolean(row.enabled);
              console.log(`Feature flag found: ${row.key}`);
            } else {
              console.log(`Feature flag not found with ID: ${id}`);
            }
            resolve(row);
          }
        }
      );
    });
  }

  static async findByKeyAndOrganization(key, organizationId) {
    console.log(`Finding feature flag: ${key} for organization: ${organizationId}`);
    
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM feature_flags WHERE key = ? AND organization_id = ?',
        [key, organizationId],
        (err, row) => {
          if (err) {
            console.error('Error finding feature flag by key:', err.message);
            reject(err);
          } else {
            if (row) {
              // Convert SQLite integer to boolean
              row.enabled = Boolean(row.enabled);
              console.log(`Feature flag found: ${key} = ${row.enabled}`);
            } else {
              console.log(`Feature flag not found: ${key} for organization ${organizationId}`);
            }
            resolve(row);
          }
        }
      );
    });
  }

  static async updateById(id, { key, enabled }) {
    console.log(`Updating feature flag ID: ${id}`);
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        UPDATE feature_flags 
        SET key = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      stmt.run([key, enabled ? 1 : 0, id], function(err) {
        if (err) {
          console.error('Error updating feature flag:', err.message);
          reject(err);
        } else {
          console.log(`Feature flag updated, changes: ${this.changes}`);
          resolve(this.changes > 0);
        }
      });
      
      stmt.finalize();
    });
  }

  static async deleteById(id) {
    console.log(`Deleting feature flag ID: ${id}`);
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare('DELETE FROM feature_flags WHERE id = ?');
      
      stmt.run([id], function(err) {
        if (err) {
          console.error('Error deleting feature flag:', err.message);
          reject(err);
        } else {
          console.log(`Feature flag deleted, changes: ${this.changes}`);
          resolve(this.changes > 0);
        }
      });
      
      stmt.finalize();
    });
  }
}

module.exports = FeatureFlag;