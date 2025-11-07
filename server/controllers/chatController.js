// This file contains chat message handling logic

import { getProvider } from "../providers/providerFactory.js";
import Message from "../models/Message.js"; // ensure your Message model exists and is correct

// 🧠 POST /api/chat/message → Send message to provider (Gemini)
export const sendMessage = async (req, res) => {
  try {
    const { prompt, provider, context } = req.body;

    if (!prompt) return res.status(400).json({ message: "Prompt is required" });

    const aiFunction = getProvider(provider || "gemini");
    const aiResponse = await aiFunction(prompt, context || []);

    // Save messages to MongoDB (requires authenticated user)
    if (req.user && req.user.id) {
      await Message.create({ userId: req.user.id, role: "user", content: prompt });
      await Message.create({
        userId: req.user.id,
        role: "assistant",
        content: aiResponse.text,
      });
    }

    res.status(200).json({
      success: true,
      provider: aiResponse.provider,
      tokens: aiResponse.tokens,
      reply: aiResponse.text,
    });
  } catch (error) {
    console.error("Chat Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// 📜 GET /api/chat/history → Fetch message history for logged-in user
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const messages = await Message.find({ userId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error("Error fetching history:", err.message);
    res.status(500).json({ message: "Error fetching chat history" });
  }
};

// 🧹 DELETE /api/chat/clear → Delete all messages for logged-in user
export const clearChat = async (req, res) => {
  try {
    const userId = req.user.id;
    await Message.deleteMany({ userId });
    res.json({ message: "Chat cleared successfully" });
  } catch (err) {
    console.error("Error clearing chat:", err.message);
    res.status(500).json({ message: "Error clearing chat" });
  }
};

// 💾 GET /api/chat/export → Export messages as JSON file
export const exportChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const messages = await Message.find({ userId }).sort({ timestamp: 1 });

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=chat_export.json");
    res.send(JSON.stringify(messages, null, 2));
  } catch (err) {
    console.error("Error exporting chat:", err.message);
    res.status(500).json({ message: "Error exporting chat" });
  }
};
