const User = require("../models/User");
const Match = require("../models/Match");
const Room = require("../models/Room");


const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMatches = await Match.countDocuments();
    const activeRooms = await Room.countDocuments({
      status: { $in: ["waiting", "in-progress"] },
    });
    const bannedUsers = await User.countDocuments({ isBanned: true });

    res.status(200).json({
      totalUsers,
      totalMatches,
      activeRooms,
      bannedUsers,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


const toggleBanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent an admin from banning themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot ban yourself" });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.status(200).json({
      message: user.isBanned ? "User banned" : "User unbanned",
      isBanned: user.isBanned,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


const getAllMatches = async (req, res) => {
  try {
    const matches = await Match.find({})
      .populate("winner", "username")
      .populate("players.user", "username")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json(matches);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = { getStats, getAllUsers, toggleBanUser, getAllMatches };