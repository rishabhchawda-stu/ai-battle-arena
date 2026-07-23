import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import "./AdminPanel.css";

function AdminPanel() {
  const [activeTab, setActiveTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo) {
      navigate("/login");
      return;
    }

    fetchStats();
    fetchUsers();
    fetchMatches();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await API.get("/admin/stats");
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.message || "Access denied");
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await API.get("/admin/users");
      setUsers(data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchMatches = async () => {
    try {
      const { data } = await API.get("/admin/matches");
      setMatches(data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleToggleBan = async (userId) => {
    try {
      await API.put(`/admin/users/${userId}/ban`);
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  if (error) {
    return (
      <div className="admin-container">
        <div className="admin-error-card">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <nav className="admin-navbar">
        <h3 className="navbar-title">Admin Panel</h3>
        <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </nav>

      <div className="admin-content">
        <div className="admin-tabs">
          <button
            className={`tab-btn ${activeTab === "stats" ? "active" : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            Analytics
          </button>
          <button
            className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
          <button
            className={`tab-btn ${activeTab === "matches" ? "active" : ""}`}
            onClick={() => setActiveTab("matches")}
          >
            Matches
          </button>
        </div>

        {activeTab === "stats" && stats && (
          <div className="stats-cards">
            <div className="admin-stat-card">
              <span className="admin-stat-value">{stats.totalUsers}</span>
              <span className="admin-stat-label">Total Users</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{stats.totalMatches}</span>
              <span className="admin-stat-label">Total Matches</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{stats.activeRooms}</span>
              <span className="admin-stat-label">Active Rooms</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{stats.bannedUsers}</span>
              <span className="admin-stat-label">Banned Users</span>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="admin-table">
            <div className="admin-row header-row">
              <span>Username</span>
              <span>Email</span>
              <span>Level</span>
              <span>Wins</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {users.map((u) => (
              <div className="admin-row" key={u._id}>
                <span>{u.username}</span>
                <span className="email-col">{u.email}</span>
                <span>{u.level}</span>
                <span>{u.wins}</span>
                <span className={u.isBanned ? "status-banned" : "status-active"}>
                  {u.isBanned ? "Banned" : "Active"}
                </span>
                <span>
                  <button
                    className={`btn btn-sm ${u.isBanned ? "btn-success" : "btn-danger"}`}
                    onClick={() => handleToggleBan(u._id)}
                  >
                    {u.isBanned ? "Unban" : "Ban"}
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "matches" && (
          <div className="admin-table">
            <div className="admin-row header-row matches-header">
              <span>Winner</span>
              <span>Players</span>
              <span>Duration</span>
              <span>Date</span>
            </div>
            {matches.map((m) => (
              <div className="admin-row matches-header" key={m._id}>
                <span>{m.winner?.username || "N/A"}</span>
                <span>
                  {m.players.map((p) => p.user?.username).join(", ")}
                </span>
                <span>{m.duration}s</span>
                <span>{new Date(m.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
            {matches.length === 0 && (
              <p className="no-data-text">No matches played yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;