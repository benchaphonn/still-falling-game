const slider = document.querySelector('.slider');
const slides = document.querySelectorAll('.slider img');
let index = 0;

function nextSlide() {
    index = (index + 1) % slides.length;
    slider.style.transform = `translateX(-${index * 100}%)`;
}

setInterval(nextSlide, 3000); 

const timerDisplay = document.getElementById('timer');
const startDate = new Date(2026, 1, 26); 

function updateTimer() {
    const now = new Date();
    let diff = now - startDate;

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    timerDisplay.textContent = ` ${days} Day ${hours} Hours. ${minutes} Minutes ${seconds} Second`;
}

setInterval(updateTimer, 1000);
updateTimer();

document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = 'chapter3.html';
});

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
        if(top < window.innerHeight - 50) {
            requestAnimationFrame(fall);
        } else {
            heart.remove();
        }
    }
    fall();
}
setInterval(createHeart, 150);
