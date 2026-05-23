let isPaused = false;
let isPlayerKilled = false;

const player = document.getElementById('player');
const gameContainer = document.getElementById('game-container');
const sector = document.getElementById('sector');
const playerHealthBar = document.getElementById('player-health-bar');

player.appendChild(sector);

const darknessOverlay = document.createElement('div');
darknessOverlay.id = 'darkness-overlay';
world.appendChild(darknessOverlay);

const playerIndicator = document.createElement('div');
playerIndicator.id = 'player-indicator';

gameContainer.appendChild(playerIndicator);

const cachedBulletBoxes = [];
for (let i = 1; i <= 9; i++) {
    cachedBulletBoxes.push(document.getElementById(`bullet-box-${i}`));
}

let playerHighScore = 0;
let playerScore = 0;
let timer = 60000;

let activeBuffEmoji = "";

function returnCurrentHighScore() {
    if (playerScore > playerHighScore) return playerScore;
    return playerHighScore;
}

function setTemporaryBuffIndicator(emoji, duration) {
    activeBuffEmoji = emoji;
    setTimeout(() => {
        if (activeBuffEmoji === emoji) {
            activeBuffEmoji = "";
        }
    }, duration);
}

function updatePlayerIndicator(zoneEmoji) {
    playerIndicator.textContent = activeBuffEmoji || zoneEmoji || "";
}

let SPEED = 2;
const MAX_PLAYER_HEALTH = 100;
const playerSize = 15;

let playerHealth = 100;
let allowedPlayerDamageScore = 10;
let playerBullets = 9;
let x = -40;
let y = -40;
let canShoot = true; 
const bullets = [];
let mousePos = [0, 0];

const keys = {
    ArrowUp: false, KeyW: false,
    ArrowDown: false, KeyS: false,
    ArrowLeft: false, KeyA: false,
    ArrowRight: false, KeyD: false,
    Space: false,
};

document.addEventListener('keydown', (event) => {
    if (event.code in keys) keys[event.code] = true;
});

document.addEventListener('keyup', (event) => {
    if (event.code in keys) keys[event.code] = false;
    if (event.code === 'Space') canShoot = true;
});

document.addEventListener('mousemove', (event) => {
    mousePos = [event.clientX, event.clientY];
});

function updateInventoryUI() {
    let weaponColor = '#78909C'; 
    
    if (typeof currentWeapon !== 'undefined') {
        if (currentWeapon === 'shootShortRanged') weaponColor = '#78909C';
        if (currentWeapon === 'shootLongRanged') weaponColor = '#00695C';
        if (currentWeapon === 'shootLaser') weaponColor = 'rgb(77, 76, 254)';
        if (currentWeapon === 'shootRicochetSingle') weaponColor = '#FFB300';
        if (currentWeapon === 'shootRicochetMulti') weaponColor = '#FF6D00';
    }

    for (let i = 0; i < 9; i++) {
        const box = cachedBulletBoxes[i];
        if (!box) continue;
        
        if (i < playerBullets) {
            box.classList.add('filled');
            box.style.backgroundColor = weaponColor; 
        } else {
            box.classList.remove('filled');
            box.style.backgroundColor = 'transparent'; 
        }
    }
}

updateInventoryUI();

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

    if (!isCollidingBox(nextX, y, playerSize)) x = nextX; 
    if (!isCollidingBox(x, nextY, playerSize)) y = nextY; 

    player.style.transform = `translate(${x}px, ${y}px)`;
}

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

    const transX = playerWorldX - 2000;
    const transY = playerWorldY - 2000;
    darknessOverlay.style.transform = `translate(${transX}px, ${transY}px) rotate(${finalRotation}deg)`;
}

function playerShoots() {
    if (keys.Space && canShoot && playerBullets > 0) {  
        canShoot = false; 
        let targetWorldX = mousePos[0] - cameraOffsetX;
        let targetWorldY = mousePos[1] - cameraOffsetY;

        window[currentWeapon]('player', x, y, targetWorldX, targetWorldY);

        playerBullets--;
        updateInventoryUI();
    }
}

function updatePlayerBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        
        if (Date.now() - b.createdAt > b.lifeSpan) {
            b.element.remove();
            bullets.splice(i, 1);
            continue; 
        }

        b.x += b.dx * b.speed; 
        if (!b.isLaser && isCollidingBox(b.x, b.y, 10, true)) {
            if (b.bounces > 0) {
                b.bounces--;
                b.x -= b.dx * b.speed; 
                b.dx = -b.dx;
            } else {
                b.element.remove();
                bullets.splice(i, 1);
                continue;
            }
        }

        b.y += b.dy * b.speed;
        if (!b.isLaser && isCollidingBox(b.x, b.y, 10, true)) {
            if (b.bounces > 0) {
                b.bounces--;
                b.y -= b.dy * b.speed; 
                b.dy = -b.dy; 
            } else {
                b.element.remove();
                bullets.splice(i, 1);
                continue;
            }       
        }
        b.element.style.transform = `translate(${b.x}px, ${b.y}px)`;
    }
}

function updatePlayerHealth() {
    const healthPercentage = playerHealth / MAX_PLAYER_HEALTH;
    playerHealthBar.style.width = (healthPercentage * 100) + '%';
    
    if (healthPercentage > 0.5) {
        playerHealthBar.style.backgroundColor = "rgb(48, 179, 36)";
    } else if (healthPercentage > 0.25) {
        playerHealthBar.style.backgroundColor = "rgb(219, 130, 12)";
    } else {
        playerHealthBar.style.backgroundColor = "rgb(194, 40, 12)";
    }
    
    if (playerHealth === 0) killPlayer();
}

function damagePlayer() {
    playerHealth -= allowedPlayerDamageScore;
    if (playerHealth < 0) playerHealth = 0;
    updatePlayerHealth();
}

function checkTimeout() {
    if (timer <= 0) {
        timer = 0;
        return true;
    }
    return false;
}

function killPlayer() {
    playerHighScore = returnCurrentHighScore();
    const gmElement = document.getElementById('game-menu');
    const rbElement = document.getElementById('resume-button');
    
    rbElement.textContent = `Play Again?`
    gmElement.style.display = 'grid';

    isPaused = true;
    isPlayerKilled = true;
}

let isTimerPaused = false; 

function startTimerCountdown() {
    setInterval(() => {
        if (timer > 0 && !isTimerPaused) {
            timer -= 1000;
        }
    }, 1000);
}