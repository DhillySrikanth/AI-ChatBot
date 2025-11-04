import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./ChatUI.css";
import TextType from "./textstyle";

const ChatUI = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

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
    <div className="chat-container">
      <div className="chat-header">
        🤖 AI Chatbot <span className="provider">(Gemini)</span>
      </div>

      <div className="chat-body">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${msg.sender === "user" ? "user" : "bot"}`}
          >
            <div className="avatar">
              {msg.sender === "user" ? "🧑" : "🤖"}
            </div>
            <div className="message-content">
              <div className="text">
                {msg.sender === 'bot' ? (
                  <TextType
                    text={msg.text}
                    typingSpeed={30}
                    showCursor={false}
                    loop={false}
                    className="bot-text-animation"
                  />
                ) : (
                  msg.text
                )}
              </div>
              <div className="timestamp">
                {msg.time.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="chat-message bot">
            <div className="avatar">🤖</div>
            <div className="message-content typing">
              <div className="text">
                <TextType
                  text={["Typing", "Typing.", "Typing..", "Typing..."]}
                  typingSpeed={200}
                  deletingSpeed={1}
                  pauseDuration={0}
                  showCursor={false}
                  loop={true}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default ChatUI;
