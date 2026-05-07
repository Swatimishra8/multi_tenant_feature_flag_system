import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EditFlagModal from './EditFlagModal.jsx';

const API_URL = 'http://localhost:3001/api';

console.log('Loading Organization Admin Dashboard component...');

function Dashboard({ user, onLogout }) {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newFlag, setNewFlag] = useState({
    key: '',
    enabled: false
  });
  const [creatingFlag, setCreatingFlag] = useState(false);
  const [editingFlag, setEditingFlag] = useState(null);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('orgAdminToken');
  };

  // Configure axios defaults
  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  };

  useEffect(() => {
    console.log('Organization admin dashboard mounted, loading flags...');
    loadFlags();
  }, []);

  const loadFlags = async () => {
    console.log('Loading feature flags...');
    setLoading(true);
    setError('');

    try {
      console.log('Fetching flags from API...');
      const response = await axios.get(`${API_URL}/flags`, axiosConfig);
      
      console.log('Flags data received:', response.data);
      
      if (response.data.success) {
        setFlags(response.data.flags || []);
        console.log(`Loaded ${response.data.flags?.length || 0} feature flags`);
      } else {
        setError('Failed to load feature flags');
        console.log('Failed to load feature flags');
      }
    } catch (error) {
      console.error('Error loading flags:', error);
      
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
        setError('Failed to load feature flags. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const createFlag = async (e) => {
    e.preventDefault();
    console.log('Creating new feature flag...');
    
    if (!newFlag.key.trim()) {
      setError('Feature flag key is required');
      return;
    }

    setCreatingFlag(true);
    setError('');
    setSuccess('');

    try {
      console.log(`Creating flag: ${newFlag.key}`);
      const response = await axios.post(
        `${API_URL}/flags`, 
        newFlag, 
        axiosConfig
      );
      
      console.log('Flag creation response:', response.data);
      
      if (response.data.success) {
        setSuccess(`Feature flag "${newFlag.key}" created successfully!`);
        setNewFlag({ key: '', enabled: false });
        console.log('Flag created, reloading list...');
        
        // Reload flags to get updated list
        await loadFlags();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message || 'Failed to create feature flag');
      }
    } catch (error) {
      console.error('Error creating flag:', error);
      
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.status === 400) {
        setError('Feature flag key already exists or is invalid');
      } else {
        setError('Failed to create feature flag. Please try again.');
      }
    } finally {
      setCreatingFlag(false);
    }
  };

  const toggleFlag = async (flagId, currentEnabled) => {
    console.log(`Toggling flag ${flagId} from ${currentEnabled} to ${!currentEnabled}`);
    
    try {
      const flag = flags.find(f => f.id === flagId);
      if (!flag) return;

      const response = await axios.put(
        `${API_URL}/flags/${flagId}`, 
        { key: flag.key, enabled: !currentEnabled }, 
        axiosConfig
      );
      
      if (response.data.success) {
        console.log('Flag toggled successfully');
        await loadFlags(); // Reload to get updated data
        setSuccess(`Feature flag "${flag.key}" ${!currentEnabled ? 'enabled' : 'disabled'}`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error toggling flag:', error);
      setError('Failed to toggle feature flag. Please try again.');
    }
  };

  const deleteFlag = async (flagId) => {
    if (!confirm('Are you sure you want to delete this feature flag?')) {
      return;
    }

    console.log(`Deleting flag ${flagId}`);
    
    try {
      const response = await axios.delete(`${API_URL}/flags/${flagId}`, axiosConfig);
      
      if (response.data.success) {
        console.log('Flag deleted successfully');
        await loadFlags(); // Reload to get updated data
        setSuccess('Feature flag deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting flag:', error);
      setError('Failed to delete feature flag. Please try again.');
    }
  };

  const handleEditFlag = (flag) => {
    setEditingFlag(flag);
  };

  const handleSaveEdit = async (flagId, updatedData) => {
    console.log(`Updating flag ${flagId}:`, updatedData);
    
    try {
      const response = await axios.put(
        `${API_URL}/flags/${flagId}`, 
        updatedData, 
        axiosConfig
      );
      
      if (response.data.success) {
        console.log('Flag updated successfully');
        await loadFlags(); // Reload to get updated data
        setSuccess('Feature flag updated successfully');
        setTimeout(() => setSuccess(''), 3000);
        setEditingFlag(null);
      }
    } catch (error) {
      console.error('Error updating flag:', error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Failed to update feature flag. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    console.log('Organization admin logout initiated...');
    onLogout();
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Organization Admin Dashboard</h1>
        <div className="user-info">
          <div className="user-details">
            <div>Welcome, {user?.username}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
              Organization: {user?.organizationName || `Org ID: ${user?.organizationId}`}
            </div>
          </div>
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

        <div className="flags-section">
          <h2>
            Feature Flag Management ({flags.length} flags)
          </h2>
          
          {/* Create New Flag */}
          <div className="create-flag-form">
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Create New Feature Flag</h3>
            <form onSubmit={createFlag}>
              <div className="form-row">
                <input
                  type="text"
                  value={newFlag.key}
                  onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })}
                  placeholder="Enter feature flag key (e.g., NEW_DASHBOARD)"
                  disabled={creatingFlag}
                />
                <button 
                  type="submit" 
                  className="create-flag-btn"
                  disabled={creatingFlag || !newFlag.key.trim()}
                >
                  {creatingFlag ? 'Creating...' : 'Create Flag'}
                </button>
              </div>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={newFlag.enabled}
                  onChange={(e) => setNewFlag({ ...newFlag, enabled: e.target.checked })}
                />
                <label htmlFor="enabled">Start enabled</label>
              </div>
            </form>
          </div>

          {/* Feature Flags List */}
          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Loading feature flags...</p>
            </div>
          ) : flags.length > 0 ? (
            <div className="flags-list">
              {flags.map((flag) => (
                <div key={flag.id} className="flag-card">
                  <div className="flag-header">
                    <h3 className="flag-key">{flag.key}</h3>
                    <div className="flag-status">
                      <span className={`status-badge ${flag.enabled ? 'enabled' : 'disabled'}`}>
                        {flag.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flag-meta">
                    <div>Created: {new Date(flag.created_at).toLocaleDateString()}</div>
                    <div>Updated: {new Date(flag.updated_at).toLocaleDateString()}</div>
                  </div>
                  
                  <div className="flag-actions">
                    <button 
                      className="action-btn toggle"
                      onClick={() => toggleFlag(flag.id, flag.enabled)}
                    >
                      {flag.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button 
                      className="action-btn edit"
                      onClick={() => handleEditFlag(flag)}
                    >
                      Edit
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => deleteFlag(flag.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No Feature Flags Yet</h3>
              <p>Create your first feature flag to start managing features for your organization.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Flag Modal */}
      {editingFlag && (
        <EditFlagModal
          flag={editingFlag}
          onSave={handleSaveEdit}
          onClose={() => setEditingFlag(null)}
        />
      )}
    </div>
  );
}

export default Dashboard;