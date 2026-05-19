const player = document.getElementById('player');
const gameContainer = document.getElementById('game-container');

const SPEED = 2;
const BULLET_SPEED = 3;
const MAX_PLAYER_HEALTH = 100;

let playerHealth = 100;
let allowedPlayerDamageScore = 10;

let x = -40;
let y = -40;

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

const playerSize = 15; 

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

    if (!isCollidingBox(nextX, nextY, playerSize)) {
        x = nextX; 
    }

    if (!isCollidingBox(nextX, nextY, playerSize)) {
        y = nextY; 
    }

    player.style.transform = `translate(${x}px, ${y}px)`;
}

let mousePos = [0, 0];

document.addEventListener('mousemove', (event) => {
    mousePos = [event.clientX, event.clientY];
});

const sector = document.getElementById('sector');

function rotateSector() {
    const playerWorldX = x + (playerSize / 2);
    const playerWorldY = y + (playerSize / 2);

    const targetWorldX = mousePos[0] - cameraOffsetX;
    const targetWorldY = mousePos[1] - cameraOffsetY;

    const dx = targetWorldX - playerWorldX;
    const dy = targetWorldY - playerWorldY;

    const angleInDegrees = Math.atan2(dy, dx) * (180 / Math.PI);
    const finalRotation = angleInDegrees + 35;

    sector.style.transform = `rotate(${finalRotation}deg)`;
}

function playerShoots() {
    if (keys.Space && canShoot) {  
        canShoot = false; 
        let bulletX = x;
        let bulletY = y;

        let targetWorldX = mousePos[0] - cameraOffsetX;
        let targetWorldY = mousePos[1] - cameraOffsetY;

        let dx = targetWorldX - bulletX;
        let dy = targetWorldY - bulletY;

        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) { 
            dx /= length;
            dy /= length;
        }

        const bullet = document.createElement('div');
        bullet.className = "bullet";
        bullet.style.transform = `translate(${bulletX}px, ${bulletY}px)`;
        world.appendChild(bullet);

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
    }
}

const playerHealthBar = document.getElementById('player-health-bar');

function updatePlayerHealth() {
    const healthPercentage = playerHealth / MAX_PLAYER_HEALTH;
    const newWidth = 30 * healthPercentage;
    playerHealthBar.style.width = newWidth + 'px';
    if (healthPercentage > 0.5) {
        playerHealthBar.style.backgroundColor = "greenyellow";
    } else if (healthPercentage > 0.25) {
        playerHealthBar.style.backgroundColor = "orange";
    } else {
        playerHealthBar.style.backgroundColor = "red";
    }
    if (playerHealth === 0) {
        killPlayer();
    }
}

function damagePlayer() {
    playerHealth -= allowedPlayerDamageScore;
    if (playerHealth < 0) playerHealth = 0;
    updatePlayerHealth();
}

function killPlayer() {
    return;
}