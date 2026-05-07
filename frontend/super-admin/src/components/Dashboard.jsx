import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

console.log('Loading Super Admin Dashboard component...');

function Dashboard({ user, onLogout }) {
  const [organizations, setOrganizations] = useState([]);
  const [stats, setStats] = useState({
    total_orgs: 0,
    total_admins: 0,
    total_users: 0,
    total_flags: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('superAdminToken');
  };

  // Configure axios defaults
  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  };

  useEffect(() => {
    console.log('Dashboard mounted, loading data...');
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    console.log('Loading organizations...');
    setLoading(true);
    setError('');

    try {
      console.log('Fetching organizations from API...');
      const response = await axios.get(`${API_URL}/organizations`, axiosConfig);
      
      console.log('Organizations data received:', response.data);
      
      if (response.data.success) {
        setOrganizations(response.data.organizations || []);
        setStats(response.data.stats || stats);
        console.log(`Loaded ${response.data.organizations?.length || 0} organizations`);
      } else {
        setError('Failed to load organizations');
        console.log('Failed to load organizations');
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError('Authentication failed. Please login again.');
        // Auto logout on auth failure
        setTimeout(() => {
          onLogout();
        }, 2000);
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        setError('Failed to load organizations. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const createOrganization = async (e) => {
    e.preventDefault();
    console.log('Creating new organization...');
    
    if (!newOrgName.trim()) {
      setError('Organization name is required');
      return;
    }

    setCreatingOrg(true);
    setError('');
    setSuccess('');

    try {
      console.log(`Creating organization: ${newOrgName}`);
      const response = await axios.post(
        `${API_URL}/organizations`, 
        { name: newOrgName.trim() }, 
        axiosConfig
      );
      
      console.log('Organization creation response:', response.data);
      
      if (response.data.success) {
        setSuccess(`Organization "${newOrgName}" created successfully!`);
        setNewOrgName('');
        console.log('Organization created, reloading list...');
        
        // Reload organizations to get updated list
        await loadOrganizations();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message || 'Failed to create organization');
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.status === 400) {
        setError('Organization name already exists or is invalid');
      } else {
        setError('Failed to create organization. Please try again.');
      }
    } finally {
      setCreatingOrg(false);
    }
  };

  const handleLogout = () => {
    console.log('Super admin logout initiated...');
    onLogout();
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Super Admin Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.username}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        {/* Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.total_orgs}</div>
            <div className="stat-label">Organizations</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.total_admins}</div>
            <div className="stat-label">Org Admins</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.total_users}</div>
            <div className="stat-label">End Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.total_flags}</div>
            <div className="stat-label">Feature Flags</div>
          </div>
        </div>

        {/* Organization Management */}
        <div className="org-section">
          <h2>Organization Management</h2>
          
          <form onSubmit={createOrganization} className="create-org-form">
            <input
              type="text"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="Enter organization name"
              disabled={creatingOrg}
            />
            <button 
              type="submit" 
              className="create-org-btn"
              disabled={creatingOrg || !newOrgName.trim()}
            >
              {creatingOrg ? 'Creating...' : 'Create Organization'}
            </button>
          </form>

          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Loading organizations...</p>
            </div>
          ) : organizations.length > 0 ? (
            <div className="org-list">
              {organizations.map((org) => (
                <div key={org.id} className="org-card">
                  <h3>{org.name}</h3>
                  <div className="org-meta">
                    <p>Created: {new Date(org.created_at).toLocaleDateString()}</p>
                    <p>Created by: {org.created_by}</p>
                    <p>ID: {org.id}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No Organizations Yet</h3>
              <p>Create the first organization to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;