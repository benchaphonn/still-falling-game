document.addEventListener("DOMContentLoaded", () => {
  const socket = io();

  const characterButtons = document.querySelectorAll(".character");
  const joinBtn = document.getElementById("joinBtn");
  const playerBox = document.getElementById("playerBox");
  const nameInput = document.getElementById("nameInput");
  const startBtn = document.getElementById("startBtn");
  const playBtn = document.getElementById("playBtn");
  const lobbyPage = document.getElementById("lobbyPage");
  const howToPage = document.getElementById("howToPage");

  let selectedCharacter = null;
  let joined = false;

  let token = sessionStorage.getItem("playerToken");

  if (!token) {
    token = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

    sessionStorage.setItem("playerToken", token);
  }

  // เลือกตัวละคร
  characterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      characterButtons.forEach((b) => b.classList.remove("active"));

      btn.classList.add("active");

      selectedCharacter = btn.textContent.trim();
    });
  });

  // กด Join
  joinBtn.addEventListener("click", () => {
    if (!selectedCharacter) {
      alert("Please select a character!");
      return;
    }

    const playerName = nameInput.value.trim() || "Player";

    // เก็บข้อมูลผู้เล่น
    sessionStorage.setItem("playerName", playerName);
    sessionStorage.setItem("playerCharacter", selectedCharacter);

    // เพิ่ม localStorage เผื่อข้ามหน้า
    localStorage.setItem("playerName", playerName);
    localStorage.setItem("playerCharacter", selectedCharacter);

    socket.emit("joinLobby", {
      token,
      name: playerName,
      character: selectedCharacter,
    });

    joined = true;
  });

  // รับ slot
  socket.on("playerSlot", (data) => {
    sessionStorage.setItem("playerSlot", data.slot);
  });

  // ล็อบบี้เต็ม
  socket.on("lobbyFull", () => {
    alert("มีผู้เล่นครบ 2 คนแล้ว");
  });

  // อัปเดตรายชื่อผู้เล่น
  socket.on("updatePlayers", (players = []) => {
    playerBox.innerHTML = "";

    if (!players.length) {
      playerBox.innerHTML = `
        <div class="no-player">
          No player
        </div>
      `;
    } else {
      players.forEach((player) => {
        const div = document.createElement("div");

        div.className = "player-card";

        div.innerHTML = `
          <div class="player-emoji">
            ${player.character || ""}
          </div>

          <div class="player-name">
            ${player.name || "Player"}
          </div>
        `;

        playerBox.appendChild(div);
      });
    }

    if (players.length >= 2) {
      startBtn.classList.remove("hidden");
    } else {
      startBtn.classList.add("hidden");
    }
  });

  // กด Start
  startBtn.addEventListener("click", () => {
    if (!joined && !sessionStorage.getItem("playerSlot")) {
      alert("Please join before starting!");
      return;
    }

    socket.emit("startGame");

    lobbyPage.classList.add("hidden");
    howToPage.classList.remove("hidden");
  });

  // เกมเริ่ม
  socket.on("gameStarted", () => {
    lobbyPage.classList.add("hidden");
    howToPage.classList.remove("hidden");
  });

  // เข้า chapter1
  playBtn.addEventListener("click", () => {
    window.location.href = "chapter1.html";
  });
});
