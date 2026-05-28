import { fireWeapon } from './projectiles.js';
import { checkSolidCollision } from './physics_engine.js';

// Constants and other Variables
const MAX_PLAYER_HEALTH = 100;
const STARTING_PLAYER_SPEED = 2;
const STARTING_TIMER = 60000;
const MAX_NUMBER_OF_BULLETS = 9;
const MAX_ALLOWED_PLAYER_DAMAGE = 10;
const STARTING_WEAPON = 'shootRicochetMulti';

// Constants for the continous game play
export let isPlayerKilled = false;
export let isPaused = false;
export let canShoot = true; 
export let isTimerPaused = false; 
let lastRotationTime = 0;

export function setTimerPaused(value) {
    isTimerPaused = value;
}

export function setPaused(value) {
    isPaused = value;
}

// Canvas Styling constants
export const PLAYER_SIZE = 15;
const PLAYER_COLOR = '#ffffff';

// Keys for controlling the player
const keys = {
    ArrowUp: false, KeyW: false,
    ArrowDown: false, KeyS: false,
    ArrowLeft: false, KeyA: false,
    ArrowRight: false, KeyD: false,
    Space: false,
};

export let mousePosition = [0, 0];

export let currentPlayerHealth = MAX_PLAYER_HEALTH;
export let currentPlayerSpeed = STARTING_PLAYER_SPEED;
export let currentTime = STARTING_TIMER;
export let currentNumberOfBullets = MAX_NUMBER_OF_BULLETS;
let isVisionBoostActive = false;
let isDarknessVisible = true;

export function getIsVisionBoostActive() {
    return isVisionBoostActive;
}

export function setIsVisionBoostActive(value) {
    isVisionBoostActive = value;
}

export function setDarknessVisible(visible) {
    isDarknessVisible = visible;
}

// Player position for the updating logic of the player
export let playerXPosition = -40;
export let playerYPosition = -40;

export let playerScore = 0;
let currentPlayerHighScore = 0;

export let currentWeapon = STARTING_WEAPON; 

// Getting elements across the document
const playerHealthBarElement = document.getElementById('player-health-bar');
const playerBulletInventoryElement = document.getElementById('player-bullet-box');
const gameMenuElement = document.getElementById('game-menu');
const resumeButtonElement = document.getElementById('resume-button');
const playerIndicatorElement = document.getElementById('player-indicator');
const timerElement = document.getElementById('timer');
const playerScoreElement = document.getElementById('player-high-score');

// Event listeners
window.addEventListener('mousemove', (event) => {
    mousePosition[0] = event.clientX;
    mousePosition[1] = event.clientY;
});

window.addEventListener('keydown', (event) => {
    if (event.code in keys) keys[event.code] = true;

    if (event.code === 'Escape') {
        if (!isPlayerKilled) {
            isPaused = !isPaused; 

            if (isPaused) {
                if (playerScore > currentPlayerHighScore) {
                    currentPlayerHighScore = playerScore;
                }
                
                if (playerScoreElement) {
                    playerScoreElement.innerHTML = `SCORE: ${playerScore} <br><br> HIGH SCORE: ${currentPlayerHighScore}`;
                }
            }
            
            if (gameMenuElement) {
                gameMenuElement.style.display = isPaused ? 'grid' : 'none';
            }
            
            if (resumeButtonElement) {
                resumeButtonElement.textContent = 'Resume';
            }
        }
    }
});

window.addEventListener('keyup', (event) => {
    if (event.code in keys) keys[event.code] = false;
    if (event.code === 'Space') canShoot = true;
})

// Rendering Logic of the Player
export function drawPlayer(ctx) {
    ctx.beginPath();

    ctx.fillStyle = PLAYER_COLOR;
    ctx.rect(playerXPosition, playerYPosition, PLAYER_SIZE, PLAYER_SIZE);

    ctx.fill();
    ctx.closePath();
}

export function drawLighting(ctx, canvas) {
    if (!isDarknessVisible) return;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const mouseAngle = Math.atan2(mousePosition[1] - cy, mousePosition[0] - cx);

    const CONE_HALF_ANGLE = 55 * (Math.PI / 180); 
    const CONE_RADIUS = 400;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, CONE_RADIUS,
        mouseAngle - CONE_HALF_ANGLE,
        mouseAngle + CONE_HALF_ANGLE);
    ctx.closePath();
    ctx.clip('evenodd');

    const proximityGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 350);
    proximityGrad.addColorStop(0,    'rgba(10, 12, 20, 0)');    
    proximityGrad.addColorStop(0.18, 'rgba(10, 12, 20, 0)');    
    proximityGrad.addColorStop(0.43, 'rgba(10, 12, 20, 0.55)'); 
    proximityGrad.addColorStop(1,    'rgba(10, 12, 20, 0.92)'); 

    ctx.fillStyle = proximityGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const edgeFade = ctx.createRadialGradient(
        cx, cy, CONE_RADIUS * 0.65,
        cx, cy, CONE_RADIUS
    );
    edgeFade.addColorStop(0, 'rgba(10, 12, 20, 0)');
    edgeFade.addColorStop(1, 'rgba(10, 12, 20, 0.78)');

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, CONE_RADIUS,
        mouseAngle - CONE_HALF_ANGLE,
        mouseAngle + CONE_HALF_ANGLE);
    ctx.closePath();
    ctx.fillStyle = edgeFade;
    ctx.fill();

    ctx.restore();

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const sectorTint = ctx.createRadialGradient(cx, cy, 0, cx, cy, CONE_RADIUS);
    sectorTint.addColorStop(0,    'rgba(142, 225, 65, 0.18)');
    sectorTint.addColorStop(0.55, 'rgba(142, 225, 65, 0.10)');
    sectorTint.addColorStop(1,    'rgba(142, 225, 65, 0)');

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, CONE_RADIUS,
        mouseAngle - CONE_HALF_ANGLE,
        mouseAngle + CONE_HALF_ANGLE);
    ctx.closePath();
    ctx.fillStyle = sectorTint;
    ctx.fill();

    ctx.restore();
}

// Updating Logic of the Player
// Player Movement
export function movePlayer() {
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

    let nextX = playerXPosition + (dx * currentPlayerSpeed);
    let nextY = playerYPosition + (dy * currentPlayerSpeed);

    if (!checkSolidCollision(nextX, playerYPosition, PLAYER_SIZE)) {
        playerXPosition = nextX;
    }
    if (!checkSolidCollision(playerXPosition, nextY, PLAYER_SIZE)) {
        playerYPosition = nextY;
    }
}

const cachedBulletBoxes = [];
for (let i = 1; i <= 9; i++) {
    cachedBulletBoxes.push(document.getElementById(`bullet-box-${i}`));
}

export function updateInventoryUI() {
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
        
        if (i < currentNumberOfBullets) {
            box.classList.add('filled');
            box.style.backgroundColor = weaponColor; 
        } else {
            box.classList.remove('filled');
            box.style.backgroundColor = 'transparent'; 
        }
    }
}

updateInventoryUI();

export function updatePlayerIndicator(emoji) {
    if (playerIndicatorElement) {
        playerIndicatorElement.textContent = emoji;
    }
}

// Player shooting capabilities
export function playerShoots(canvas) {
    if (canShoot && keys.Space && currentNumberOfBullets > 0) {
        canShoot = false;

        const cameraOffsetX = (canvas.width / 2) - playerXPosition - (PLAYER_SIZE / 2);
        const cameraOffsetY = (canvas.height / 2) - playerYPosition - (PLAYER_SIZE / 2);

        let targetWorldX = mousePosition[0] - cameraOffsetX;
        let targetWorldY = mousePosition[1] - cameraOffsetY;

        const startX = playerXPosition + (PLAYER_SIZE / 2);
        const startY = playerYPosition + (PLAYER_SIZE / 2);

        fireWeapon('player', currentWeapon, startX, startY, targetWorldX, targetWorldY);

        currentNumberOfBullets--;
        updateInventoryUI();
    }
}

// Player health and states
export function updatePlayerHealth() {
    if (!playerHealthBarElement) return;

    const playerHealthPercentage = currentPlayerHealth / MAX_PLAYER_HEALTH;
    playerHealthBarElement.style.width = (playerHealthPercentage * 100) + '%';

    if (playerHealthPercentage > 0.5) {
        playerHealthBarElement.style.backgroundColor = "rgb(48, 179, 36)";
    } else if (playerHealthPercentage > 0.25) {
        playerHealthBarElement.style.backgroundColor = "rgb(219, 130, 12)";
    } else {
        playerHealthBarElement.style.backgroundColor = "rgb(194, 40, 12)";
    }
}

export function damagePlayer() {
    currentPlayerHealth -= MAX_ALLOWED_PLAYER_DAMAGE;

    if (currentPlayerHealth <= 0) {
        currentPlayerHealth = 0;
        killPlayer();
    }

    updatePlayerHealth();
}

export function killPlayer() {
    isPlayerKilled = true;
    isPaused = true;
    
    if (playerScore > currentPlayerHighScore) {
        currentPlayerHighScore = playerScore;
    }

    if (playerScoreElement) {
        playerScoreElement.innerHTML = `SCORE: ${playerScore} <br><br> HIGH SCORE: ${currentPlayerHighScore}`;
    }

    if (resumeButtonElement) resumeButtonElement.textContent = 'Play Again?';
    if (gameMenuElement) gameMenuElement.style.display = 'grid';
}

export function resetPlayer() {
    isPlayerKilled = false;
    isPaused = false;
    currentPlayerHealth = 100;
    currentTime = 60000; 
    currentNumberOfBullets = 9;
    playerScore = 0;
    playerXPosition = -40;
    playerYPosition = -40;
    currentWeapon = STARTING_WEAPON;
    isDarknessVisible = true;
    isVisionBoostActive = false;
    
    updatePlayerHealth();
    updateInventoryUI();
    if (gameMenuElement) gameMenuElement.style.display = 'none';
}

export function addScoreAndTime(points, timeBonus) {
    playerScore += points;
    currentTime += timeBonus;

    console.log(`Score: ${playerScore} | Time: ${currentTime}`); 
}

// Status Manager Functions
export function healPlayer(amount) {
    currentPlayerHealth += amount;
    if (currentPlayerHealth > MAX_PLAYER_HEALTH) {
        currentPlayerHealth = MAX_PLAYER_HEALTH; 
    }
    updatePlayerHealth(); 
}

export function setPlayerSpeed(newSpeed) {
    currentPlayerSpeed = newSpeed;
}

export function changePlayerWeapon(newWeaponName) {
    currentWeapon = newWeaponName;
    currentNumberOfBullets = MAX_NUMBER_OF_BULLETS; 
    updateInventoryUI(); 
}

export let currentFlashlightRadius = 400; 
export function setVisionRadius(newRadius) {
    currentFlashlightRadius = newRadius;
}

export function setBullets(count) { currentNumberOfBullets = count; }
export function getSpeed() { return currentPlayerSpeed; }

// Time & Wallet System 
export function getWalletBalance() {
    return Math.floor(currentTime / 1000); 
}

export function spendTimeMoney(dollarCost) {
    const costInMs = dollarCost * 1000;

    if (currentTime > costInMs) {
        currentTime -= costInMs;
        console.log(`Purchase successful! Time left: ${getWalletBalance()}s`);
        return true;
    }
    
    console.log("Not enough time to buy this!");
    return false;
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

export function tickTimer(deltaTime) {
    if (isTimerPaused) return; 
    
    currentTime -= deltaTime;
    
    if (timerElement) {
        timerElement.textContent = `Score: ${playerScore} | ${formatTime(currentTime)}`;
    }
    
    if (currentTime <= 0) {
        currentTime = 0;

        if (timerElement) timerElement.textContent = `Score: ${playerScore} | 00:00`; 
        killPlayer();
    }
}