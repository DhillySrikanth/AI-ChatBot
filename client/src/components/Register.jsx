import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./Register.css";

const Register = ({ onRegister }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      // Register user
      const response = await axios.post("http://localhost:5000/api/auth/signup", {
        name,
        email,
        password,
      });

      if (response.data.message === "User registered successfully") {
        // Auto login after successful registration
        const loginResponse = await axios.post("http://localhost:5000/api/auth/login", {
          email,
          password,
        });

        const { token, user } = loginResponse.data;

        // Save token and user to localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        // Notify parent (App.js)
        if (onRegister) onRegister(user);

        // Redirect to chat
        navigate("/chat");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-content">
        <motion.div
          className="register-box"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="register-header">
            <div className="logo">
              <motion.span
                className="logo-icon"
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                🤖
              </motion.span>
              <h1>Create Account</h1>
            </div>
            <p className="subtitle">Join our AI chatbot community today!</p>
          </div>

          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <i className="error-icon">⚠️</i>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-group">
                <span className="input-icon">👤</span>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Enter your full name"
                />
              </div>
            </div>

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
                  placeholder="Create a password"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-group">
                <span className="input-icon">🔒</span>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              className={`register-button ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <span className="loading-text">
                  <span className="loading-dots">.</span>
                  <span className="loading-dots">.</span>
                  <span className="loading-dots">.</span>
                </span>
              ) : (
                "Create Account"
              )}
            </motion.button>
          </form>

          <div className="login-link">
            Already have an account?{" "}
            <motion.button
              onClick={() => navigate("/login")}
              className="switch-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Login here
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
