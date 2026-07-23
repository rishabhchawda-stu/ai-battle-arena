import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import RoomLobby from "./pages/RoomLobby";
import BattleArena from "./pages/BattleArena";
import Leaderboard from "./pages/Leaderboard";
import AdminPanel from "./pages/AdminPanel";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function App() {
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={userInfo ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/room/:roomCode"
          element={userInfo ? <RoomLobby /> : <Navigate to="/login" />}
        />
        <Route
          path="/battle/:roomCode"
          element={userInfo ? <BattleArena /> : <Navigate to="/login" />}
        />
        <Route
          path="/leaderboard"
          element={userInfo ? <Leaderboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={userInfo ? <AdminPanel /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;