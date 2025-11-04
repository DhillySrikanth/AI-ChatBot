import React, { useState, useEffect } from "react";
import ChatUI from "./components/ChatUI";
import Login from "./components/Login";
import Register from "./components/Register";

function App() {
  const [user, setUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <div>
      {user ? (
        <div>
          <div style={{ 
            padding: '10px', 
            background: '#f8f9fa', 
            textAlign: 'right' 
          }}>
            <span style={{ marginRight: '10px' }}>
              Welcome, {user.name}!
            </span>
            <button 
              onClick={handleLogout}
              style={{
                padding: '5px 10px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
          <ChatUI />
        </div>
      ) : (
        isRegistering ? (
          <Register 
            onRegisterSuccess={handleLoginSuccess}
            onSwitchToLogin={() => setIsRegistering(false)}
          />
        ) : (
          <Login 
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={() => setIsRegistering(true)}
          />
        )
      )}
    </div>
  );
}

export default App;
