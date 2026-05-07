# Multi-Tenant Feature Flag Management System

A SaaS-like feature flag management system with role-based access control.

## Architecture Overview

### System Roles
1. **Super Admin** - Creates and manages organizations
2. **Organization Admin** - Manages feature flags within their organization
3. **End User** - Checks feature flag status for their organization

### Applications
1. **Backend** (`/backend`) - Node.js/Express API server
2. **Super Admin Frontend** (`/frontend/super-admin`) - React app for super admins
3. **Organization Admin Frontend** (`/frontend/org-admin`) - React app for org admins
4. **User Frontend** (`/frontend/user`) - Simple React app for end users

## Quick Start

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Applications
Each frontend app can be started independently:
```bash
cd frontend/super-admin  # or org-admin, or user
npm install
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (all roles)
- `POST /api/auth/signup` - Signup (org admin only)
- `POST /api/auth/logout` - Logout

### Organizations (Super Admin only)
- `GET /api/organizations` - List all organizations
- `POST /api/organizations` - Create organization

### Feature Flags (Organization Admin)
- `GET /api/flags` - Get organization's feature flags
- `POST /api/flags` - Create feature flag
- `PUT /api/flags/:id` - Update feature flag
- `DELETE /api/flags/:id` - Delete feature flag

### Feature Check (End User)
- `POST /api/check-feature` - Check if feature is enabled

## Database Schema

### Users
- id, username, password_hash, role, organization_id, created_at

### Organizations
- id, name, created_at, created_by

### Feature Flags
- id, key, enabled, organization_id, created_at, updated_at

## Tech Stack
- **Backend**: Node.js, Express, SQLite/PostgreSQL
- **Frontend**: React, Axios
- **Authentication**: Custom JWT implementation
- **Database**: SQLite for development, PostgreSQL for production