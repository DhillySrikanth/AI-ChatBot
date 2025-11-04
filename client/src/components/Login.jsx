import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const Login = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });

      const { token, user } = response.data;
      
      // Store token and user info
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Notify parent component
      onLoginSuccess(user);
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-box">
          <div className="login-header">
            <div className="logo">
              <span className="logo-icon">🤖</span>
              <h1>AI ChatBot</h1>
            </div>
            <p className="subtitle">Welcome back! Please login to your account.</p>
          </div>

          {error && (
            <div className="error-message">
              <i className="error-icon">⚠️</i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-group">
                <span className="input-icon">📧</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-group">
                <span className="input-icon">🔒</span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading-text">
                  <span className="loading-dots">.</span>
                  <span className="loading-dots">.</span>
                  <span className="loading-dots">.</span>
                </span>
              ) : (
                'Login to Chat'
              )}
            </button>
          </form>

          <div className="register-link">
            Don't have an account?{' '}
            <button 
              onClick={onSwitchToRegister}
              className="switch-button"
            >
              Create one here
            </button>
          </div>

          <div className="demo-credentials">
            <h3>Demo Access</h3>
            <div className="demo-info">
              <div className="demo-field">
                <span className="field-label">Email:</span>
                <span className="field-value">demo@example.com</span>
              </div>
              <div className="demo-field">
                <span className="field-label">Password:</span>
                <span className="field-value">demo123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;