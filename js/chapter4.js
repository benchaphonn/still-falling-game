const colors = ["#c40000", "#000000"];

function createHeart() {
    const heart = document.createElement("div");
    heart.classList.add("heart");
    heart.textContent = "❤";
    heart.style.color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 30 + 10;
    heart.style.fontSize = size + "px";
    heart.style.left = Math.random() * window.innerWidth + "px";
    heart.style.top = "-40px";
    heart.style.zIndex = "10";
    document.body.appendChild(heart);

    let top = -40;
    const speed = Math.random() * 2 + 1;
    const rotation = Math.random() * 360;

    function fall() {
        top += speed;
        heart.style.top = top + "px";
        heart.style.transform = `rotate(${rotation + top}deg)`;
        if (top < window.innerHeight - 100) {
            requestAnimationFrame(fall);
        } else {
            heart.remove();
        }
    }
    fall();
}

setInterval(createHeart, 200);

let player;
let currentBtn = null;

function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube-player', {
        height: '200', 
        width: '300',
        videoId: '',   
        events: {
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerStateChange(event) {

    if (event.data === YT.PlayerState.ENDED && currentBtn) {
        currentBtn.classList.remove("playing");
        currentBtn = null;
    }
}

function playVideo(btn) {
    if (!player || !btn) return;
    const videoId = btn.dataset.videoId;

    if (currentBtn === btn) {
        player.stopVideo();
        btn.classList.remove("playing");
        currentBtn = null;
        return;
    }

    if (currentBtn) currentBtn.classList.remove("playing");

    player.loadVideoById(videoId);
    player.playVideo();
    btn.classList.add("playing");
    currentBtn = btn;
}

document.querySelectorAll(".play-btn").forEach(btn => {
    btn.addEventListener("click", () => playVideo(btn));
});


document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "chapter3.html";
});