const express = require("express");
const router = express.Router();
const {
  getStats,
  getAllUsers,
  toggleBanUser,
  getAllMatches,
} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/stats", protect, adminOnly, getStats);
router.get("/users", protect, adminOnly, getAllUsers);
router.put("/users/:id/ban", protect, adminOnly, toggleBanUser);
router.get("/matches", protect, adminOnly, getAllMatches);

module.exports = router;