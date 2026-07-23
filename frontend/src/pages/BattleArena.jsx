import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { useNavigate, useParams } from "react-router-dom";
import gameConfig from "../game/config";
import BattleScene from "../game/scenes/BattleScene";
import "./BattleArena.css";

function BattleArena() {
  const gameRef = useRef(null);
  const { roomCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

    if (gameRef.current) return; // Already created, don't create again

    const game = new Phaser.Game(gameConfig);
    gameRef.current = game;

    // Scene ko add karo but auto-start mat karo (false param)
    game.scene.add("BattleScene", BattleScene, false);

    game.events.once("ready", () => {
      // Ab manually, data ke saath, sirf ek baar start karo
      game.scene.start("BattleScene", {
        roomCode,
        username: userInfo?.username,
        userId: userInfo?._id,
      });
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [roomCode]);

  return (
    <div className="battle-arena-container">
      <div className="arena-topbar">
        <span className="room-code-label">Room: {roomCode}</span>
        <button
          className="btn btn-sm btn-outline-light"
          onClick={() => navigate("/dashboard")}
        >
          Exit Match
        </button>
      </div>

      <div id="phaser-container" className="phaser-wrapper"></div>
    </div>
  );
}

export default BattleArena;