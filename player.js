const player = document.getElementById('player');
const gameContainer = document.getElementById('game-container');

const SPEED = 2;
const BULLET_SPEED = 3;

let x = 0;
let y = 0;
let canShoot = true; 

const bullets = [];

const keys = {
    ArrowUp: false,
    KeyW: false,
    ArrowDown: false,
    KeyS: false,
    ArrowLeft: false,
    KeyA: false,
    ArrowRight: false,
    KeyD: false,
    Space: false,
};

document.addEventListener('keydown', (event) => {
    if (event.code in keys) keys[event.code] = true;
});

document.addEventListener('keyup', (event) => {
    if (event.code in keys) keys[event.code] = false;
    if (event.code === 'Space') canShoot = true;
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

    if ((nextX >= 0 && nextX <= containerWidth - playerSize) && !isCollidingBox(nextX, nextY, playerSize)) {
        x = nextX; 
    }
    
    if ((nextY >= 0 && nextY <= containerHeight - playerSize) && !isCollidingBox(nextX, nextY, playerSize)) {
        y = nextY; 
    }

    player.style.transform = `translate(${x}px, ${y}px)`;
}

let mousePos = [0, 0];

document.addEventListener('mousemove', (event) => {
    mousePos = [event.clientX, event.clientY];
});

function playerShoots() {
    if (keys.Space && canShoot) {  
        canShoot = false; 
        
        let bulletX = x;
        let bulletY = y;

        let dx = mousePos[0] - bulletX;
        let dy = mousePos[1] - bulletY;
        
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) { 
            dx /= length;
            dy /= length;
        }
        
        const bullet = document.createElement('div');
        bullet.className = "bullet";
        bullet.style.transform = `translate(${bulletX}px, ${bulletY}px)`;
        gameContainer.appendChild(bullet);

        bullets.push({
            element: bullet,
            x: bulletX,
            y: bulletY,
            dx: dx,
            dy: dy,
            createdAt: Date.now(),
            createdBy: 'player'
        });
    }
}

function updatePlayerBullets(speed) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        
        if (Date.now() - b.createdAt > 3000) {
            b.element.remove();
            bullets.splice(i, 1);
            continue; 
        }

        b.x += b.dx * speed; 
        if (isCollidingBox(b.x, b.y, 10)) {
            b.x -= b.dx * speed; 
            b.dx = -b.dx;        
        }

        b.y += b.dy * speed;
        if (isCollidingBox(b.x, b.y, 10)) {
            b.y -= b.dy * speed; 
            b.dy = -b.dy;        
        }

        b.element.style.transform = `translate(${b.x}px, ${b.y}px)`;

        if (isCollidingEnemy(b.x, b.y)) {
            console.log("Shot an enemy");
        }

        if (b.x < 0 || b.x > containerWidth || b.y < 0 || b.y > containerHeight) {
            b.element.remove();      
            bullets.splice(i, 1);    
        }
    }
}