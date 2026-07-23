import Phaser from "phaser";
import socket from "../../socket";

function speedMagnitude(vx, vy) {
  return Math.sqrt(vx * vx + vy * vy);
}

class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: "BattleScene" });
    this.otherPlayers = {};
    this.bullets = [];
    this.playerHealth = 100;
    this.facingAngle = 0;
    this.isEliminated = false;
  }

  init(data) {
    this.roomCode = data.roomCode;
    this.username = data.username;
    this.userId = data.userId;
  }

  preload() {}

  create() {
    this.cameras.main.setBackgroundColor("#1a1a2e");

    const graphics = this.add.graphics();
    graphics.lineStyle(4, 0xe94560, 1);
    graphics.strokeRect(20, 20, 760, 560);

    // Player
    this.player = this.physics.add.existing(
      this.add.circle(400, 300, 20, 0xe94560)
    );
    this.player.body.setCollideWorldBounds(true);
    this.physics.world.setBounds(20, 20, 760, 560);

    this.playerNameText = this.add.text(400, 270, this.username || "You", {
      fontSize: "14px",
      color: "#ffffff",
    });
    this.playerNameText.setOrigin(0.5);

    this.playerHealthBarBg = this.add.rectangle(400, 250, 44, 6, 0x333333);
    this.playerHealthBar = this.add.rectangle(400, 250, 40, 4, 0x2ecc71);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.playerSpeed = 200;

    this.add.text(30, 540, "Arrows: Move | Space: Shoot", {
      fontSize: "12px",
      color: "#a0a0c0",
    });

    this.statusText = this.add.text(400, 300, "", {
      fontSize: "28px",
      color: "#e94560",
      fontStyle: "bold",
    });
    this.statusText.setOrigin(0.5);
    this.statusText.setDepth(100);

    // ----- Socket Listeners -----

    socket.on("existingPlayers", (players) => {
      players.forEach((p) => {
        this.addOtherPlayer(p.socketId, p.username, p.x, p.y, p.health);
      });
    });

    socket.on("playerJoinedBattle", ({ socketId, username }) => {
      this.addOtherPlayer(socketId, username, 400, 300, 100);
    });

    socket.on("playerMoved", ({ socketId, x, y }) => {
      const other = this.otherPlayers[socketId];
      if (other && !other.eliminated) {
        other.circle.x = x;
        other.circle.y = y;
        other.nameText.x = x;
        other.nameText.y = y - 30;
        other.healthBarBg.x = x;
        other.healthBarBg.y = y - 50;
        other.healthBar.x = x - (44 - other.healthBar.width) / 2 - 2;
        other.healthBar.y = y - 50;
      }
    });

    socket.on("bulletFired", ({ socketId, x, y, angle }) => {
      const other = this.otherPlayers[socketId];
      if (other) {
        this.spawnVisualBullet(x, y, angle, socketId);
      }
    });

    socket.on("healthUpdate", ({ socketId, health }) => {
      if (socketId === socket.id) {
        this.playerHealth = health;
        this.updateHealthBar(this.playerHealthBar, health);
      } else if (this.otherPlayers[socketId]) {
        this.otherPlayers[socketId].health = health;
        this.updateHealthBar(this.otherPlayers[socketId].healthBar, health);
      }
    });

    socket.on("playerEliminated", ({ socketId, username, eliminatedBy }) => {
      if (socketId === socket.id) {
        this.isEliminated = true;
        this.statusText.setText("ELIMINATED");
        this.player.setVisible(false);
      } else if (this.otherPlayers[socketId]) {
        this.otherPlayers[socketId].eliminated = true;
        this.otherPlayers[socketId].circle.setVisible(false);
        this.otherPlayers[socketId].nameText.setVisible(false);
        this.otherPlayers[socketId].healthBar.setVisible(false);
        this.otherPlayers[socketId].healthBarBg.setVisible(false);
      }
    });

    socket.on("playerLeftBattle", ({ socketId }) => {
      const other = this.otherPlayers[socketId];
      if (other) {
        other.circle.destroy();
        other.nameText.destroy();
        other.healthBar.destroy();
        other.healthBarBg.destroy();
        delete this.otherPlayers[socketId];
      }
    });

    socket.on("matchEnded", ({ winnerUsername, players }) => {
      this.showMatchEndScreen(winnerUsername, players);
    });

    socket.emit("joinBattle", {
      roomCode: this.roomCode,
      username: this.username,
      userId: this.userId,
    });

    this.events.on("shutdown", () => {
      socket.off("playerJoinedBattle");
      socket.off("playerMoved");
      socket.off("playerLeftBattle");
      socket.off("existingPlayers");
      socket.off("bulletFired");
      socket.off("healthUpdate");
      socket.off("playerEliminated");
      socket.off("matchEnded");
    });
  }

  addOtherPlayer(socketId, username, x = 400, y = 300, health = 100) {
    const circle = this.add.circle(x, y, 20, 0x3aa6ff);
    const nameText = this.add.text(x, y - 30, username || "Player", {
      fontSize: "14px",
      color: "#ffffff",
    });
    nameText.setOrigin(0.5);

    const healthBarBg = this.add.rectangle(x, y - 50, 44, 6, 0x333333);
    const healthBar = this.add.rectangle(x, y - 50, 40, 4, 0x2ecc71);

    this.otherPlayers[socketId] = {
      circle,
      nameText,
      healthBar,
      healthBarBg,
      health,
      eliminated: false,
    };
  }

  updateHealthBar(bar, health) {
    const percent = Math.max(0, health) / 100;
    bar.width = 40 * percent;

    if (percent > 0.5) {
      bar.fillColor = 0x2ecc71;
    } else if (percent > 0.25) {
      bar.fillColor = 0xf39c12;
    } else {
      bar.fillColor = 0xe74c3c;
    }
  }

  spawnVisualBullet(x, y, angle, ownerSocketId) {
    const bullet = this.add.circle(x, y, 5, 0xffe66d);
    const speed = 400;
    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;

    this.bullets.push({
      sprite: bullet,
      velocityX,
      velocityY,
      ownerSocketId,
      distanceTraveled: 0,
    });
  }

  shoot() {
    if (this.isEliminated) return;

    const startX = this.player.x;
    const startY = this.player.y;
    const angle = this.facingAngle;

    this.spawnVisualBullet(startX, startY, angle, socket.id);

    socket.emit("playerShoot", {
      roomCode: this.roomCode,
      x: startX,
      y: startY,
      angle,
    });
  }

  checkBulletCollisions(bullet) {
    if (bullet.ownerSocketId !== socket.id) return;

    for (const socketId in this.otherPlayers) {
      const other = this.otherPlayers[socketId];
      if (other.eliminated) continue;

      const distance = Phaser.Math.Distance.Between(
        bullet.sprite.x,
        bullet.sprite.y,
        other.circle.x,
        other.circle.y
      );

      if (distance < 25) {
        socket.emit("playerHit", {
          roomCode: this.roomCode,
          targetSocketId: socketId,
          damage: 10,
        });

        bullet.sprite.destroy();
        bullet.hit = true;
        break;
      }
    }
  }

  showMatchEndScreen(winnerUsername, players) {
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.75);
    overlay.setDepth(200);

    const isWinner = winnerUsername === this.username;

    const titleText = this.add.text(
      400,
      180,
      isWinner ? "VICTORY!" : "MATCH OVER",
      {
        fontSize: "40px",
        color: isWinner ? "#2ecc71" : "#e94560",
        fontStyle: "bold",
      }
    );
    titleText.setOrigin(0.5);
    titleText.setDepth(201);

    const winnerText = this.add.text(400, 240, `Winner: ${winnerUsername}`, {
      fontSize: "20px",
      color: "#ffffff",
    });
    winnerText.setOrigin(0.5);
    winnerText.setDepth(201);

    let yPos = 300;
    players.forEach((p) => {
      const line = this.add.text(
        400,
        yPos,
        `${p.username} — ${p.kills} kills — ${p.result.toUpperCase()}`,
        {
          fontSize: "14px",
          color: p.result === "win" ? "#2ecc71" : "#a0a0c0",
        }
      );
      line.setOrigin(0.5);
      line.setDepth(201);
      yPos += 25;
    });

    const backText = this.add.text(
      400,
      yPos + 20,
      "Returning to Dashboard in 5s...",
      {
        fontSize: "13px",
        color: "#a0a0c0",
        fontStyle: "italic",
      }
    );
    backText.setOrigin(0.5);
    backText.setDepth(201);

    this.time.delayedCall(5000, () => {
      window.location.href = "/dashboard";
    });
  }

  update() {
    if (this.isEliminated) return;

    this.player.body.setVelocity(0);
    let moved = false;

    if (this.cursors.left.isDown) {
      this.player.body.setVelocityX(-this.playerSpeed);
      this.facingAngle = Math.PI;
      moved = true;
    } else if (this.cursors.right.isDown) {
      this.player.body.setVelocityX(this.playerSpeed);
      this.facingAngle = 0;
      moved = true;
    }

    if (this.cursors.up.isDown) {
      this.player.body.setVelocityY(-this.playerSpeed);
      this.facingAngle = -Math.PI / 2;
      moved = true;
    } else if (this.cursors.down.isDown) {
      this.player.body.setVelocityY(this.playerSpeed);
      this.facingAngle = Math.PI / 2;
      moved = true;
    }

    this.playerNameText.x = this.player.x;
    this.playerNameText.y = this.player.y - 30;
    this.playerHealthBarBg.x = this.player.x;
    this.playerHealthBarBg.y = this.player.y - 50;
    this.playerHealthBar.x =
      this.player.x - (44 - this.playerHealthBar.width) / 2 - 2;
    this.playerHealthBar.y = this.player.y - 50;

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.shoot();
    }

    this.bullets = this.bullets.filter((bullet) => {
      if (bullet.hit) return false;

      bullet.sprite.x += bullet.velocityX * (1 / 60);
      bullet.sprite.y += bullet.velocityY * (1 / 60);
      bullet.distanceTraveled +=
        speedMagnitude(bullet.velocityX, bullet.velocityY) * (1 / 60);

      this.checkBulletCollisions(bullet);

      if (
        bullet.distanceTraveled > 800 ||
        bullet.sprite.x < 20 ||
        bullet.sprite.x > 780 ||
        bullet.sprite.y < 20 ||
        bullet.sprite.y > 580
      ) {
        bullet.sprite.destroy();
        return false;
      }

      return true;
    });

    if (moved) {
      socket.emit("playerMove", {
        roomCode: this.roomCode,
        x: this.player.x,
        y: this.player.y,
      });
    }
  }
}

export default BattleScene;