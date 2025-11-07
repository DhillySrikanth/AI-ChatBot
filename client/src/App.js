import React, { useState, useEffect } from "react";
import ChatUI from "./components/ChatUI";
import Login from "./components/Login";
import Register from "./components/Register";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <div>
      {user ? (
        <ChatUI onLogout={handleLogout} />
      ) : isRegistering ? (
        <Register
          onRegisterSuccess={handleLoginSuccess}
          onSwitchToLogin={() => setIsRegistering(false)}
        />
      ) : (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setIsRegistering(true)}
        />
      )}
    </div>
  );
}

export default App;
