const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
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
        kills: {
          type: Number,
          default: 0,
        },
        deaths: {
          type: Number,
          default: 0,
        },
        damageDealt: {
          type: Number,
          default: 0,
        },
        result: {
          type: String,
          enum: ["win", "loss", "draw"],
        },
      },
    ],
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    duration: {
      type: Number, // in seconds
    },
    aiSummary: {
      type: String,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);