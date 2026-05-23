const colors = ["#c40000", "#000000"];
const body = document.body;

function createHeart() {
    const heart = document.createElement("div");
    heart.classList.add("heart");
    heart.textContent = "❤";
    heart.style.color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 25 + 15; 
    heart.style.fontSize = size + "px";
    heart.style.left = Math.random() * window.innerWidth + "px";
    heart.style.top = "-30px";
    body.appendChild(heart);

    let top = -30;
    const speed = Math.random() * 2 + 1;
    const rotation = Math.random() * 360;

    function fall() {
        top += speed;
        heart.style.top = top + "px";
        heart.style.transform = `rotate(${rotation + top}deg)`;
        if (top < window.innerHeight) {
            requestAnimationFrame(fall);
        } else {
            heart.remove();
        }
    }
    fall();
}

setInterval(createHeart, 190);

const buttons = document.querySelectorAll(".btn");
buttons.forEach(btn => {
    btn.addEventListener("click", () => {
        btn.style.background = "#c40000";
        btn.style.color = "#fff";
    });
});

const timeBtn = document.getElementById("timeBtn"); 

timeBtn.addEventListener("click", () => {
    window.location.href = "chapter5.html";
});


const musicBtn = document.getElementById("musicBtn");

musicBtn.addEventListener("click", () => {

    window.location.href = "chapter4.html";
});