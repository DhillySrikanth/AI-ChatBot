import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./ChatUI.css";
import TextType from "./textstyle";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';

const ChatUI = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const messagesEndRef = useRef(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkTheme(savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    localStorage.setItem('theme', !isDarkTheme ? 'dark' : 'light');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: "user", text: input, time: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // Call backend API
      // const response = await axios.post("http://localhost:5000/api/chat/message", {
      //   userId: "user123",
      //   prompt: input,
      // });

      // optional: get token if using auth
      const token = localStorage.getItem("token");

     // Call backend API
    const response = await axios.post(
      "http://localhost:5000/api/chat/message",
        {
          userId: "user123",
          prompt: input,
        },
        {
          headers: {
          Authorization: token ? `Bearer ${token}` : "", // only if token exists
        },
    }
  );

      const botReply = {
        sender: "bot",
        text: response.data.reply,
        time: new Date(),
      };
      setMessages((prev) => [...prev, botReply]);
    } catch (error) {
      const errorMsg = {
        sender: "bot",
        text: "⚠️ Error connecting to Gemini API.",
        time: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className={`chat-container ${!isDarkTheme ? 'light-theme' : ''}`}>
      <div className={`chat-header ${!isDarkTheme ? 'light-theme' : ''}`}>
        <div className="header-content">
          <div className="bot-info">
            <div className="bot-avatar">
              <img src="/avatar.jpg" alt="Gemini AI" />
              <span className="status-dot"></span>
            </div>
            <div className="bot-details">
              <h2>Gemini AI</h2>
              <span className="status">Always Online</span>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="theme-toggle"
              onClick={toggleTheme}
              title={isDarkTheme ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkTheme ? '☀️' : '🌙'}
            </button>
            {user && (
              <div className="user-profile">
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  <button className="logout-button" onClick={handleLogout}>
                    <span className="logout-icon">⎋</span>
                    <span className="logout-text">Logout</span>
                  </button>
                </div>
                <div className="user-avatar-header">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="chat-body">
        <div className="messages-container" ref={messagesEndRef}>
          <AnimatePresence>
            {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`chat-message ${msg.sender === "user" ? "user" : "bot"}`}
            >
              <div className="message-container">
                <div className="avatar">
                  {msg.sender === "user" ? (
                    <div className="user-avatar">👤</div>
                  ) : (
                    <div className="bot-avatar">
                      <img src="/avatar.jpg" alt="Gemini AI" />
                    </div>
                  )}
                </div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="sender-name">
                      {msg.sender === "user" ? "You" : "Gemini AI"}
                    </span>
                    <span className="timestamp">
                      {msg.time.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <motion.div 
                    className="message-bubble"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {msg.sender === 'bot' ? (
                      <TextType
                        text={msg.text}
                        typingSpeed={30}
                        showCursor={false}
                        loop={false}
                        className="bot-text-animation"
                        renderer={(text) => (
                          <div className="markdown-content">
                            <ReactMarkdown 
                              components={{
                                p: ({node, children}) => <span>{children}</span>,
                                strong: ({node, children}) => <strong className="bold-text">{children}</strong>
                              }}
                            >
                              {text}
                            </ReactMarkdown>
                          </div>
                        )}
                      />
                    ) : (
                      <div className="user-text">{msg.text}</div>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="chat-message bot typing-indicator"
            >
              <div className="message-container">
                <div className="avatar">
                  <div className="bot-avatar">
                    <img src="https://i.imgur.com/YDtC7rB.png" alt="Gemini AI" />
                  </div>
                </div>
                <div className="message-content">
                  <div className="message-bubble typing">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="chat-footer">
        <div className="chat-input-container">
          <div className="input-wrapper">
            <button 
              className="input-action-button"
              title="Coming soon: Add attachment"
              disabled
            >
              <span>+</span>
            </button>
            <div className="input-field-wrapper">
              <input
                type="text"
                placeholder="Message Gemini AI..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
              />
              <div className="input-footer">
                <span className="input-tip">Press Enter to send</span>
              </div>
            </div>
            <button 
              className={`send-button ${input.trim() ? 'active' : ''}`}
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
            >
              <span className="send-icon">
                {isTyping ? '...' : '⟶'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;
