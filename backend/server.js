const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import database to initialize tables
require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const organizationRoutes = require('./routes/organizations');
const flagRoutes = require('./routes/flags');
const checkRoutes = require('./routes/check');

console.log('Starting Feature Flag Management System...');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
console.log('Setting up middleware...');
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'OK', 
    message: 'Feature Flag Management System is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
console.log('Setting up API routes...');
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/flags', flagRoutes);
app.use('/api', checkRoutes);

// Welcome endpoint
app.get('/', (req, res) => {
  console.log('Welcome page accessed');
  res.json({
    message: 'Welcome to Multi-Tenant Feature Flag Management System',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      organizations: '/api/organizations/*',
      flags: '/api/flags/*',
      check: '/api/check-feature'
    },
    documentation: {
      superAdmin: 'Use static credentials from .env file to login as super admin',
      orgAdmin: 'Signup with organization name, then login to manage feature flags',
      endUser: 'Use check-feature endpoint to verify feature status'
    }
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    path: req.path,
    message: 'The requested endpoint does not exist'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('=====================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at: http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('=====================================');
  console.log('Available endpoints:');
  console.log('   GET  /              - Welcome & API info');
  console.log('   GET  /health        - Health check');
  console.log('   POST /api/auth/login           - Login (all roles)');
  console.log('   POST /api/auth/signup          - Signup (org admin)');
  console.log('   GET  /api/organizations        - List orgs (super admin)');
  console.log('   POST /api/organizations        - Create org (super admin)');
  console.log('   GET  /api/flags                - List flags (org admin)');
  console.log('   POST /api/flags                - Create flag (org admin)');
  console.log('   PUT  /api/flags/:id            - Update flag (org admin)');
  console.log('   DELETE /api/flags/:id          - Delete flag (org admin)');
  console.log('   POST /api/check-feature        - Check feature (public)');
  console.log('=====================================');
  
  // Print super admin credentials
  console.log('Super Admin Credentials:');
  console.log(`   Username: ${process.env.SUPER_ADMIN_USERNAME || 'superadmin'}`);
  console.log(`   Password: ${process.env.SUPER_ADMIN_PASSWORD || 'admin123'}`);
  console.log('=====================================');
});

module.exports = app;