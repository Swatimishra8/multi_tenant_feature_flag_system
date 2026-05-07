# Testing Guide - Multi-Tenant Feature Flag Management System

## Quick Start

### 1. Start the Backend Server
```bash
cd backend
npm run dev
# Server will start on http://localhost:3001
```

### 2. Start the Frontend Applications

**Super Admin Frontend:**
```bash
cd frontend/super-admin
npm run dev
# Starts on http://localhost:3000
```

**Organization Admin Frontend:**
```bash
cd frontend/org-admin
npm run dev  
# Starts on http://localhost:3002
```

**End User Frontend:**
```bash
cd frontend/user
npm run dev
# Starts on http://localhost:3003
```

## Complete Workflow Testing

### Step 1: Super Admin Flow
1. Open http://localhost:3000
2. Login with credentials:
   - Username: `superadmin`
   - Password: `admin123`
3. Create an organization (e.g., "Acme Corp")
4. Note the organization name for later steps

### Step 2: Organization Admin Flow  
1. Open http://localhost:3002
2. Click "Sign up here"
3. Fill in signup form:
   - Username: `admin1`
   - Password: `password123`
   - Organization Name: `Acme Corp` (case-insensitive - you can use `acme corp`, `ACME CORP`, etc.)
4. After successful signup, you'll be logged in automatically
5. Create feature flags:
   - Create flag: `NEW_DASHBOARD` (enabled)
   - Create flag: `BETA_FEATURES` (disabled)
   - Create flag: `DARK_MODE` (enabled)
6. Test toggle functionality by enabling/disabling flags
7. Test edit functionality by changing flag keys or status
8. Test delete functionality

### Step 3: End User Flow
1. Open http://localhost:3003
2. Test feature flag checking (case-insensitive organization names):
   - Organization Name: `Acme Corp` (or `acme corp`, `ACME CORP`, etc.)
   - Feature Key: `NEW_DASHBOARD` → Should show ENABLED
   - Feature Key: `BETA_FEATURES` → Should show DISABLED  
   - Feature Key: `NONEXISTENT_FLAG` → Should show "does not exist"
3. Check that history is maintained
4. Try different organization names to test isolation

## API Testing (Manual)

### Authentication Tests
```bash
# Super Admin Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "superadmin", "password": "admin123"}'

# Organization Admin Signup (requires existing org)
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username": "admin1", "password": "password123", "organizationName": "Acme Corp"}'
```

### Super Admin Operations
```bash
# Get organizations (requires super admin token)
curl -X GET http://localhost:3001/api/organizations \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN"

# Create organization  
curl -X POST http://localhost:3001/api/organizations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -d '{"name": "Tech Startup Inc"}'
```

### Organization Admin Operations
```bash
# Get feature flags (requires org admin token)
curl -X GET http://localhost:3001/api/flags \
  -H "Authorization: Bearer YOUR_ORG_ADMIN_TOKEN"

# Create feature flag
curl -X POST http://localhost:3001/api/flags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ORG_ADMIN_TOKEN" \
  -d '{"key": "NEW_FEATURE", "enabled": true}'

# Update feature flag
curl -X PUT http://localhost:3001/api/flags/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ORG_ADMIN_TOKEN" \
  -d '{"key": "NEW_FEATURE", "enabled": false}'
```

### Feature Flag Checking (No Auth Required)
```bash
# Check feature flag status
curl -X POST http://localhost:3001/api/check-feature \
  -H "Content-Type: application/json" \
  -d '{"featureKey": "NEW_DASHBOARD", "organizationName": "Acme Corp"}'

# Alternative GET endpoint
curl -X GET "http://localhost:3001/api/check-feature/Acme%20Corp/NEW_DASHBOARD"
```

## Security Testing

### Authentication Tests
1. Try accessing protected endpoints without tokens → Should get 401
2. Try using expired/invalid tokens → Should get 403  
3. Try org admin accessing super admin endpoints → Should get 403
4. Try accessing flags from different organization → Should get 403

### Data Isolation Tests
1. Create flags in one organization
2. Create admin account for different organization  
3. Verify admin can't see flags from other organization
4. Verify feature checking only works for correct organization

## Database Verification

The SQLite database file is located at `backend/database.sqlite`. You can inspect it using:

```bash
cd backend
sqlite3 database.sqlite

# View tables
.tables

# View organizations
SELECT * FROM organizations;

# View users  
SELECT * FROM users;

# View feature flags
SELECT * FROM feature_flags;

# Check multi-tenancy isolation
SELECT ff.key, ff.enabled, o.name as org_name 
FROM feature_flags ff 
JOIN organizations o ON ff.organization_id = o.id;
```

## Common Issues & Solutions

### Backend Issues
- **"Empty reply from server"**: Backend may have crashed, check terminal output
- **CORS errors**: Ensure backend is running on port 3001
- **Database errors**: Delete `database.sqlite` and restart to reset

### Frontend Issues  
- **Can't connect to backend**: Ensure backend is running first
- **Login fails**: Check super admin credentials in backend/.env
- **Signup fails**: Ensure organization was created by super admin first

### Multi-tenancy Issues
- **Can't see feature flags**: Ensure you're logged in to correct organization
- **Feature check fails**: Verify organization name matches exactly (case-sensitive)

## Expected Behavior

### Data Isolation
- Each organization only sees their own feature flags
- Users can only belong to one organization
- Feature flag keys can be duplicated across organizations

### Role Permissions
- Super Admin: Can create organizations, view all organizations
- Org Admin: Can manage feature flags for their organization only  
- End User: Can check feature flag status (no authentication required)

### Feature Flag Lifecycle
1. Super Admin creates organization
2. Org Admin signs up for organization
3. Org Admin creates/manages feature flags
4. End Users check feature flag status
5. Organization is isolated from others

## Performance Notes

This is a development/demo system with:
- SQLite database (not production-ready for scale)
- No caching layer
- Basic error handling
- Minimal input validation

For production use, consider:
- PostgreSQL/MySQL database  
- Redis caching for feature flag checks
- Rate limiting
- Enhanced security measures
- Comprehensive input validation
- Monitoring and logging