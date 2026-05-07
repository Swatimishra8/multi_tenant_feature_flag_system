const db = require('../config/database');

console.log('Loading Organization model...');

class Organization {
  static async create({ name, createdBy }) {
    console.log(`Creating organization: ${name} by ${createdBy}`);
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO organizations (name, created_by)
        VALUES (?, ?)
      `);
      
      stmt.run([name, createdBy], function(err) {
        if (err) {
          console.error('Error creating organization:', err.message);
          reject(err);
        } else {
          console.log(`Organization created with ID: ${this.lastID}`);
          resolve({ id: this.lastID, name, createdBy });
        }
      });
      
      stmt.finalize();
    });
  }

  static async findAll() {
    console.log('Fetching all organizations...');
    
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM organizations ORDER BY created_at DESC',
        [],
        (err, rows) => {
          if (err) {
            console.error('Error fetching organizations:', err.message);
            reject(err);
          } else {
            console.log(`Found ${rows.length} organizations`);
            resolve(rows);
          }
        }
      );
    });
  }

  static async findById(id) {
    console.log(`Finding organization by ID: ${id}`);
    
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM organizations WHERE id = ?',
        [id],
        (err, row) => {
          if (err) {
            console.error('Error finding organization:', err.message);
            reject(err);
          } else {
            if (row) {
              console.log(`Organization found: ${row.name}`);
            } else {
              console.log(`Organization not found with ID: ${id}`);
            }
            resolve(row);
          }
        }
      );
    });
  }

  static async findByName(name) {
    console.log(`Finding organization by name (case-insensitive): ${name}`);
    
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM organizations WHERE LOWER(name) = LOWER(?)',
        [name],
        (err, row) => {
          if (err) {
            console.error('Error finding organization by name:', err.message);
            reject(err);
          } else {
            if (row) {
              console.log(`Organization found by name: ${name} -> ${row.name}`);
            } else {
              console.log(`Organization not found by name: ${name}`);
            }
            resolve(row);
          }
        }
      );
    });
  }

  static async getStats() {
    console.log('Getting organization statistics...');
    
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          COUNT(*) as total_orgs,
          (SELECT COUNT(*) FROM users WHERE role = 'org_admin' AND organization_id IS NOT NULL) as total_admins,
          (SELECT COUNT(*) FROM users WHERE role = 'end_user' AND organization_id IS NOT NULL) as total_users,
          (SELECT COUNT(*) FROM feature_flags) as total_flags
        FROM organizations`,
        [],
        (err, row) => {
          if (err) {
            console.error('Error getting organization stats:', err.message);
            reject(err);
          } else {
            console.log('Organization stats retrieved');
            resolve(row);
          }
        }
      );
    });
  }
}

module.exports = Organization;