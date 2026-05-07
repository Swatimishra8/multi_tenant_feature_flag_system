import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:3001/api';

console.log('Loading End User App...');

function App() {
  const [formData, setFormData] = useState({
    featureKey: '',
    organizationName: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear previous results when user types
    if (result || error) {
      setResult(null);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Checking feature flag...');
    
    if (!formData.featureKey.trim()) {
      setError('Please enter a feature key');
      return;
    }
    
    if (!formData.organizationName.trim()) {
      setError('Please enter your organization name');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log(`Checking feature: ${formData.featureKey} for org: ${formData.organizationName}`);
      
      const response = await axios.post(`${API_URL}/check-feature`, {
        featureKey: formData.featureKey.trim(),
        organizationName: formData.organizationName.trim()
      });
      
      console.log('Feature check response received:', response.data);
      
      if (response.data.success) {
        const checkResult = {
          ...response.data,
          timestamp: new Date().toISOString(),
          id: Date.now()
        };
        
        setResult(checkResult);
        
        // Add to history (keep last 10 checks)
        setHistory(prev => [checkResult, ...prev.slice(0, 9)]);
        
        console.log(`Feature "${formData.featureKey}" is ${checkResult.enabled ? 'ENABLED' : 'DISABLED'}`);
      } else {
        setError(response.data.message || 'Failed to check feature flag');
        console.log('Feature check failed:', response.data.message);
      }
    } catch (error) {
      console.error('Feature check error:', error);
      
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.status === 404) {
        setError('Organization not found. Please check the organization name.');
      } else if (error.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Please ensure the backend is running on port 3001.');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    console.log('Check history cleared');
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>Feature Flag Checker</h1>
          <p>Check if a feature is enabled for your organization</p>
        </header>

        <div className="main-content">
          <div className="check-section">
            <form className="check-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="organizationName">Organization Name</label>
                <input
                  type="text"
                  id="organizationName"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  placeholder="Enter your organization name (case-insensitive)"
                  disabled={loading}
                  autoComplete="organization"
                />
              </div>

              <div className="form-group">
                <label htmlFor="featureKey">Feature Key</label>
                <input
                  type="text"
                  id="featureKey"
                  name="featureKey"
                  value={formData.featureKey}
                  onChange={handleInputChange}
                  placeholder="Enter feature key (e.g., NEW_DASHBOARD)"
                  disabled={loading}
                />
              </div>

              <button 
                type="submit" 
                className="check-btn"
                disabled={loading || !formData.featureKey.trim() || !formData.organizationName.trim()}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Checking...
                  </>
                ) : (
                  'Check Feature'
                )}
              </button>
            </form>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Result Display */}
            {result && (
              <div className={`result-card ${result.enabled ? 'enabled' : 'disabled'}`}>
                <div className="result-header">
                  <h2>
                    {result.enabled ? '✓' : '✗'} 
                    Feature "{result.featureKey}"
                  </h2>
                  <div className={`status-badge ${result.enabled ? 'enabled' : 'disabled'}`}>
                    {result.enabled ? 'ENABLED' : 'DISABLED'}
                  </div>
                </div>
                
                <div className="result-details">
                  <div className="detail-item">
                    <strong>Organization:</strong> {result.organizationName}
                  </div>
                  <div className="detail-item">
                    <strong>Feature Key:</strong> {result.featureKey}
                  </div>
                  <div className="detail-item">
                    <strong>Status:</strong> {result.message}
                  </div>
                  <div className="detail-item">
                    <strong>Checked at:</strong> {new Date(result.timestamp).toLocaleString()}
                  </div>
                  {!result.exists && (
                    <div className="detail-item warning">
                      <strong>Note:</strong> This feature flag does not exist for your organization.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* History Section */}
          {history.length > 0 && (
            <div className="history-section">
              <div className="history-header">
                <h3>Recent Checks ({history.length})</h3>
                <button onClick={clearHistory} className="clear-btn">
                  Clear History
                </button>
              </div>
              
              <div className="history-list">
                {history.map((check) => (
                  <div key={check.id} className={`history-item ${check.enabled ? 'enabled' : 'disabled'}`}>
                    <div className="history-main">
                      <span className="feature-key">{check.featureKey}</span>
                      <span className={`status ${check.enabled ? 'enabled' : 'disabled'}`}>
                        {check.enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <div className="history-meta">
                      <span>{check.organizationName}</span>
                      <span>{new Date(check.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="footer">
          <p>Feature Flag Management System - End User Interface</p>
          <p>Need help? Contact your organization administrator.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;