# AI Battle Arena

A 2D multiplayer online battle game built with the MERN stack, real-time Socket.io communication, and rule-based AI bots. Players can register, create or join battle rooms, fight in real time against other players or AI bots, earn XP/coins, and climb the global leaderboard.

## 🔗 Live Links

| Part | URL |
|------|-----|
| **Live App (Frontend)** | https://ai-battle-arena-smoky.vercel.app |
| **Backend API** | https://ai-battle-arena-backend-mn2k.onrender.com |

> ⚠️ Note: The backend is hosted on Render's free tier, which "sleeps" after inactivity. The first request after idle time may take 30-50 seconds to respond while the server wakes up — this is expected behavior, not a bug.

### How to Test
1. Open the live app link above.
2. Register a new account (or use an existing one).
3. Create a Room from the Dashboard, or add an AI Bot to play solo.
4. Share the Room Code with a friend to battle together, or click "Start Match" to fight the AI bot.
5. Check the Leaderboard and Match History after playing.

---

## Tech Stack

**Frontend:** React (Vite), Phaser.js, Bootstrap, Socket.io-client
**Backend:** Node.js, Express.js, Socket.io
**Database:** MongoDB (Atlas)
**Auth:** JWT, bcrypt.js

---

## Features Implemented

- User Authentication (Register/Login with JWT)
- Player Dashboard (Level, XP, Coins, Match History)
- Multiplayer Room System (Create/Join/Leave, real-time via Socket.io)
- Battle Arena (movement, shooting, health bars, elimination)
- Winner Detection + Match Saving + Rewards (XP/Coins)
- AI Bot System (rule-based movement + shooting)
- Global Leaderboard
- Admin Panel (Analytics, User Management/Ban, Match Records)

---

## Project Structure

```
ai-battle-arena/
├── backend/
│   ├── config/db.js
│   ├── models/         (User, Room, Match)
│   ├── controllers/    (auth, room, admin, leaderboard)
│   ├── routes/
│   ├── middleware/      (authMiddleware - protect, adminOnly)
│   ├── server.js        (Express + Socket.io)
│   └── .env
└── frontend/
    ├── src/
    │   ├── api/axios.js
    │   ├── socket.js
    │   ├── game/         (Phaser config + BattleScene)
    │   ├── components/   (Spinner)
    │   └── pages/         (Login, Register, Dashboard, RoomLobby, BattleArena, Leaderboard, AdminPanel)
```

---

## Local Setup (Recap)

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Required `.env` (backend)
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_random_secret_string
```

---

## Deployment (Completed)

| Part | Platform | Status |
|------|----------|--------|
| Frontend | Vercel | ✅ Live |
| Backend | Render | ✅ Live |
| Database | MongoDB Atlas | ✅ Connected |

### How It Was Deployed

**Backend (Render):**
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `node server.js`
- Environment Variables: `MONGO_URI`, `JWT_SECRET`, `PORT`

**Frontend (Vercel):**
- Root Directory: `frontend`
- Framework Preset: Vite
- Environment Variable: `VITE_API_URL` = live Render backend URL + `/api`
- A `vercel.json` rewrite rule was added so that direct/refreshed routes (e.g. `/dashboard`, `/battle/:roomCode`) correctly resolve to the React app instead of returning 404:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**CORS:** Backend's CORS origin is locked to the live Vercel frontend URL (not `*`) for both Express and Socket.io, for better security.

**MongoDB Atlas:** Network Access is set to allow all IPs (`0.0.0.0/0`) since Render's free tier does not use a fixed IP.

---

## Post-Deployment Checklist

- [x] Register + Login works on live URL
- [x] Room create/join works (Socket.io connects over HTTPS/WSS)
- [x] Battle Arena loads and multiplayer sync works
- [x] Match saves correctly, XP/Coins update
- [x] Leaderboard reflects live data
- [x] Admin panel accessible only to admin account
- [x] Direct navigation/refresh on internal routes works (no 404)

---

## Notes

- Free tier Render services sleep after inactivity — first request after idle may be slow (~30-50s cold start).
- Environment variables in Vite (`VITE_...`) are baked in at build time — changing them on Vercel requires a redeploy to take effect, not just a page refresh.
