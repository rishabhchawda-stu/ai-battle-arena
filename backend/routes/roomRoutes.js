const express = require("express");
const router = express.Router();
const {
  createRoom,
  joinRoom,
  leaveRoom,
  addBot,
  getAllRooms,
  getRoomByCode,
} = require("../controllers/roomController");
const { protect } = require("../middleware/authMiddleware");

router.post("/create", protect, createRoom);
router.post("/join", protect, joinRoom);
router.post("/leave", protect, leaveRoom);
router.post("/add-bot", protect, addBot);
router.get("/", protect, getAllRooms);
router.get("/:roomCode", protect, getRoomByCode);

module.exports = router;