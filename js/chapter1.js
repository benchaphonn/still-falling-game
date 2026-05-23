document.addEventListener("DOMContentLoaded", () => {
    const socket = io();
  
    const player1Div = document.getElementById("player1");
    const player2Div = document.getElementById("player2");
    const timerEl = document.getElementById("timer");
    const gameArea = document.getElementById("gameArea");
    const heartsContainer = document.getElementById("heartsContainer");
    const popup = document.getElementById("popup");
    const popupTitle = document.getElementById("popupTitle");
    const popupEmoji = document.getElementById("popupEmoji");
    const popupBtn = document.getElementById("popupBtn");
  
    const totalTime = 20;
    const speed = 4.2;
  
    let mySlot = sessionStorage.getItem("playerSlot") || "player1";
    let token = sessionStorage.getItem("playerToken") || "";
  
    let player1 = { x: 50, y: 50, emoji: sessionStorage.getItem("playerCharacter") || "" };
    let player2 = { x: 300, y: 50, emoji: "" };
  
    let pressed = {};
    let animationId = null;
    let collisionInterval = null;
    let timerInterval = null;
    let timerStarted = false;
    let ended = false;
    let popupMode = "retry";
  
    function placePlayers() {
      player1Div.style.left = `${player1.x}px`;
      player1Div.style.top = `${player1.y}px`;
      player2Div.style.left = `${player2.x}px`;
      player2Div.style.top = `${player2.y}px`;
    }
  
    function renderPlayers(players = []) {
      const p1 = players.find((p) => p.slot === "player1");
      const p2 = players.find((p) => p.slot === "player2");
  
      if (p1?.character) {
        player1.emoji = p1.character;
        player1Div.textContent = p1.character;
        player1Div.title = p1.name || "Player 1";
      }
      if (p2?.character) {
        player2.emoji = p2.character;
        player2Div.textContent = p2.character;
        player2Div.title = p2.name || "Player 2";
      }
  
      if (!player1Div.textContent && player1.emoji) player1Div.textContent = player1.emoji;
      if (!player2Div.textContent && player2.emoji) player2Div.textContent = player2.emoji;
    }
  
    function renderHearts(hearts) {
      heartsContainer.innerHTML = "";
      hearts.forEach((h) => {
        const heart = document.createElement("div");
        heart.className = "heart";
        heart.dataset.index = String(h.id);
        heart.textContent = "❤️";
        heart.style.left = `${h.x}px`;
        heart.style.top = `${h.y}px`;
        if (h.collected) {
          heart.classList.add("collected");
          heart.style.display = "none";
        }
        heartsContainer.appendChild(heart);
      });
    }
  
    function setTimerText(seconds) {
      seconds = Math.max(0, Math.ceil(seconds));
      timerEl.textContent = `Time 00:${seconds < 10 ? "0" + seconds : seconds}`;
    }
  
    function runSyncedTimer(startedAt, durationMs, serverNow) {
      timerStarted = true;
      clearInterval(timerInterval);
  
      const localOffset = Date.now() - serverNow;
  
      timerInterval = setInterval(() => {
        const syncedNow = Date.now() - localOffset;
        const remainMs = durationMs - (syncedNow - startedAt);
        setTimerText(remainMs / 1000);
  
        if (remainMs <= 0 && !ended) {
          clearInterval(timerInterval);
          socket.emit("chapter1TimeUp");
        }
      }, 100);
  
      setTimerText((durationMs - (serverNow - startedAt)) / 1000);
    }
  
    function showPopup(isWin) {
      ended = true;
      popupMode = isWin ? "next" : "retry";
      popupTitle.textContent = isWin ? "NEXT CHAPTER" : "OUT OF TIME";
      popupEmoji.textContent = isWin ? "🎉" : "⏰";
      popupBtn.textContent = isWin ? "Next Chapter" : "Play Again";
      popup.classList.remove("hidden");
      popup.style.display = "flex";
      clearInterval(timerInterval);
      clearInterval(collisionInterval);
      cancelAnimationFrame(animationId);
    }
  
    function checkCollision(playerDiv, heart) {
      const p = playerDiv.getBoundingClientRect();
      const h = heart.getBoundingClientRect();
      return p.left < h.right && p.right > h.left && p.top < h.bottom && p.bottom > h.top;
    }
  
    function checkHearts() {
      if (ended) return;
      const myDiv = mySlot === "player2" ? player2Div : player1Div;
      document.querySelectorAll(".heart:not(.collected)").forEach((heart) => {
        if (checkCollision(myDiv, heart)) {
          heart.classList.add("collected");
          heart.style.display = "none";
          socket.emit("heartCollected", { heartId: heart.dataset.index });
        }
      });
    }
  
    function moveLoop() {
      if (ended) return;
  
      let dx = 0;
      let dy = 0;
  
      if (mySlot === "player1") {
        if (pressed["w"]) dy -= speed;
        if (pressed["s"]) dy += speed;
        if (pressed["a"]) dx -= speed;
        if (pressed["d"]) dx += speed;
      } else {
        if (pressed["arrowup"]) dy -= speed;
        if (pressed["arrowdown"]) dy += speed;
        if (pressed["arrowleft"]) dx -= speed;
        if (pressed["arrowright"]) dx += speed;
      }
  
      if (dx || dy) {
        if (!timerStarted) socket.emit("chapter1FirstMove");
  
        const player = mySlot === "player2" ? player2 : player1;
        const div = mySlot === "player2" ? player2Div : player1Div;
  
        player.x = Math.max(0, Math.min(gameArea.clientWidth - 50, player.x + dx));
        player.y = Math.max(0, Math.min(gameArea.clientHeight - 50, player.y + dy));
        div.style.left = `${player.x}px`;
        div.style.top = `${player.y}px`;
  
        socket.emit("playerMoved", { id: mySlot, x: player.x, y: player.y });
      }
  
      animationId = requestAnimationFrame(moveLoop);
    }
  
    document.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        event.preventDefault();
        pressed[key] = true;
      }
    });
  
    document.addEventListener("keyup", (event) => {
      pressed[event.key.toLowerCase()] = false;
    });
  
    socket.on("playerSlot", (data) => {
      mySlot = data.slot;
      sessionStorage.setItem("playerSlot", data.slot);
    });
  
    socket.on("chapter1Init", (data) => {
      popup.classList.add("hidden");
      popup.style.display = "none";
      ended = false;
      renderPlayers(data.players);
      renderHearts(data.hearts);
      placePlayers();
      setTimerText(totalTime);
  
      if (data.startedAt) {
        runSyncedTimer(data.startedAt, data.durationMs, data.serverNow);
      }
  
      clearInterval(collisionInterval);
      collisionInterval = setInterval(checkHearts, 30);
      cancelAnimationFrame(animationId);
      animationId = requestAnimationFrame(moveLoop);
    });
  
    socket.on("updatePlayers", renderPlayers);
  
    socket.on("chapter1TimerStarted", (data) => {
      if (!timerStarted) runSyncedTimer(data.startedAt, data.durationMs, data.serverNow);
    });
  
    socket.on("playerMoved", (data) => {
      const player = data.id === "player2" ? player2 : player1;
      const div = data.id === "player2" ? player2Div : player1Div;
      player.x = data.x;
      player.y = data.y;
      div.style.left = `${data.x}px`;
      div.style.top = `${data.y}px`;
    });
  
    socket.on("heartCollected", (data) => {
      const heart = document.querySelector(`.heart[data-index='${data.heartId}']`);
      if (heart) {
        heart.classList.add("collected");
        heart.style.display = "none";
      }
    });
  
    socket.on("chapter1Ended", (data) => showPopup(Boolean(data.win)));
  
    popupBtn.addEventListener("click", () => {
      if (popupMode === "next") window.location.href = "chapter2.html";
      else window.location.href = "index.html";
    });
  
    socket.emit("chapter1Ready", { token });
  });