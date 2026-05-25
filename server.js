const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/chapter1.html", (req, res) => res.sendFile(path.join(__dirname, "chapter1.html")));
app.get("/chapter2.html", (req, res) => res.sendFile(path.join(__dirname, "chapter2.html")));
app.get("/chapter3.html", (req, res) => res.sendFile(path.join(__dirname, "chapter3.html")));
app.get("/chapter4.html", (req, res) => res.sendFile(path.join(__dirname, "chapter4.html")));
app.get("/chapter5.html", (req, res) => res.sendFile(path.join(__dirname, "chapter5.html")));


let players = []; // { token, socketId, slot, name, character, disconnectTimer }
let chapter1State = null;
let chapter2Scores = { player1: 0, player2: 0 };
let chapter2Cards = [];

function makeChapter2Cards() {
  const emojis = ["🐶", "🐰", "🕊️", "☀️", "🐱", "⭐", "🦈", "🐵", "💖", "🐯"];
  const deck = [];

  emojis.forEach((emoji) => {
    deck.push({ emoji });
    deck.push({ emoji });
  });

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  chapter2Cards = deck;
}

function publicPlayers() {
  return players
    .sort((a, b) => a.slot.localeCompare(b.slot))
    .map((p) => ({
      slot: p.slot,
      name: p.name,
      character: p.character,
    }));
}

function findByToken(token) {
  return players.find((p) => p.token === token);
}

function makeHearts() {
  const hearts = [];
  for (let i = 0; i < 20; i++) {
    hearts.push({
      id: i,
      x: Math.floor(25 + Math.random() * 620),
      y: Math.floor(25 + Math.random() * 455),
      collected: false,
    });
  }
  return hearts;
}

function resetChapter1() {
  chapter1State = {
    hearts: makeHearts(),
    startedAt: null,
    durationMs: 20000,
    ended: false,
  };
}

io.on("connection", (socket) => {
  socket.emit("updatePlayers", publicPlayers());

  socket.on("joinLobby", (data) => {
    const token = data?.token || socket.id;
    let player = findByToken(token);

    if (player?.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
      player.disconnectTimer = null;
    }

    if (!player) {
      if (players.length >= 2) {
        socket.emit("lobbyFull");
        return;
      }
      player = {
        token,
        socketId: socket.id,
        slot: players.some((p) => p.slot === "player1") ? "player2" : "player1",
        name: data?.name || "Player",
        character: data?.character || "🐶",
        disconnectTimer: null,
      };
      players.push(player);
    } else {
      player.socketId = socket.id;
      player.name = data?.name || player.name;
      player.character = data?.character || player.character;
    }

    socket.emit("playerSlot", { slot: player.slot, token: player.token });
    io.emit("updatePlayers", publicPlayers());
  });

  socket.on("requestPlayers", () => {
    socket.emit("updatePlayers", publicPlayers());
  });

  socket.on("startGame", () => {
    resetChapter1();
    chapter2Scores = { player1: 0, player2: 0 };
    makeChapter2Cards();
    io.emit("gameStarted");
  });

  socket.on("chapter1Ready", (data) => {
    const token = data?.token;
    const player = findByToken(token);
    if (player) {
      if (player.disconnectTimer) {
        clearTimeout(player.disconnectTimer);
        player.disconnectTimer = null;
      }
      player.socketId = socket.id;
      socket.emit("playerSlot", { slot: player.slot, token: player.token });
    }

    if (!chapter1State) resetChapter1();

    socket.emit("chapter1Init", {
      players: publicPlayers(),
      hearts: chapter1State.hearts,
      startedAt: chapter1State.startedAt,
      durationMs: chapter1State.durationMs,
      serverNow: Date.now(),
    });
    io.emit("updatePlayers", publicPlayers());
  });

  socket.on("chapter1FirstMove", () => {
    if (!chapter1State) resetChapter1();
    if (!chapter1State.startedAt && !chapter1State.ended) {
      chapter1State.startedAt = Date.now();
      io.emit("chapter1TimerStarted", {
        startedAt: chapter1State.startedAt,
        durationMs: chapter1State.durationMs,
        serverNow: Date.now(),
      });
    }
  });

  socket.on("playerMoved", (data) => {
    socket.broadcast.emit("playerMoved", data);
  });

  socket.on("heartCollected", (data) => {
    if (!chapter1State || chapter1State.ended) return;
    const id = Number(data?.heartId);
    const heart = chapter1State.hearts.find((h) => h.id === id);
    if (!heart || heart.collected) return;

    heart.collected = true;
    io.emit("heartCollected", { heartId: id });

    if (chapter1State.hearts.every((h) => h.collected)) {
      chapter1State.ended = true;
      io.emit("chapter1Ended", { win: true });
    }
  });

  socket.on("chapter1TimeUp", () => {
    if (!chapter1State || chapter1State.ended) return;
    chapter1State.ended = true;
    io.emit("chapter1Ended", { win: false });
  });

  socket.on("chapter2Ready", () => {
    if (!chapter2Cards.length) makeChapter2Cards();
    socket.emit("chapter2Cards", chapter2Cards);
    socket.emit("scoreUpdate", chapter2Scores);
  });

  socket.on("cardFlipped", (data) => socket.broadcast.emit("cardFlipped", data));

  socket.on("updateScore", (data) => {
    if (data?.player && typeof data.score === "number") {
      chapter2Scores[data.player] = data.score;
      io.emit("scoreUpdate", chapter2Scores);
    }
  });

  socket.on("disconnect", () => {
    const player = players.find((p) => p.socketId === socket.id);
    if (player) {
      player.disconnectTimer = setTimeout(() => {
        players = players.filter((p) => p.token !== player.token);
        io.emit("updatePlayers", publicPlayers());
      }, 15000);
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
