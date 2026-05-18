const player = document.getElementById('player');
const gameContainer = document.getElementById('game-container');


const SPEED = 2;


let x = 0;
let y = 0;

const keys = {
    // Moving up
    ArrowUp: false,
    KeyW: false,

    // Moving Down
    ArrowDown: false,
    KeyS: false,

    // Moving Left
    ArrowLeft: false,
    KeyA: false,

    // Moving Right
    ArrowRight: false,
    KeyD: false
};

document.addEventListener('keydown', (event) => {
    if (event.code in keys) keys[event.code] = true;
});

document.addEventListener('keyup', (event) => {
    if (event.code in keys) keys[event.code] = false;
});

const containerWidth = gameContainer.clientWidth;
const containerHeight = gameContainer.clientHeight;
const playerSize = 20; 

function moveAndSlide(speed) {
    let dx = 0;
    let dy = 0;

    if (keys.ArrowUp || keys.KeyW) dy -= 1;
    if (keys.ArrowDown || keys.KeyS) dy += 1;
    if (keys.ArrowLeft || keys.KeyA) dx -= 1;
    if (keys.ArrowRight || keys.KeyD) dx += 1;

    if (dx !== 0 && dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);
        dx /= length;
        dy /= length;
    }

    let nextX = x + (dx * speed);
    let nextY = y + (dy * speed);

    if ((nextX >= 0 && nextX <= containerWidth - playerSize) && !collisionBox(nextX, nextY, playerSize)) {
        x = nextX; 
    }
    
    if ((nextY >= 0 && nextY <= containerHeight - playerSize) && !collisionBox(nextX, nextY, playerSize)) {
        y = nextY; 
    }

    player.style.left = x + 'px';
    player.style.top = y + 'px';
}

function updateGame() {
    moveAndSlide(SPEED);
    requestAnimationFrame(updateGame);
}

player.style.position = 'absolute'; 

requestAnimationFrame(updateGame);