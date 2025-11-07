import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./ChatUI.css";
// Assuming TextType is a separate component for typing animation
import TextType from "./textstyle";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

// Component for rendering Bot avatar fallback
const BotAvatar = ({ src, alt }) => (
  <div className="bot-avatar-container">
    <img src={src || "/default-avatar.jpg"} alt={alt} />
    <span className="status-dot"></span>
  </div>
);

// Component for rendering User avatar fallback
const UserAvatar = ({ name }) => (
  <div className="user-avatar-container">{name ? name.charAt(0).toUpperCase() : "U"}</div>
);

const ChatUI = () => {
  // -------------------------
  // State
  // -------------------------
  const [messages, setMessages] = useState([]); // { sender: "user"|"bot", text, time: Date }
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const messagesEndRef = useRef(null);
  const [user, setUser] = useState(null);

  // -------------------------
  // Helper: get token
  // -------------------------
  const getAuthToken = () => localStorage.getItem("token");

  // -------------------------
  // Initial Setup and Theme/User Loading
  // -------------------------
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.warn("Failed to parse stored user", e);
      }
    }

    const savedTheme = localStorage.getItem("theme");
    const currentTheme = savedTheme ? savedTheme === "dark" : true;
    setIsDarkTheme(currentTheme);
    document.body.className = currentTheme ? "dark-theme" : "light-theme";

    // Load chat history after initial setup
    loadChatHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------
  // Load Chat History from Backend
  // -------------------------
  const loadChatHistory = async () => {
    const token = getAuthToken();
    if (!token) {
      // no token - nothing to load
      return;
    }
    try {
      const res = await axios.get("http://localhost:5000/api/chat/history", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // map server message shape -> client message shape
      const loaded = res.data.map((m) => ({
        sender: m.role === "user" ? "user" : "bot",
        text: m.content,
        time: m.timestamp ? new Date(m.timestamp) : new Date(m.createdAt || Date.now()),
      }));
      setMessages(loaded);
    } catch (err) {
      console.error("Error loading chat history:", err);
    }
  };

  // -------------------------
  // Theme Toggling
  // -------------------------
  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    const themeString = newTheme ? "dark" : "light";
    localStorage.setItem("theme", themeString);
    document.body.className = themeString === "dark" ? "dark-theme" : "light-theme";
  };

  // -------------------------
  // Logout Handler
  // -------------------------
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  // -------------------------
  // Scroll to Bottom Effect
  // -------------------------
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages, isTyping]);

  // -------------------------
  // Send Message (calls protected backend)
  // -------------------------
  const handleSend = async () => {
    if (!input.trim()) return;

    // Show user message immediately
    const userMessage = { sender: "user", text: input, time: new Date() };
    setMessages((prev) => [...prev, userMessage]);

    const prompt = input;
    setInput("");
    setIsTyping(true);

    try {
      const token = getAuthToken();
      const headers = {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      };

      // POST to protected endpoint: /api/chat/message
      const response = await axios.post(
        "http://localhost:5000/api/chat/message",
        { prompt: prompt }, // server expects prompt (and checks req.user from JWT)
        { headers }
      );

      // server returns response.reply
      const assistantText = response?.data?.reply || "⚠️ No response from Gemini.";
      const botReply = { sender: "bot", text: assistantText, time: new Date() };

      setMessages((prev) => [...prev, botReply]);
    } catch (error) {
      console.error("Chat API Error:", error);

      const errorMsg = {
        sender: "bot",
        text: "⚠️ Error connecting to Gemini API. Please check your connection or server status.",
        time: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // -------------------------
  // Clear Chat (DELETE /api/chat/clear)
  // -------------------------
  const clearChat = async () => {
    const token = getAuthToken();
    if (!token) {
      setMessages([]);
      return;
    }
    try {
      await axios.delete("http://localhost:5000/api/chat/clear", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages([]);
    } catch (err) {
      console.error("Error clearing chat:", err);
    }
  };

  // -------------------------
  // Export Chat (GET /api/chat/export) -> download JSON
  // -------------------------
  const exportChat = async () => {
    const token = getAuthToken();
    if (!token) {
      // If not logged in, allow exporting local messages only
      const blob = new Blob([JSON.stringify(messages, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "chat_export.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }
    try {
      const res = await axios.get("http://localhost:5000/api/chat/export", {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "chat_export.json");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error exporting chat:", err);
    }
  };

  // -------------------------
  // Input Handlers
  // -------------------------
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // -------------------------
  // Custom Markdown Renderer for Bot Messages
  // -------------------------
  const markdownComponents = {
    p: ({ children }) => <span style={{ display: "inline" }}>{children}</span>,
    strong: ({ children }) => <strong className="bold-text">{children}</strong>,
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <pre className="code-block">
          <code className={className} {...props}>
            {String(children).replace(/\n$/, "")}
          </code>
        </pre>
      ) : (
        <code className="inline-code" {...props}>
          {children}
        </code>
      );
    },
  };

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className={`chat-container ${isDarkTheme ? "dark-theme" : "light-theme"}`}>
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
              {isDarkTheme ? "☀️" : "🌙"}
            </motion.button>

            {/* NEW: Clear & Export buttons */}
            <div className="chat-control-buttons">
              <motion.button
                className="control-button"
                onClick={clearChat}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                title="Clear chat history"
              >
                🧹 Clear Chat
              </motion.button>

              <motion.button
                className="control-button"
                onClick={exportChat}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                title="Export chat as JSON"
              >
                📤 Export Chat
              </motion.button>
            </div>

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
                    <span className="logout-icon">⏻️</span>
                    <span className="logout-text">Logout</span>
                  </motion.button>
                </div>
                <div className="user-avatar-header">{user.name.charAt(0).toUpperCase()}</div>
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
              <motion.h1 initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.5, type: "spring" }}>
                Welcome, {user?.name || "Guest"}! 👋
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                I'm Gemini AI, your intelligent assistant. How can I help you today?
              </motion.p>
              <motion.div className="welcome-suggestions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
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
                  {msg.sender === "bot" ? <BotAvatar src="/avatar.jpg" alt="Gemini AI" /> : <UserAvatar name={user?.name} />}
                  <div className="message-content">
                    <div className="message-header">
                      <span className="sender-name">{msg.sender === "user" ? (user?.name || "You") : "Gemini AI"}</span>
                      <span className="timestamp">
                        {msg.time instanceof Date ? msg.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <motion.div className="message-bubble" initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
                      {msg.sender === "bot" ? (
                        <TextType
                          text={msg.text}
                          typingSpeed={20}
                          showCursor={false}
                          loop={false}
                          renderer={(text) => <ReactMarkdown components={markdownComponents}>{text}</ReactMarkdown>}
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
            <motion.div key="typing-indicator" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="chat-message bot typing-indicator">
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
            <motion.button className="input-action-button" title="Coming soon: Add attachment (Image/File)" disabled whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <span className="action-icon">➕</span>
            </motion.button>
            <div className="input-field-wrapper">
              <input type="text" placeholder="Message Gemini AI..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyPress} disabled={isTyping} />
            </div>
            <motion.button className={`send-button ${input.trim() ? "active" : ""}`} onClick={handleSend} disabled={!input.trim() || isTyping} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
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
            <span className="input-tip">Press Enter to send </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChatUI;
