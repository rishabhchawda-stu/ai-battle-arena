const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const Match = require("./models/Match");
const User = require("./models/User");
const Room = require("./models/Room");

dotenv.config();
connectDB();

const app = express();

const FRONTEND_URL = "https://ai-battle-arena-smoky.vercel.app";

app.use(cors({
  origin: FRONTEND_URL,
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("AI Battle Arena API is running...");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
  },
});

app.set("io", io);

// { roomCode: { playerId: { username, userId, x, y, health, kills, isBot } } }
const battleRooms = {};
const matchStartTimes = {};
const aiIntervals = {};

const ARENA_BOUNDS = { minX: 40, maxX: 760, minY: 40, maxY: 580 };

// ----- AI Bot Logic -----
const runBotAI = (roomCode) => {
  const room = battleRooms[roomCode];
  if (!room) return;

  Object.entries(room).forEach(([botId, botData]) => {
    if (!botData.isBot || botData.health <= 0) return;

    let nearestId = null;
    let nearestDist = Infinity;

    Object.entries(room).forEach(([otherId, otherData]) => {
      if (otherId === botId || otherData.health <= 0) return;
      const dist = Math.hypot(otherData.x - botData.x, otherData.y - botData.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestId = otherId;
      }
    });

    if (!nearestId) return;

    const target = room[nearestId];
    const dx = target.x - botData.x;
    const dy = target.y - botData.y;
    const angle = Math.atan2(dy, dx);

    const moveSpeed = 3;
    if (nearestDist > 150) {
      botData.x += Math.cos(angle) * moveSpeed;
      botData.y += Math.sin(angle) * moveSpeed;

      botData.x = Math.max(ARENA_BOUNDS.minX, Math.min(ARENA_BOUNDS.maxX, botData.x));
      botData.y = Math.max(ARENA_BOUNDS.minY, Math.min(ARENA_BOUNDS.maxY, botData.y));

      io.to(`battle-${roomCode}`).emit("playerMoved", {
        socketId: botId,
        x: botData.x,
        y: botData.y,
      });
    }

    if (nearestDist < 300 && Math.random() < 0.3) {
      io.to(`battle-${roomCode}`).emit("bulletFired", {
        socketId: botId,
        x: botData.x,
        y: botData.y,
        angle,
      });

      const hitChance = nearestDist < 100 ? 0.5 : 0.2;
      if (Math.random() < hitChance) {
        target.health = Math.max(0, target.health - 10);

        io.to(`battle-${roomCode}`).emit("healthUpdate", {
          socketId: nearestId,
          health: target.health,
        });

        if (target.health === 0) {
          botData.kills = (botData.kills || 0) + 1;

          io.to(`battle-${roomCode}`).emit("playerEliminated", {
            socketId: nearestId,
            username: target.username,
            eliminatedBy: botData.username,
          });

          checkForWinner(roomCode);
        }
      }
    }
  });
};

// Helper: check how many players are still alive, end match if only 1 left
const checkForWinner = async (roomCode) => {
  const room = battleRooms[roomCode];
  if (!room) return;

  const allPlayers = Object.entries(room);
  const alivePlayers = allPlayers.filter(([, data]) => data.health > 0);

  if (allPlayers.length < 2 || alivePlayers.length > 1) return;

  if (aiIntervals[roomCode]) {
    clearInterval(aiIntervals[roomCode]);
    delete aiIntervals[roomCode];
  }

  const winnerEntry = alivePlayers[0];
  const winnerSocketId = winnerEntry ? winnerEntry[0] : null;
  const winnerData = winnerEntry ? winnerEntry[1] : null;

  const humanPlayersResult = allPlayers
    .filter(([, data]) => !data.isBot)
    .map(([socketId, data]) => ({
      userId: data.userId,
      username: data.username,
      kills: data.kills || 0,
      result: socketId === winnerSocketId ? "win" : "loss",
    }));

  const allPlayersResult = allPlayers.map(([socketId, data]) => ({
    username: data.username,
    kills: data.kills || 0,
    result: socketId === winnerSocketId ? "win" : "loss",
    isBot: data.isBot || false,
  }));

  try {
    const duration = matchStartTimes[roomCode]
      ? Math.round((Date.now() - matchStartTimes[roomCode]) / 1000)
      : 0;

    const roomDoc = await Room.findOne({ roomCode });

    if (roomDoc && humanPlayersResult.length > 0) {
      const matchDoc = await Match.create({
        room: roomDoc._id,
        players: humanPlayersResult.map((p) => ({
          user: p.userId,
          kills: p.kills,
          result: p.result,
        })),
        winner: winnerData && !winnerData.isBot ? winnerData.userId : null,
        duration,
        startedAt: matchStartTimes[roomCode]
          ? new Date(matchStartTimes[roomCode])
          : new Date(),
        endedAt: new Date(),
      });

      for (const p of humanPlayersResult) {
        const xpGain = p.result === "win" ? 100 : 25;
        const coinGain = p.result === "win" ? 50 : 10;

        await User.findByIdAndUpdate(p.userId, {
          $inc: {
            xp: xpGain,
            coins: coinGain,
            wins: p.result === "win" ? 1 : 0,
            losses: p.result === "loss" ? 1 : 0,
          },
          $push: { matchHistory: matchDoc._id },
        });
      }

      await Room.findOneAndUpdate({ roomCode }, { status: "completed" });
    }

    io.to(`battle-${roomCode}`).emit("matchEnded", {
      winnerUsername: winnerData ? winnerData.username : "No one",
      players: allPlayersResult,
    });

    delete battleRooms[roomCode];
    delete matchStartTimes[roomCode];
  } catch (error) {
    console.error("Error saving match:", error.message);
  }
};

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("joinRoomChannel", (roomCode) => {
    socket.join(roomCode);
  });

  socket.on("startMatch", async (roomCode) => {
    await Room.findOneAndUpdate({ roomCode }, { status: "in-progress" });
    io.to(roomCode).emit("matchStarting", roomCode);
  });

  socket.on("leaveRoomChannel", (roomCode) => {
    socket.leave(roomCode);
  });

  // ----- Battle Arena Events -----

  socket.on("joinBattle", async ({ roomCode, username, userId }) => {
    console.log(`${username} joined battle room: ${roomCode}`);

    socket.join(`battle-${roomCode}`);
    socket.battleData = { roomCode, username, userId };

    if (!battleRooms[roomCode]) {
      battleRooms[roomCode] = {};
      matchStartTimes[roomCode] = Date.now();

      const roomDoc = await Room.findOne({ roomCode });
      if (roomDoc) {
        roomDoc.players.forEach((p, index) => {
          if (p.isBot) {
            const botId = `bot-${roomCode}-${index}`;
            battleRooms[roomCode][botId] = {
              username: p.character || "AI Bot",
              userId: null,
              x: 200 + index * 100,
              y: 200 + index * 50,
              health: 100,
              kills: 0,
              isBot: true,
            };
          }
        });
      }

      aiIntervals[roomCode] = setInterval(() => runBotAI(roomCode), 100);
    }

    const existingPlayers = Object.entries(battleRooms[roomCode]).map(
      ([id, data]) => ({
        socketId: id,
        username: data.username,
        userId: data.userId,
        x: data.x,
        y: data.y,
        health: data.health,
      })
    );
    socket.emit("existingPlayers", existingPlayers);

    battleRooms[roomCode][socket.id] = {
      username,
      userId,
      x: 400,
      y: 300,
      health: 100,
      kills: 0,
      isBot: false,
    };

    socket.to(`battle-${roomCode}`).emit("playerJoinedBattle", {
      socketId: socket.id,
      username,
      userId,
    });
  });

  socket.on("playerMove", ({ roomCode, x, y }) => {
    if (battleRooms[roomCode] && battleRooms[roomCode][socket.id]) {
      battleRooms[roomCode][socket.id].x = x;
      battleRooms[roomCode][socket.id].y = y;
    }

    socket.to(`battle-${roomCode}`).emit("playerMoved", {
      socketId: socket.id,
      x,
      y,
    });
  });

  socket.on("playerShoot", ({ roomCode, x, y, angle }) => {
    socket.to(`battle-${roomCode}`).emit("bulletFired", {
      socketId: socket.id,
      x,
      y,
      angle,
    });
  });

  socket.on("playerHit", ({ roomCode, targetSocketId, damage }) => {
    const room = battleRooms[roomCode];
    if (!room || !room[targetSocketId]) return;

    if (room[targetSocketId].health <= 0) return;

    room[targetSocketId].health = Math.max(
      0,
      room[targetSocketId].health - damage
    );

    io.to(`battle-${roomCode}`).emit("healthUpdate", {
      socketId: targetSocketId,
      health: room[targetSocketId].health,
    });

    if (room[targetSocketId].health === 0) {
      if (room[socket.id]) {
        room[socket.id].kills = (room[socket.id].kills || 0) + 1;
      }

      io.to(`battle-${roomCode}`).emit("playerEliminated", {
        socketId: targetSocketId,
        username: room[targetSocketId].username,
        eliminatedBy: socket.battleData?.username || "Unknown",
      });

      checkForWinner(roomCode);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    if (socket.battleData) {
      const { roomCode } = socket.battleData;

      if (battleRooms[roomCode]) {
        delete battleRooms[roomCode][socket.id];

        const remainingHumans = Object.values(battleRooms[roomCode]).filter(
          (p) => !p.isBot
        );

        if (remainingHumans.length === 0) {
          if (aiIntervals[roomCode]) {
            clearInterval(aiIntervals[roomCode]);
            delete aiIntervals[roomCode];
          }
          delete battleRooms[roomCode];
          delete matchStartTimes[roomCode];
        }
      }

      socket.to(`battle-${roomCode}`).emit("playerLeftBattle", {
        socketId: socket.id,
      });
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});