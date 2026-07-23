const User = require("../models/User");

//  Get Global Leaderboard (Top players by XP)
//  GET /api/leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const players = await User.find({})
      .select("username level xp coins wins losses")
      .sort({ xp: -1 }) // Highest XP first
      .limit(50);

    res.status(200).json(players);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = { getLeaderboard };