import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import "./Dashboard.css";
import Spinner from "../components/Spinner";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [matchHistory, setMatchHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo) {
      navigate("/login");
      return;
    }

    setUser(userInfo);

    const fetchFreshProfile = async () => {
      try {
        const { data } = await API.get("/auth/profile");
        const updatedUserInfo = { ...userInfo, ...data };
        localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));
        setUser(updatedUserInfo);
      } catch (err) {
        console.log("Failed to fetch fresh profile:", err);
      }
    };

    const fetchMatchHistory = async () => {
      try {
        const { data } = await API.get("/auth/match-history");
        setMatchHistory(data);
      } catch (err) {
        console.log("Failed to fetch match history:", err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchFreshProfile();
    fetchMatchHistory();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  const handleCreateRoom = async () => {
    setError("");
    setLoading(true);
    try {
      const { data } = await API.post("/rooms/create", {
        maxPlayers: 4,
        isPrivate: false,
      });
      navigate(`/room/${data.roomCode}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      setError("Please enter a room code");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await API.post("/rooms/join", { roomCode: joinCode.toUpperCase() });
      navigate(`/room/${joinCode.toUpperCase()}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join room");
    } finally {
      setLoading(false);
    }
  };

  // Helper - find current user's own result within a match's players array
  const getMyResult = (match) => {
    const myEntry = match.players.find(
      (p) => p.user && p.user._id === user._id
    );
    return myEntry || null;
  };

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <nav className="dashboard-navbar">
        <h3 className="navbar-title">AI Battle Arena</h3>
        <div>
          <button
            className="btn btn-outline-light btn-sm me-2"
            onClick={() => navigate("/leaderboard")}
          >
            🏆 Leaderboard
          </button>
          <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="profile-card">
          <h2>Welcome, {user.username}</h2>
          <p className="profile-email">{user.email}</p>

          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-value">{user.level}</span>
              <span className="stat-label">Level</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{user.xp || 0}</span>
              <span className="stat-label">XP</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{user.coins}</span>
              <span className="stat-label">Coins</span>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="action-buttons">
          <button
            className="btn btn-primary action-btn"
            onClick={handleCreateRoom}
            disabled={loading}
          >
            {loading ? "Please wait..." : "Create Room"}
          </button>
          <button
            className="btn btn-secondary action-btn"
            onClick={() => setShowJoinInput(!showJoinInput)}
          >
            Join Room
          </button>
        </div>

        {showJoinInput && (
          <div className="join-room-box">
            <input
              type="text"
              className="form-control"
              placeholder="Enter Room Code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              maxLength={6}
            />
            <button
              className="btn btn-primary"
              onClick={handleJoinRoom}
              disabled={loading}
            >
              {loading ? "Joining..." : "Join"}
            </button>
          </div>
        )}

        {/* ----- Match History Section ----- */}
        <div className="match-history-section">
          <h4 className="section-heading">Recent Matches</h4>

          {historyLoading && <Spinner size="small" text="Loading history..." />}

          {!historyLoading && matchHistory.length === 0 && (
            <p className="no-history-text">
              No matches played yet. Jump into a battle!
            </p>
          )}

          {!historyLoading && matchHistory.length > 0 && (
            <div className="history-list">
              {matchHistory.map((match) => {
                const myResult = getMyResult(match);
                const isWin = myResult?.result === "win";

                return (
                  <div className="history-item" key={match._id}>
                    <div className="history-left">
                      <span
                        className={`result-badge ${isWin ? "win" : "loss"}`}
                      >
                        {isWin ? "WIN" : "LOSS"}
                      </span>
                      <span className="history-winner">
                        Winner: {match.winner?.username || "N/A"}
                      </span>
                    </div>
                    <div className="history-right">
                      <span className="history-kills">
                        Kills: {myResult?.kills ?? 0}
                      </span>
                      <span className="history-date">
                        {new Date(match.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;