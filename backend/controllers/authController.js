const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

//   Register New User
//   POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const token = generateToken(newUser._id);

    res.status(201).json({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      level: newUser.level,
      coins: newUser.coins,
      isAdmin: newUser.isAdmin,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

//   Login User
//   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      level: user.level,
      xp: user.xp,
      coins: user.coins,
      isAdmin: user.isAdmin,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

//   Get Logged-in User's Fresh Profile
//   GET /api/auth/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

//   Get Logged-in User's Match History
//   GET /api/auth/match-history
const getMatchHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "matchHistory",
      options: { sort: { createdAt: -1 }, limit: 20 },
      populate: [
        { path: "winner", select: "username" },
        { path: "players.user", select: "username" },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.matchHistory);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  getMatchHistory,
};