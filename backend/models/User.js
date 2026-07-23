const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    level: {
      type: Number,
      default: 1,
    },
    xp: {
      type: Number,
      default: 0,
    },
    coins: {
      type: Number,
      default: 100,
    },
    wins: {
      type: Number,
      default: 0,
    },
    losses: {
      type: Number,
      default: 0,
    },
    matchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Match",
      },
    ],
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isBanned: {
  type: Boolean,
  default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);