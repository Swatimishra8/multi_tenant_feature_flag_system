import React, { useState, useEffect } from 'react';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import './App.css';

console.log('Loading Super Admin App...');

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Checking authentication status...');
    // Check if user is already logged in
    const token = localStorage.getItem('superAdminToken');
    const userData = localStorage.getItem('superAdminUser');
    
    if (token && userData) {
      console.log('Found existing authentication');
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear corrupted data
        localStorage.removeItem('superAdminToken');
        localStorage.removeItem('superAdminUser');
      }
    } else {
      console.log('No existing authentication found');
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    console.log('Login successful, setting authentication');
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('superAdminToken', token);
    localStorage.setItem('superAdminUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    console.log('Logging out...');
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('superAdminUser');
    console.log('Logout complete');
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
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;