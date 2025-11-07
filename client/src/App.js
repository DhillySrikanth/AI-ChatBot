import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import ChatUI from "./components/ChatUI";
import Login from "./components/Login";
import Register from "./components/Register";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);

  // Load user from localStorage if already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <Router>
      <div className="app-container">
        {/* ---------------- HEADER ---------------- */}
        <header className="main-header">
          <div className="header-left">
            <h1 className="app-title">💬 Gemini AI Chat</h1>
          </div>

          <div className="header-right">
            {user ? (
              <>
                <span className="welcome-text">Welcome, {user.name}!</span>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-btn">Login</Link>
                <Link to="/register" className="nav-btn">Register</Link>
              </>
            )}
          </div>
        </header>

        {/* ---------------- ROUTES ---------------- */}
        <main className="main-content">
          <Routes>
            {/* Default homepage */}
            <Route
              path="/"
              element={
                user ? (
                  <Navigate to="/chat" />
                ) : (
                  <div className="home-page">
                    <h2>Welcome to Gemini AI Chatbot 🤖</h2>
                    <p>Chat with an intelligent assistant powered by Google Gemini.</p>
                    <p>Please <Link to="/login">login</Link> or <Link to="/register">register</Link> to continue.</p>
                  </div>
                )
              }
            />

            {/* Login */}
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to="/chat" />
                ) : (
                  <Login onLogin={(usr) => setUser(usr)} />
                )
              }
            />

            {/* Register */}
            <Route
              path="/register"
              element={
                user ? (
                  <Navigate to="/chat" />
                ) : (
                  <Register onRegister={(usr) => setUser(usr)} />
                )
              }
            />

            {/* Chat page (protected) */}
            <Route
              path="/chat"
              element={
                user ? <ChatUI /> : <Navigate to="/login" />
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
