import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import "./Leaderboard.css";
import Spinner from "../components/Spinner";

function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await API.get("/leaderboard");
        setPlayers(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getMedal = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  return (
    <div className="leaderboard-container">
      <nav className="leaderboard-navbar">
        <h3 className="navbar-title">AI Battle Arena</h3>
        <button
          className="btn btn-outline-light btn-sm"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </nav>

      <div className="leaderboard-content">
        <h2 className="leaderboard-heading">🏆 Global Leaderboard</h2>

        {loading && <Spinner size="medium" text="Loading rankings..." />}
        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && (
          <div className="leaderboard-table">
            <div className="leaderboard-row header-row">
              <span className="col-rank">Rank</span>
              <span className="col-name">Player</span>
              <span className="col-stat">Level</span>
              <span className="col-stat">XP</span>
              <span className="col-stat">Wins</span>
              <span className="col-stat">Losses</span>
            </div>

            {players.map((player, index) => (
              <div className="leaderboard-row" key={player._id}>
                <span className="col-rank">{getMedal(index)}</span>
                <span className="col-name">{player.username}</span>
                <span className="col-stat">{player.level}</span>
                <span className="col-stat">{player.xp}</span>
                <span className="col-stat wins">{player.wins}</span>
                <span className="col-stat losses">{player.losses}</span>
              </div>
            ))}

            {players.length === 0 && (
              <p className="no-players-text">No players yet. Be the first!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;