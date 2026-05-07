import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

console.log('Loading Organization Admin Auth component...');

function AuthForm({ mode, onAuth, onToggleMode }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    organizationName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user types
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(`Attempting ${mode}...`);
    
    if (!formData.username || !formData.password) {
      setError('Please enter both username and password');
      return;
    }

    if (mode === 'signup' && !formData.organizationName) {
      setError('Please enter your organization name');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log(`Sending ${mode} request...`);
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
      const response = await axios.post(`${API_URL}${endpoint}`, formData);
      
      console.log(`${mode} response received:`, response.data);
      
      if (response.data.success) {
        setSuccess(`${mode === 'login' ? 'Login' : 'Registration'} successful! Redirecting...`);
        console.log(`Organization admin ${mode} successful`);
        
        // Call parent callback with user data and token
        setTimeout(() => {
          onAuth(response.data.user, response.data.token);
        }, 500);
      } else {
        setError(response.data.message || `${mode} failed`);
        console.log(`${mode} failed:`, response.data.message);
      }
    } catch (error) {
      console.error(`${mode} error:`, error);
      
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Please ensure the backend is running on port 3001.');
      } else {
        setError(`Network error during ${mode}. Please check your connection and try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>{mode === 'login' ? 'Organization Admin Login' : 'Organization Admin Signup'}</h1>
        
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
        
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="Enter your username"
            disabled={loading}
            autoComplete="username"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter your password"
            disabled={loading}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
        </div>
        
        {mode === 'signup' && (
          <div className="form-group">
            <label htmlFor="organizationName">Organization Name</label>
            <input
              type="text"
              id="organizationName"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleInputChange}
              placeholder="Enter your organization name (must exist)"
              disabled={loading}
            />
            <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              The organization must be created by a Super Admin first. Name matching is case-insensitive.
            </small>
          </div>
        )}
        
        <button 
          type="submit" 
          className="auth-btn"
          disabled={loading}
        >
          {loading ? (mode === 'login' ? 'Logging in...' : 'Signing up...') : (mode === 'login' ? 'Login' : 'Sign Up')}
        </button>
        
        <div className="auth-toggle">
          {mode === 'login' ? (
            <>
              Don't have an account? {' '}
              <button type="button" onClick={onToggleMode}>
                Sign up here
              </button>
            </>
          ) : (
            <>
              Already have an account? {' '}
              <button type="button" onClick={onToggleMode}>
                Login here
              </button>
            </>
          )}
        </div>

        {mode === 'signup' && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px', fontSize: '0.85rem', color: '#666' }}>
            <strong>Note:</strong> To sign up, the organization must already exist. 
            Contact your Super Admin to create the organization first.
          </div>
        )}
      </form>
    </div>
  );
}

export default AuthForm;