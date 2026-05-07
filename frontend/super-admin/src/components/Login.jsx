import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

console.log('Loading Super Admin Login component...');

function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({
    username: 'superadmin', // Pre-filled for convenience
    password: 'admin123'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user types
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Attempting super admin login...');
    
    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Sending login request...');
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      
      console.log('Login response received:', response.data);
      
      if (response.data.success) {
        setSuccess('Login successful! Redirecting...');
        console.log('Super admin login successful');
        
        // Call parent callback with user data and token
        setTimeout(() => {
          onLogin(response.data.user, response.data.token);
        }, 500);
      } else {
        setError(response.data.message || 'Login failed');
        console.log('Login failed:', response.data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Please ensure the backend is running on port 3001.');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Super Admin Login</h1>
        
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
            value={credentials.username}
            onChange={handleInputChange}
            placeholder="Enter super admin username"
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
            value={credentials.password}
            onChange={handleInputChange}
            placeholder="Enter super admin password"
            disabled={loading}
            autoComplete="current-password"
          />
        </div>
        
        <button 
          type="submit" 
          className="login-btn"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px', fontSize: '0.85rem', color: '#666' }}>
          <strong>Default Credentials:</strong><br />
          Username: superadmin<br />
          Password: admin123
        </div>
      </form>
    </div>
  );
}

export default Login;