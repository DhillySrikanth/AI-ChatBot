// This file defines chat-related routes

import express from "express";
import { sendMessage } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/chat/message  (protected route)
router.post("/message", protect, sendMessage);

export default router;