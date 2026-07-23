const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
    },
    hostUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    players: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        isBot: {
          type: Boolean,
          default: false,
        },
        character: {
          type: String,
          default: "default",
        },
      },
    ],
    maxPlayers: {
      type: Number,
      default: 4,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["waiting", "in-progress", "completed"],
      default: "waiting",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);