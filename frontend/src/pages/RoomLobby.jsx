import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import socket from "../socket";
import "./RoomLobby.css";

function RoomLobby() {
  const { roomCode } = useParams();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    setCurrentUserId(userInfo?._id);

    const fetchRoom = async () => {
      try {
        const { data } = await API.get(`/rooms/${roomCode}`);
        setRoom(data);
      } catch (err) {
        setError(err.response?.data?.message || "Room not found");
      }
    };
    fetchRoom();

    socket.emit("joinRoomChannel", roomCode);

    socket.on("roomUpdated", (updatedRoom) => {
      setRoom(updatedRoom);
    });

    socket.on("roomClosed", () => {
      alert("Room has been closed");
      navigate("/dashboard");
    });

    socket.on("matchStarting", () => {
      navigate(`/battle/${roomCode}`);
    });

    return () => {
      socket.emit("leaveRoomChannel", roomCode);
      socket.off("roomUpdated");
      socket.off("roomClosed");
      socket.off("matchStarting");
    };
  }, [roomCode, navigate]);

  const handleLeaveRoom = async () => {
    try {
      await API.post("/rooms/leave", { roomCode });
    } catch (err) {
      console.log("Error leaving room:", err);
    } finally {
      navigate("/dashboard");
    }
  };

  const handleStartMatch = () => {
    socket.emit("startMatch", roomCode);
  };

  const handleAddBot = async () => {
    try {
      await API.post("/rooms/add-bot", { roomCode });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add bot");
    }
  };

  if (error) {
    return (
      <div className="lobby-container">
        <div className="lobby-card">
          <p className="alert alert-danger">{error}</p>
          <button className="btn btn-primary" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!room) return null;

  const isHost = room.hostUser?._id === currentUserId;

  return (
    <div className="lobby-container">
      <div className="lobby-card">
        <h2>Room Lobby</h2>
        <p className="room-code-display">
          Room Code: <span>{room.roomCode}</span>
        </p>

        <div className="players-list">
          <h4>
            Players ({room.players.length}/{room.maxPlayers})
          </h4>
          {room.players.map((p, index) => (
            <div key={index} className="player-item">
              {p.isBot ? p.character : p.user?.username || "Unknown"}
              {p.isBot && " 🤖"}
              {room.hostUser?._id === p.user?._id && " 👑"}
            </div>
          ))}
        </div>

        {isHost && (
          <button
            className="btn btn-outline-light w-100 mb-2"
            onClick={handleAddBot}
            disabled={room.players.length >= room.maxPlayers}
          >
            + Add AI Bot
          </button>
        )}

        {isHost ? (
          <button
            className="btn btn-primary w-100 mb-2"
            onClick={handleStartMatch}
            disabled={room.players.length < 2}
          >
            {room.players.length < 2
              ? "Need at least 2 players"
              : "Start Match"}
          </button>
        ) : (
          <p className="waiting-text">Waiting for host to start the match...</p>
        )}

        <button className="btn btn-outline-light" onClick={handleLeaveRoom}>
          Leave Room
        </button>
      </div>
    </div>
  );
}

export default RoomLobby;