import express from "express";
import { sendMessage, getChatHistory, clearChat, exportChat } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/message", protect, sendMessage);
router.get("/history", protect, getChatHistory);
router.delete("/clear", protect, clearChat);
router.get("/export", protect, exportChat);

export default router;