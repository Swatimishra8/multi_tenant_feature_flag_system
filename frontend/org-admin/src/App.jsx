import React, { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm.jsx';
import Dashboard from './components/Dashboard.jsx';
import './App.css';

console.log('Loading Organization Admin App...');

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'

  useEffect(() => {
    console.log('Checking organization admin authentication status...');
    // Check if user is already logged in
    const token = localStorage.getItem('orgAdminToken');
    const userData = localStorage.getItem('orgAdminUser');
    
    if (token && userData) {
      console.log('Found existing authentication');
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear corrupted data
        localStorage.removeItem('orgAdminToken');
        localStorage.removeItem('orgAdminUser');
      }
    } else {
      console.log('No existing authentication found');
    }
    
    setLoading(false);
  }, []);

  const handleAuth = (userData, token) => {
    console.log('Authentication successful, setting user data');
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('orgAdminToken', token);
    localStorage.setItem('orgAdminUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    console.log('Logging out organization admin...');
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('orgAdminToken');
    localStorage.removeItem('orgAdminUser');
    console.log('Logout complete');
  };

  const toggleAuthMode = () => {
    setAuthMode(prev => prev === 'login' ? 'signup' : 'login');
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="App">
      {!isAuthenticated ? (
        <AuthForm 
          mode={authMode}
          onAuth={handleAuth} 
          onToggleMode={toggleAuthMode}
        />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;