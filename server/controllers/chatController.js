// This file contains chat message handling logic

import { getProvider } from "../providers/providerFactory.js";

// POST /api/chat/message
export const sendMessage = async (req, res) => {
  try {
    const { prompt, provider, context } = req.body;

    if (!prompt) return res.status(400).json({ message: "Prompt is required" });

    const aiFunction = getProvider(provider || "gemini");

    const aiResponse = await aiFunction(prompt, context || []);

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