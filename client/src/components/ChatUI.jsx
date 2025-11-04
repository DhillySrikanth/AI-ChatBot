import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./ChatUI.css";
// Assuming TextType is a separate component for typing animation
import TextType from "./textstyle"; 
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';

// Component for rendering Bot avatar fallback
const BotAvatar = ({ src, alt }) => (
  <div className="bot-avatar-container">
    <img src={src || "/default-avatar.jpg"} alt={alt} />
    <span className="status-dot"></span>
  </div>
);

// Component for rendering User avatar fallback
const UserAvatar = ({ name }) => (
    <div className="user-avatar-container">
        {name ? name.charAt(0).toUpperCase() : 'U'}
    </div>
);

const ChatUI = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const messagesEndRef = useRef(null);
  const [user, setUser] = useState(null);

  // --- Initial Setup and Theme/User Loading ---
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    const savedTheme = localStorage.getItem('theme');
    // Set theme based on localStorage, default to dark if not found
    const currentTheme = savedTheme ? savedTheme === 'dark' : true;
    setIsDarkTheme(currentTheme);
    // Apply theme class to body for global styling effects
    document.body.className = currentTheme ? 'dark-theme' : 'light-theme';
  }, []);

  // --- Theme Toggling ---
  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    const themeString = newTheme ? 'dark' : 'light';
    localStorage.setItem('theme', themeString);
    document.body.className = themeString === 'dark' ? 'dark-theme' : 'light-theme';
  };

  // --- Logout Handler ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Simple page reload to trigger route protection/login redirect
    window.location.reload(); 
  };

  // --- Scroll to Bottom Effect ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages, isTyping]); // Scroll on new message or typing indicator change

  // --- Message Sending Logic ---
  const handleSend = async () => {
    if (!input.trim()) return;
    
    // 1. Create and display user message
    const userMessage = { sender: "user", text: input, time: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    const prompt = input; // Capture input before clearing
    setInput("");
    setIsTyping(true);

    try {
      // 2. Prepare API call
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: token ? `Bearer ${token}` : "",
        'Content-Type': 'application/json',
      };

      // 3. Call backend API
      const response = await axios.post(
        "http://localhost:5000/api/chat/message",
        { userId: user?.id || "anon_user", prompt: prompt },
        { headers }
      );

      // 4. Display bot reply
      const botReply = {
        sender: "bot",
        text: response.data.reply,
        time: new Date(),
      };
      setMessages((prev) => [...prev, botReply]);

    } catch (error) {
      // 5. Handle API error
      console.error("Chat API Error:", error);
      const errorMsg = {
        sender: "bot",
        text: "⚠️ **Error connecting to Gemini API.** Please check your connection or server status.",
        time: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      // 6. Stop typing indicator
      setIsTyping(false);
    }
  };

  // --- Input Handlers ---
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault(); // Prevent new line in textarea if it were one
        handleSend();
    }
  };

  // --- Custom Markdown Renderer for Bot Messages ---
  const markdownComponents = {
    // Override 'p' tag to prevent unwanted line breaks in the text animation flow
    p: ({ children }) => <span style={{ display: 'inline' }}>{children}</span>, 
    // Add custom class for better bold styling
    strong: ({ children }) => <strong className="bold-text">{children}</strong>,
    // Add support for code blocks (crucial for AI chat)
    code: ({ node, inline, className, children, ...props }) => {
        const match = /language-(\w+)/.exec(className || '');
        return !inline && match ? (
            <pre className="code-block">
                <code className={className} {...props}>
                    {String(children).replace(/\n$/, '')}
                </code>
            </pre>
        ) : (
            <code className="inline-code" {...props}>
                {children}
            </code>
        );
    }
    // You can add more like li, ul, ol, h1-h6, table here
  };


  return (
    <div className={`chat-container ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
      <header className={`chat-header`}>
        <div className="header-content">
          <div className="bot-info">
            <BotAvatar src="/avatar.jpg" alt="Gemini AI" />
            <div className="bot-details">
              <h1>Gemini AI</h1>
              <span className="status">Always Online</span>
            </div>
          </div>
          <div className="header-actions">
            <motion.button
              className="theme-toggle"
              onClick={toggleTheme}
              title={isDarkTheme ? "Switch to Light Mode" : "Switch to Dark Mode"}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isDarkTheme ? '☀️' : '🌙'}
            </motion.button>
            {user && (
              <div className="user-profile">
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  <motion.button 
                    className="logout-button" 
                    onClick={handleLogout}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="logout-icon">⎋</span>
                    <span className="logout-text">Logout</span>
                  </motion.button>
                </div>
                <div className="user-avatar-header">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="chat-body">
        <div className="messages-container">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="welcome-section"
            >
              <motion.h1
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                Welcome, {user?.name || 'Guest'}! 👋
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                I'm Gemini AI, your intelligent assistant. How can I help you today?
              </motion.p>
              <motion.div 
                className="welcome-suggestions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2>Try asking me:</h2>
                <div className="suggestion-chips">
                  <button onClick={() => setInput("Tell me a fun fact")}>Tell me a fun fact</button>
                  <button onClick={() => setInput("What can you do?")}>What can you do?</button>
                  <button onClick={() => setInput("Help me write code")}>Help me write code</button>
                </div>
              </motion.div>
            </motion.div>
          )}
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
            <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`chat-message ${msg.sender}`}
            >
                <div className="message-container">
                    {msg.sender === "bot" ? (
                        <BotAvatar src="/avatar.jpg" alt="Gemini AI" />
                    ) : (
                        <UserAvatar name={user?.name} />
                    )}
                    <div className="message-content">
                        <div className="message-header">
                            <span className="sender-name">
                            {msg.sender === "user" ? (user?.name || "You") : "Gemini AI"}
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
                                <TextType // Assuming TextType handles the typing animation
                                    text={msg.text}
                                    typingSpeed={20} // Slightly faster/smoother
                                    showCursor={false}
                                    loop={false}
                                    renderer={(text) => (
                                        <ReactMarkdown components={markdownComponents}>
                                            {text}
                                        </ReactMarkdown>
                                    )}
                                />
                            ) : (
                                <div className="user-text">
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              key="typing-indicator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="chat-message bot typing-indicator"
            >
              <div className="message-container">
                <BotAvatar src="/avatar.jpg" alt="Gemini AI" />
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

          <div ref={messagesEndRef} /> {/* Scroll target */}
        </div>
      </main>

      <footer className="chat-footer">
        <div className="chat-input-container">
          <div className="input-wrapper">
            <motion.button 
              className="input-action-button"
              title="Coming soon: Add attachment (Image/File)"
              disabled
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="action-icon">➕</span>
            </motion.button>
            <div className="input-field-wrapper">
              <input
                type="text"
                placeholder="Message Gemini AI..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isTyping}
              />
            </div>
            <motion.button 
              className={`send-button ${input.trim() ? 'active' : ''}`}
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isTyping ? (
                <span className="typing-indicator-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              ) : (
                <img src="/send.png" alt="Send" className="send-icon" />
              )}
            </motion.button>
          </div>
          <div className="input-footer">
            <span className="input-tip">Press Enter to send (Tip: Use Shift+Enter for new line)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChatUI;