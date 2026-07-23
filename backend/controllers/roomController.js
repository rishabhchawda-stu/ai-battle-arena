const Room = require("../models/Room");

// Helper function - Random Room Code Generate karo
const generateRoomCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

//   Create New Room
//   POST /api/rooms/create
const createRoom = async (req, res) => {
  try {
    const { maxPlayers, isPrivate } = req.body;
    const userId = req.user._id;

    const roomCode = generateRoomCode();

    const newRoom = await Room.create({
      roomCode,
      hostUser: userId,
      players: [
        {
          user: userId,
          isBot: false,
          character: "default",
        },
      ],
      maxPlayers: maxPlayers || 4,
      isPrivate: isPrivate || false,
      status: "waiting",
    });

    res.status(201).json(newRoom);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

//   Join Existing Room using Room Code
//   POST /api/rooms/join
const joinRoom = async (req, res) => {
  try {
    const { roomCode } = req.body;
    const userId = req.user._id;

    const room = await Room.findOne({ roomCode });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.status !== "waiting") {
      return res.status(400).json({ message: "Match already started" });
    }

    if (room.players.length >= room.maxPlayers) {
      return res.status(400).json({ message: "Room is full" });
    }

    const alreadyJoined = room.players.some(
      (p) => p.user && p.user.toString() === userId.toString()
    );

    if (alreadyJoined) {
      return res.status(400).json({ message: "Already joined this room" });
    }

    room.players.push({
      user: userId,
      isBot: false,
      character: "default",
    });

    await room.save();

    const updatedRoom = await Room.findOne({ roomCode })
      .populate("hostUser", "username level")
      .populate("players.user", "username level");

    const io = req.app.get("io");
    io.to(roomCode).emit("roomUpdated", updatedRoom);

    res.status(200).json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

//   Leave Room
//   POST /api/rooms/leave
const leaveRoom = async (req, res) => {
  try {
    const { roomCode } = req.body;
    const userId = req.user._id;

    const room = await Room.findOne({ roomCode });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    room.players = room.players.filter(
      (p) => p.user && p.user.toString() !== userId.toString()
    );

    if (room.hostUser.toString() === userId.toString() && room.players.length > 0) {
      // Find first non-bot player to become new host
      const newHostPlayer = room.players.find((p) => !p.isBot);
      if (newHostPlayer) {
        room.hostUser = newHostPlayer.user;
      }
    }

    const io = req.app.get("io");

    // Count only real players (not bots) to decide if room should close
    const realPlayersLeft = room.players.filter((p) => !p.isBot);

    if (realPlayersLeft.length === 0) {
      await Room.deleteOne({ _id: room._id });
      io.to(roomCode).emit("roomClosed");
      return res.status(200).json({ message: "Room closed" });
    }

    await room.save();

    const updatedRoom = await Room.findOne({ roomCode })
      .populate("hostUser", "username level")
      .populate("players.user", "username level");

    io.to(roomCode).emit("roomUpdated", updatedRoom);

    res.status(200).json({ message: "Left room successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

//   Add AI Bot to Room
//   POST /api/rooms/add-bot
const addBot = async (req, res) => {
  try {
    const { roomCode } = req.body;
    const userId = req.user._id;

    const room = await Room.findOne({ roomCode });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.hostUser.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the host can add bots" });
    }

    if (room.players.length >= room.maxPlayers) {
      return res.status(400).json({ message: "Room is full" });
    }

    const botNames = ["ShadowBot", "RexAI", "ViperBot", "NovaAI", "BlazeBot"];
    const randomName = botNames[Math.floor(Math.random() * botNames.length)];

    room.players.push({
      user: null,
      isBot: true,
      character: randomName,
    });

    await room.save();

    const updatedRoom = await Room.findOne({ roomCode })
      .populate("hostUser", "username level")
      .populate("players.user", "username level");

    const io = req.app.get("io");
    io.to(roomCode).emit("roomUpdated", updatedRoom);

    res.status(200).json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

//   Get All Open Rooms (Public Rooms List)
//   GET /api/rooms
const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isPrivate: false, status: "waiting" })
      .populate("hostUser", "username level")
      .select("-players");

    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

//  Get Single Room Details
//  GET /api/rooms/:roomCode
const getRoomByCode = async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode })
      .populate("hostUser", "username level")
      .populate("players.user", "username level");

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  addBot,
  getAllRooms,
  getRoomByCode,
};