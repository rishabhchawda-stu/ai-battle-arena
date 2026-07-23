import Phaser from "phaser";

const gameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "phaser-container",
  backgroundColor: "#1a1a2e",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  // scene array yahan se hata diya - manually add karenge BattleArena.jsx mein
};

export default gameConfig;