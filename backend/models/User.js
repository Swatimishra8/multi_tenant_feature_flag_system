const db = require('../config/database');
const bcrypt = require('bcryptjs');

console.log('Loading User model...');

class User {
  static async create({ username, password, role, organizationId = null }) {
    console.log(`Creating user: ${username} with role: ${role}`);
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO users (username, password_hash, role, organization_id)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run([username, passwordHash, role, organizationId], function(err) {
        if (err) {
          console.error('Error creating user:', err.message);
          reject(err);
        } else {
          console.log(`User created with ID: ${this.lastID}`);
          resolve({ id: this.lastID, username, role, organizationId });
        }
      });
      
      stmt.finalize();
    });
  }

  static async findByUsername(username) {
    console.log(`Finding user by username: ${username}`);
    
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err, row) => {
          if (err) {
            console.error('Error finding user:', err.message);
            reject(err);
          } else {
            if (row) {
              console.log(`User found: ${username}`);
            } else {
              console.log(`User not found: ${username}`);
            }
            resolve(row);
          }
        }
      );
    });
  }

  static async findById(id) {
    console.log(`Finding user by ID: ${id}`);
    
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE id = ?',
        [id],
        (err, row) => {
          if (err) {
            console.error('Error finding user by ID:', err.message);
            reject(err);
          } else {
            if (row) {
              console.log(`User found by ID: ${id}`);
            } else {
              console.log(`User not found by ID: ${id}`);
            }
            resolve(row);
          }
        }
      );
    });
  }

  static async validatePassword(plainPassword, hashedPassword) {
    console.log('Validating password...');
    const isValid = await bcrypt.compare(plainPassword, hashedPassword);
    console.log(`Password validation result: ${isValid}`);
    return isValid;
  }

  static async getAllByOrganization(organizationId) {
    console.log(`Getting all users for organization: ${organizationId}`);
    
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT id, username, role, organization_id, created_at FROM users WHERE organization_id = ?',
        [organizationId],
        (err, rows) => {
          if (err) {
            console.error('Error getting users by organization:', err.message);
            reject(err);
          } else {
            console.log(`Found ${rows.length} users for organization ${organizationId}`);
            resolve(rows);
          }
        }
      );
    });
  }
}

module.exports = User;