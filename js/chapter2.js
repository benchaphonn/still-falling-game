document.addEventListener("DOMContentLoaded", () => {
    const socket = io();
  
    const cardsContainer = document.getElementById("cardsContainer");
    const timerEl = document.getElementById("timer");
    const p1ScoreEl = document.getElementById("player1Score");
    const p2ScoreEl = document.getElementById("player2Score");
    const popup = document.getElementById("popup");
    const popupTitle = document.getElementById("popupTitle");
    const popupEmoji = document.getElementById("popupEmoji");
    const popupBtn = document.getElementById("popupBtn");
  
    let mySlot = sessionStorage.getItem("playerSlot") || "player1";
    let cards = [];
    let flippedCards = [];
    let matchedCount = 0;
    let scores = { player1: 0, player2: 0 };
    let timeLeft = 60;
    let timerInterval = null;
    let timerStarted = false;
    let canClick = true;
    let popupMode = "retry";
  
    function renderCards() {
      cardsContainer.innerHTML = "";
  
      cards.forEach((card, index) => {
        const cardDiv = document.createElement("button");
        cardDiv.type = "button";
        cardDiv.className = "card";
        cardDiv.dataset.index = String(index);
        cardDiv.dataset.emoji = card.emoji;
        cardDiv.innerHTML = `<span class="card-emoji">${card.emoji}</span>`;
  
        cardDiv.addEventListener("click", () => {
          flipCard(cardDiv, true, mySlot);
        });
  
        cardsContainer.appendChild(cardDiv);
      });
    }
  
    function updateScore() {
      p1ScoreEl.textContent = scores.player1 || 0;
      p2ScoreEl.textContent = scores.player2 || 0;
    }
  
    function updateTimer() {
      timerEl.textContent = `Time 00:${timeLeft < 10 ? "0" + timeLeft : timeLeft}`;
    }
  
    function startTimer() {
      if (timerStarted) return;
  
      timerStarted = true;
      clearInterval(timerInterval);
      updateTimer();
  
      timerInterval = setInterval(() => {
        timeLeft -= 1;
        updateTimer();
  
        if (timeLeft <= 0) {
          endGame(false);
        }
      }, 1000);
    }
  
    function showPopup(isWin) {
      popupMode = isWin ? "next" : "retry";
      popupTitle.textContent = isWin ? "NEXT CHAPTER" : "OUT OF TIME";
      popupEmoji.textContent = isWin ? "🎉" : "⏰";
      popupBtn.textContent = isWin ? "Next Chapter" : "Play Again";
      popup.classList.remove("hidden");
      popup.style.display = "flex";
    }
  
    function endGame(isWin) {
      canClick = false;
      clearInterval(timerInterval);
      showPopup(isWin);
    }
  
    function flipCard(cardDiv, emitSocket, flipperSlot) {
      if (!canClick) return;
      if (cardDiv.classList.contains("flipped") || cardDiv.classList.contains("matched")) return;
      if (flippedCards.length >= 2) return;
  
      startTimer();
  
      cardDiv.classList.add("flipped");
      cardDiv.dataset.flippedBy = flipperSlot || mySlot;
      flippedCards.push(cardDiv);
  
      if (emitSocket) {
        socket.emit("cardFlipped", {
          index: cardDiv.dataset.index,
          player: mySlot,
        });
      }
  
      if (flippedCards.length === 2) {
        canClick = false;
        setTimeout(checkMatch, 600);
      }
    }
  
    function checkMatch() {
      const [c1, c2] = flippedCards;
  
      if (!c1 || !c2) {
        flippedCards = [];
        canClick = true;
        return;
      }
  
      if (c1.dataset.emoji === c2.dataset.emoji) {
        c1.classList.add("matched");
        c2.classList.add("matched");
        matchedCount += 2;
  
        // ให้คะแนนคนที่กดใบที่ 2 ซึ่งเป็นคนปิดคู่
        const scorer = c2.dataset.flippedBy || c1.dataset.flippedBy || mySlot;
  
        // ให้เครื่องของคนที่ได้คะแนนเป็นคนส่งคะแนนขึ้น server แค่เครื่องเดียว
        if (scorer === mySlot) {
          scores[scorer] = (scores[scorer] || 0) + 1;
  
          socket.emit("updateScore", {
            player: scorer,
            score: scores[scorer],
          });
        }
      } else {
        c1.classList.remove("flipped");
        c2.classList.remove("flipped");
        c1.dataset.flippedBy = "";
        c2.dataset.flippedBy = "";
      }
  
      flippedCards = [];
      canClick = true;
  
      if (matchedCount >= cards.length) {
        endGame(true);
      }
    }
  
    socket.on("chapter2Cards", (serverCards = []) => {
      cards = serverCards;
      matchedCount = 0;
      flippedCards = [];
      canClick = true;
      renderCards();
      updateScore();
      updateTimer();
    });
  
    socket.on("playerSlot", (data) => {
      if (data?.slot) {
        mySlot = data.slot;
        sessionStorage.setItem("playerSlot", data.slot);
      }
    });
  
    socket.on("cardFlipped", (data) => {
      const cardDiv = document.querySelector(`.card[data-index='${data.index}']`);
      if (cardDiv) {
        flipCard(cardDiv, false, data.player);
      }
    });
  
    socket.on("scoreUpdate", (newScores) => {
      scores = { ...scores, ...newScores };
      updateScore();
    });
  
    popupBtn.addEventListener("click", () => {
      if (popupMode === "next") {
        window.location.href = "chapter3.html";
      } else {
        window.location.reload();
      }
    });
  
    updateScore();
    updateTimer();
    popup.classList.add("hidden");
    popup.style.display = "none";
    socket.emit("chapter2Ready");
  });
  
